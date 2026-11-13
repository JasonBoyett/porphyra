from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.errors import EmptyResponseError
from app.seed.load import load_seed_data


def create_app() -> FastAPI:
    application = FastAPI(title="Porphyra API", version="v1")
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

    @application.get("/api/v1/dashboard")
    def dashboard() -> dict[str, object]:
        return load_seed_data()

    return application


app = create_app()
