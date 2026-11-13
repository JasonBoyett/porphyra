from uuid import UUID, uuid7

import pytest
from sqlmodel import Session, SQLModel

from app.db.engine import create_database_engine
from app.db.models import Church
from app.errors import EmptyResponseError


def test_database_model_assigns_uuid_and_created_at_and_looks_up_records() -> None:
    engine = create_database_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    try:
        with Session(engine) as db:
            church = Church(name="Grace Harbor Church")
            db.add(church)
            db.commit()

            assert isinstance(church.id, UUID)
            assert church.created_at is not None
            assert Church.get_or_404(db, church.id) is church
    finally:
        SQLModel.metadata.drop_all(engine)
        engine.dispose()


def test_database_model_get_or_404_raises_empty_response_error() -> None:
    engine = create_database_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    try:
        with Session(engine) as db:
            with pytest.raises(EmptyResponseError) as error:
                Church.get_or_404(db, uuid7())
            assert error.value.status_code == 404
    finally:
        SQLModel.metadata.drop_all(engine)
        engine.dispose()


def test_database_model_delete_removes_and_commits_record() -> None:
    engine = create_database_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    try:
        with Session(engine) as db:
            church = Church(name="Riverstone Community Church")
            db.add(church)
            db.commit()
            church_id = church.id

            church.delete(db)
            assert db.get(Church, church_id) is None
    finally:
        SQLModel.metadata.drop_all(engine)
        engine.dispose()
