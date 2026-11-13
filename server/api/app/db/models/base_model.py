from __future__ import annotations

from datetime import datetime
from typing import Self
from uuid import UUID, uuid7

from fastapi import status
from sqlalchemy import DateTime, Uuid
from sqlmodel import Field, Session, SQLModel

from app.db.utils import utc_now
from app.errors import EmptyResponseError


class DatabaseModel(SQLModel):
    """Shared persisted-record behavior for SQLModel table models."""

    id: UUID = Field(
        default_factory=uuid7,
        sa_type=Uuid(as_uuid=True),
        primary_key=True,
        nullable=False,
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_type=DateTime(timezone=True),
        nullable=False,
    )

    @classmethod
    def get_or_404(cls, db: Session, record_id: UUID) -> Self:
        record = db.get(cls, record_id)
        if record is None:
            raise EmptyResponseError(status.HTTP_404_NOT_FOUND)
        return record

    def delete(self, db: Session) -> None:
        db.delete(self)
        db.commit()
