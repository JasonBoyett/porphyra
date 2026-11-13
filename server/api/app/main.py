from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlmodel import Session, SQLModel, select

import app.db.models
from app.auth import CurrentUser
from app.db.engine import engine
from app.db.models.church_membership import ChurchMembership
from app.db.models.user import User
from app.db.session import get_db
from app.errors import EmptyResponseError
from app.seed.load import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    SQLModel.metadata.create_all(engine)
    with Session(engine) as db:
        seed_database(db)
    yield


def create_app() -> FastAPI:
    application = FastAPI(title="Porphyra API", version="v1", lifespan=lifespan)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.exception_handler(EmptyResponseError)
    async def empty_response_handler(
        _: Request, error: EmptyResponseError
    ) -> Response:
        return Response(status_code=error.status_code)

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "porphyra-api"}

    @application.get("/api/v1/me")
    def me(user: CurrentUser) -> User:
        return user

    @application.get("/api/v1/dashboard")
    def dashboard(
        user: CurrentUser,
        db: Annotated[Session, Depends(get_db)],
    ) -> dict[str, object]:
        memberships = db.exec(
            select(ChurchMembership).where(ChurchMembership.user_id == user.id)
        ).all()
        churches = [
            {
                "id": str(membership.church.id),
                "name": membership.church.name,
                "description": membership.church.description,
                "campuses": [
                    {
                        "id": str(campus.id),
                        "name": campus.name,
                        "city": campus.city,
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
                        membership.church.ministries, key=lambda ministry: ministry.name
                    )
                ],
            }
            for membership in memberships
        ]
        return {
            "viewer": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
            },
            "churches": churches,
        }

    return application


app = create_app()
