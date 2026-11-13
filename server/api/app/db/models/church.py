from __future__ import annotations

from app.db.models.base_model import DatabaseModel


class Church(DatabaseModel, table=True):
    __tablename__ = "churches"  # type: ignore[reportAssignmentType]

    name: str
