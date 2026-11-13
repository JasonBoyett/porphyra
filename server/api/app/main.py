from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlmodel import SQLModel

import app.db.models
from app.auth import CurrentUser
from app.db.engine import engine
from app.db.models.user import User
from app.errors import EmptyResponseError
from app.seed.load import load_seed_data


@asynccontextmanager
async def lifespan(_: FastAPI):
    SQLModel.metadata.create_all(engine)
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
    def dashboard(user: CurrentUser) -> dict[str, object]:
        data = load_seed_data()
        data["viewer"] = {"email": user.email, "roles": []}
        return data

    return application


app = create_app()
