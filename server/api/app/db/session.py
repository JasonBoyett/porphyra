from __future__ import annotations

from collections.abc import Generator

from sqlalchemy.orm import sessionmaker
from sqlmodel import Session

from app.db.engine import engine

SessionFactory = sessionmaker(class_=Session, bind=engine, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    with SessionFactory() as session:
        yield session
