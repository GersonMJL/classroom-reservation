from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    project_name: str = "Classroom Reservation System"
    api_v1_str: str = "/api/v1"
    environment: str = "development"
    log_level: str = "INFO"

    database_url: str = "postgresql://postgres:postgres@db:5432/app"
    sqlalchemy_echo: bool = False
    db_pool_size: int = 20
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800

    redis_url: str = "redis://redis:6379/0"
    redis_enabled: bool = True
    redis_timeout_seconds: float = 2.0

    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    rate_limit_enabled: bool = True
    rate_limit_requests_per_minute: int = 120
    rate_limit_login_per_minute: int = 10

    noshow_job_enabled: bool = True
    noshow_job_interval_seconds: int = 300

    overtime_job_enabled: bool = True
    overtime_job_interval_seconds: int = 300
    overtime_grace_minutes: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
