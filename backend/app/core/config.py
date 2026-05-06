from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Any, Optional


class Settings(BaseSettings):
    APP_NAME: str = "Taskky"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"

    # Set as Optional to avoid startup validation failure, but ensure they are provided in env
    DATABASE_URL: Optional[str] = None
    SECRET_KEY: Optional[str] = None
    REFRESH_SECRET_KEY: Optional[str] = None
    
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = "http://localhost:3000"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: Any) -> Any:
        if isinstance(v, str):
            # Handle Railway's postgres:// scheme and ensure asyncpg driver
            url = v.replace("postgres://", "postgresql+asyncpg://", 1)
            if not url.startswith("postgresql+asyncpg://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


settings = Settings()
