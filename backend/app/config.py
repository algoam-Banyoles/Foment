from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./app.db"
    admin_token: str = "secret"
    supabase_url: str = ""
    supabase_service_key: str = ""

settings = Settings()
