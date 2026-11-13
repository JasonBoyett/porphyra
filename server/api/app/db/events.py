from collections.abc import Iterable
from typing import cast

from sqlalchemy import event
from sqlalchemy.orm import UOWTransaction
from sqlmodel import Session

from app.db.models.campus import Campus
from app.db.models.church import Church


@event.listens_for(Session, "before_flush")
def setup_base_campuses_before_flush(
    db: Session,
    _: UOWTransaction,
    __: object,
) -> None:
    for record in cast(Iterable[object], db.new):
        if isinstance(record, Church):
            if record.campuses:
                continue
            db.add(Campus(church_id=record.id, name="Main Campus"))
