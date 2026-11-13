from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PORPHYRA_")

    environment: str = "development"
    database_url: str = "sqlite:///./porphyra.sqlite3"
    auth_issuer: str = "http://localhost:4000"
    auth_audience: str = "porphyra-api"
    auth_jwt_secret: str = "porphyra-development-jwt-secret-2026"


settings = Settings()
