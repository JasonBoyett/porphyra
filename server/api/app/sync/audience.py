from uuid import UUID

from sqlmodel import Session, select

from app.db.models import ChurchMembership


def church_member_user_ids(db: Session, church_id: UUID) -> list[UUID]:
    """Resolve the authorized church-wide audience for a domain mutation."""
    return list(
        db.exec(
            select(ChurchMembership.user_id).where(
                ChurchMembership.church_id == church_id
            )
        ).all()
    )
