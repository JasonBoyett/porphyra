from __future__ import annotations

import sqlite3
from typing import cast

from sqlalchemy import Engine, event
from sqlmodel import create_engine

from app.config import settings


def create_database_engine(database_url: str) -> Engine:
    connect_args: dict[str, object] = {}
    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    engine = create_engine(database_url, connect_args=connect_args)

    if database_url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def enable_sqlite_foreign_keys(
            dbapi_connection: object, _: object
        ) -> None:
            connection = cast(sqlite3.Connection, dbapi_connection)
            connection.execute("PRAGMA foreign_keys=ON")

    return engine


engine = create_database_engine(settings.database_url)
