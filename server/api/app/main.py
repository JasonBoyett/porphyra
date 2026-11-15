from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlmodel import Session, SQLModel

import app.db.models
from app.api.v1.router import router as v1_router
from app.db.engine import engine
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
	application.include_router(v1_router)

	@application.exception_handler(EmptyResponseError)
	async def empty_response_handler(
		_: Request, error: EmptyResponseError
	) -> Response:
		return Response(status_code=error.status_code)

	@application.get("/health")
	def health() -> dict[str, str]:
		return {"status": "ok", "service": "porphyra-api"}

	return application


app = create_app()
