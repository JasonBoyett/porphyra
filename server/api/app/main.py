from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlmodel import Session, SQLModel

import app.db.models
from app.api.v1.events.campus.sync import campus_sync_resources
from app.api.v1.router import router as v1_router
from app.config import settings
from app.db.engine import engine
from app.errors import EmptyResponseError
from app.seed.load import seed_database
from app.seed.maintain import maintain_seed_dates
from app.sync.call_key import reset_call_key, set_call_key
from app.sync.contracts import sync_openapi_resources


@asynccontextmanager
async def lifespan(_: FastAPI):
    SQLModel.metadata.create_all(engine)
    if settings.environment == "development":
        maintain_seed_dates()
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
    application.include_router(v1_router)
    # Validate endpoint bindings before the OpenAPI contract is exported.
    sync_openapi_resources(application, campus_sync_resources)

    @application.middleware("http")
    async def sync_call_key_context(request: Request, call_next):
        token = set_call_key(request)
        try:
            return await call_next(request)
        finally:
            reset_call_key(token)

    @application.exception_handler(EmptyResponseError)
    async def empty_response_handler(_: Request, error: EmptyResponseError) -> Response:
        return Response(status_code=error.status_code)

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "porphyra-api"}

    return application


app = create_app()
