from __future__ import annotations

from app.db.models.base_model import DatabaseModel


class Church(DatabaseModel, table=True):
    name: str
