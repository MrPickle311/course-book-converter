"""
Application configuration using Pydantic Settings.
"""

from typing import List

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
    allowed_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        description="Allowed CORS origins",
    )

    # Database settings
    database_url: str = Field(
        default="mongodb://localhost:27017", description="Database connection URL"
    )
    database_name: str = Field(
        default="book_course_converter", description="Database name"
    )

    # Database connection pool settings
    db_max_connections: int = Field(default=100)
    db_min_connections: int = Field(default=10)
    db_max_idle_time_ms: int = Field(default=30000)
    db_server_selection_timeout_ms: int = Field(default=5000)
    db_connect_timeout_ms: int = Field(default=10000)
    db_socket_timeout_ms: int = Field(default=30000)

    # File storage settings
    upload_dir: str = Field(default="./uploads")
    max_file_size: int = Field(default=50 * 1024 * 1024)

    # PDF Processing defaults (text-only)
    pdf_ocr_enabled: bool = Field(default=False)
    pdf_ocr_language: str = Field(default="eng")
    pdf_max_file_size: int = Field(default=100 * 1024 * 1024)
    pdf_extract_images: bool = Field(default=False)
    pdf_extract_tables: bool = Field(default=False)

    # PDF cleaning and ToC behavior
    pdf_discard_titles: List[str] = Field(
        default=[
            "foreword",
            "preface",
            "acknowledgments",
            "praise",
            "about the author",
            "copyright",
            "index",
        ],
        description="Headings to discard from chapters/ToC",
    )
    pdf_discard_before_page: int = Field(
        default=1, description="Discard items before this zero-based page index"
    )
    pdf_toc_title_keywords: List[str] = Field(
        default=["table of contents", "contents"],
        description="Keywords to detect ToC pages",
    )

    # AI/OpenAI settings (for future implementation)
    openai_api_key: str = Field(default="")
    openai_model: str = Field(default="gpt-4")

    # Security settings
    secret_key: str = Field(default="your-secret-key-change-this-in-production")
    access_token_expire_minutes: int = Field(default=30)


# Create global settings instance
settings = Settings()
