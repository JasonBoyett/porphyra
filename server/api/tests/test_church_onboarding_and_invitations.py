from uuid import UUID, uuid4

import jwt
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.config import settings
from app.db.engine import engine
from app.db.models import (
    Church,
    ChurchMembership,
    ChurchRole,
    ChurchRoleAssignment,
    Invitation,
    Ministry,
    RecurringService,
    Team,
    TeamMembership,
    User,
)
from app.main import app


def _token(subject: str) -> str:
    return jwt.encode(
        {
            "aud": settings.auth_audience,
            "email": f"{subject}@example.com",
            "exp": 4_102_444_800,
            "iss": settings.auth_issuer,
            "name": subject,
            "sub": subject,
        },
        settings.auth_jwt_secret,
        algorithm="HS256",
    )


def _headers(subject: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {_token(subject)}"}


def test_onboarding_atomically_creates_campuses_service_and_creator_admin() -> None:
    name = f"Onboarding {uuid4()}"
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/churches/",
            headers=_headers("onboarding-creator"),
            json={
                "idempotencyKey": str(uuid4()),
                "name": name,
                "campuses": [
                    {
                        "name": "Online",
                        "campusType": "online",
                        "timeZone": "Europe/London",
                        "recurringServices": [
                            {
                                "name": "Weekly Gathering",
                                "weekday": 6,
                                "startsAt": "10:30:00",
                            }
                        ],
                    }
                ],
            },
        )
    assert response.status_code == 201, response.text
    church_id = UUID(response.json()["id"])
    assert response.json()["primaryCampusId"] == response.json()["campuses"][0]["id"]
    assert response.json()["campuses"][0]["location"]["addressLine1"] is None

    with Session(engine) as db:
        church = db.get(Church, church_id)
        assert church is not None
        assert (
            db.exec(
                select(RecurringService).where(
                    RecurringService.campus_id == church.primary_campus_id
                )
            )
            .one()
            .weekday
            == 6
        )
        creator = db.exec(
            select(User).where(User.auth_id == "onboarding-creator")
        ).one()
        membership = db.exec(
            select(ChurchMembership).where(
                ChurchMembership.church_id == church.id,
                ChurchMembership.user_id == creator.id,
            )
        ).one()
        assignment = db.exec(
            select(ChurchRoleAssignment).where(
                ChurchRoleAssignment.church_membership_id == membership.id
            )
        ).one()
        assert db.get(ChurchRole, assignment.church_role_id).is_administrator  # type: ignore[union-attr]


def test_onboarding_rejects_invalid_iana_time_zone_without_partial_church() -> None:
    name = f"Invalid timezone {uuid4()}"
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/churches/",
            headers=_headers("invalid-timezone-creator"),
            json={
                "idempotencyKey": str(uuid4()),
                "name": name,
                "campuses": [{"name": "Campus", "timeZone": "Mars/Olympus"}],
            },
        )
    assert response.status_code == 422
    with Session(engine) as db:
        assert db.exec(select(Church).where(Church.name == name)).one_or_none() is None


def test_primary_campus_rejects_a_campus_from_another_church() -> None:
    with TestClient(app) as client:
        first = client.post(
            "/api/v1/churches/",
            headers=_headers("primary-campus-creator"),
            json={
                "idempotencyKey": str(uuid4()),
                "name": f"First {uuid4()}",
                "campuses": [{"name": "First campus"}],
            },
        ).json()
        second = client.post(
            "/api/v1/churches/",
            headers=_headers("primary-campus-creator"),
            json={
                "idempotencyKey": str(uuid4()),
                "name": f"Second {uuid4()}",
                "campuses": [{"name": "Second campus"}],
            },
        ).json()
        response = client.patch(
            f"/api/v1/churches/{first['id']}/primary-campus",
            headers=_headers("primary-campus-creator"),
            json={"primaryCampusId": second["campuses"][0]["id"]},
        )
    assert response.status_code == 422


def test_hashed_single_use_invitation_redemption_creates_membership() -> None:
    with TestClient(app) as client:
        church = client.post(
            "/api/v1/churches/",
            headers=_headers("invitation-creator"),
            json={
                "idempotencyKey": str(uuid4()),
                "name": f"Invitation church {uuid4()}",
                "campuses": [{"name": "Campus"}],
            },
        ).json()
        created = client.post(
            "/api/v1/invitations/",
            headers=_headers("invitation-creator"),
            json={"churchId": church["id"]},
        )
        assert created.status_code == 201, created.text
        raw_token = created.json()["token"]
        invitation_id = UUID(created.json()["id"])
        first_claim = client.post(
            "/api/v1/invitations/redeem",
            headers=_headers("invitation-recipient"),
            json={"token": raw_token},
        )
        second_claim = client.post(
            "/api/v1/invitations/redeem",
            headers=_headers("second-invitation-recipient"),
            json={"token": raw_token},
        )
    assert first_claim.status_code == 200, first_claim.text
    assert second_claim.status_code == 410
    with Session(engine) as db:
        invitation = db.get(Invitation, invitation_id)
        assert invitation is not None
        assert invitation.token_hash != raw_token
        assert invitation.redeemed_at is not None


def test_scoped_invitation_applies_team_and_role_and_revocation_blocks_claim() -> None:
    creator_subject = f"scoped-invitation-creator-{uuid4()}"
    recipient_subject = f"scoped-invitation-recipient-{uuid4()}"
    with TestClient(app) as client:
        church_data = client.post(
            "/api/v1/churches/",
            headers=_headers(creator_subject),
            json={
                "idempotencyKey": str(uuid4()),
                "name": f"Scoped invitation church {uuid4()}",
                "campuses": [{"name": "Campus"}],
            },
        ).json()
    church_id = UUID(church_data["id"])
    campus_id = UUID(church_data["campuses"][0]["id"])
    with Session(engine) as db:
        ministry = Ministry(name="Worship", church_id=church_id)
        role = ChurchRole(name="Planner", church_id=church_id)
        db.add(ministry)
        db.add(role)
        db.flush()
        team = Team(name="Band", ministry_id=ministry.id)
        db.add(team)
        db.commit()
        team_id = team.id
        role_id = role.id

    with TestClient(app) as client:
        created = client.post(
            "/api/v1/invitations/",
            headers=_headers(creator_subject),
            json={
                "churchId": str(church_id),
                "campusId": str(campus_id),
                "teamIds": [str(team_id)],
                "roleIds": [str(role_id)],
            },
        )
        assert created.status_code == 201, created.text
        claim = client.post(
            "/api/v1/invitations/redeem",
            headers=_headers(recipient_subject),
            json={"token": created.json()["token"]},
        )
        assert claim.status_code == 200, claim.text

        revoked = client.post(
            "/api/v1/invitations/",
            headers=_headers(creator_subject),
            json={"churchId": str(church_id)},
        )
        client.delete(
            f"/api/v1/invitations/{revoked.json()['id']}",
            headers=_headers(creator_subject),
        )
        blocked = client.post(
            "/api/v1/invitations/redeem",
            headers=_headers(f"blocked-{uuid4()}"),
            json={"token": revoked.json()["token"]},
        )
    assert blocked.status_code == 410
    with Session(engine) as db:
        recipient = db.exec(select(User).where(User.auth_id == recipient_subject)).one()
        membership = db.exec(
            select(ChurchMembership).where(
                ChurchMembership.church_id == church_id,
                ChurchMembership.user_id == recipient.id,
            )
        ).one()
        assert (
            db.exec(
                select(TeamMembership).where(
                    TeamMembership.church_membership_id == membership.id,
                    TeamMembership.team_id == team_id,
                )
            ).one_or_none()
            is not None
        )
        role_assignment = db.exec(
            select(ChurchRoleAssignment).where(
                ChurchRoleAssignment.church_membership_id == membership.id,
                ChurchRoleAssignment.church_role_id == role_id,
            )
        ).one()
        assert role_assignment.campus_id == campus_id
