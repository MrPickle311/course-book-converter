"""
Application configuration using Pydantic Settings.
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    """

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    # Application settings
    app_name: str = Field(
        default="Book to Course Converter Backend", description="Application name"
    )
    debug: bool = Field(default=False, description="Debug mode")
    host: str = Field(default="127.0.0.1", description="Server host")
    port: int = Field(default=8000, description="Server port")

    # CORS settings
    allowed_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        description="Allowed CORS origins",
    )

    # Database settings (for future MongoDB integration)
    database_url: str = Field(
        default="mongodb://localhost:27017", description="Database connection URL"
    )
    database_name: str = Field(
        default="book_course_converter", description="Database name"
    )

    # File storage settings
    upload_dir: str = Field(
        default="./uploads", description="Directory for uploaded files"
    )
    max_file_size: int = Field(
        default=50 * 1024 * 1024, description="Maximum file size in bytes"  # 50MB
    )

    # AI/OpenAI settings (for future implementation)
    openai_api_key: str = Field(default="", description="OpenAI API key")
    openai_model: str = Field(default="gpt-4", description="OpenAI model to use")

    # Security settings
    secret_key: str = Field(
        default="your-secret-key-change-this-in-production",
        description="Secret key for JWT tokens",
    )
    access_token_expire_minutes: int = Field(
        default=30, description="Access token expiration time in minutes"
    )


# Create global settings instance
settings = Settings()
