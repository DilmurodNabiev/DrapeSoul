from pydantic_settings import BaseSettings, SettingsConfigDict


class BotSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    BOT_TOKEN: str = ""
    WEBAPP_URL: str = "http://localhost:5173"
    APP_NAME: str = "DrapeSoul"


settings = BotSettings()
