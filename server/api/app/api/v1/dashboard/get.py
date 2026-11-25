from fastapi import APIRouter
from sqlmodel import select

from app.api.v1.campuses._responses import campus_location_response
from app.api.v1.dashboard.schemas import DashboardResponse
from app.api.v1.dependencies.database import DatabaseSession
from app.auth import CurrentUser
from app.db.models import ChurchMembership
from app.sync.openapi import sync_tags

router = APIRouter()


@router.get(
	"/",
	operation_id="getDashboard",
	openapi_extra=sync_tags("dashboard"),
)
def get_dashboard(user: CurrentUser, db: DatabaseSession) -> DashboardResponse:
	memberships = db.exec(
		select(ChurchMembership).where(ChurchMembership.user_id == user.id)
	).all()
	churches = [
		{
			"id": str(membership.church.id),
			"avatarUrl": membership.church.avatar_url,
			"name": membership.church.name,
			"description": membership.church.description,
			"campuses": [
				{
					"id": str(campus.id),
					"name": campus.name,
					"location": campus_location_response(campus),
				}
				for campus in sorted(
					membership.church.campuses,
					key=lambda campus: campus.name,
				)
			],
			"ministries": [
				{
					"id": str(ministry.id),
					"name": ministry.name,
					"teams": [
						{"id": str(team.id), "name": team.name}
						for team in sorted(
							ministry.teams,
							key=lambda team: team.name,
						)
					],
				}
				for ministry in sorted(
					membership.church.ministries,
					key=lambda ministry: ministry.name,
				)
			],
		}
		for membership in memberships
	]
	return DashboardResponse.model_validate({
		"viewer": {
			"id": user.id,
			"avatarUrl": user.avatar_url,
			"email": user.email,
			"name": user.name,
		},
		"churches": churches,
	})
