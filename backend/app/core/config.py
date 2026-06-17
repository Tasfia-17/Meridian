from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    cleanverse_api_id: str
    cleanverse_api_key: str
    cleanverse_base_url: str = "https://uatapi.cleanverse.com/api/cooperate"


settings = Settings()
