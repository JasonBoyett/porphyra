from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import event
from sqlalchemy.orm import Session as SqlAlchemySession
from sqlalchemy.orm import sessionmaker
from sqlmodel import Session

from app.db.engine import engine

SessionFactory = sessionmaker(class_=Session, bind=engine, expire_on_commit=False)


@event.listens_for(SqlAlchemySession, "after_commit")
def _dispatch_sync_notifications(session: SqlAlchemySession) -> None:
    from app.sync.publish import dispatch_session_notifications

    dispatch_session_notifications(session)


@event.listens_for(SqlAlchemySession, "after_rollback")
def _discard_sync_notifications(session: SqlAlchemySession) -> None:
    from app.sync.publish import discard_session_notifications

    discard_session_notifications(session)


def get_db() -> Generator[Session, None, None]:
    with SessionFactory() as session:
        yield session
