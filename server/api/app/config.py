from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "development"
    database_url: str = "sqlite:///./porphyra.sqlite3"
    auth_issuer: str = "http://localhost:4000"


settings = Settings()
