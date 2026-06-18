from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "sqlite+aiosqlite:///./data/imdb.db"
    cors_origins: list[str] = ["http://localhost:3000"]
    llm_api_key: str = ""
    intent_daily_cap: int = 100


settings = Settings()
