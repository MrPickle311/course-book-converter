"""
Base model classes and common field types.
"""
from datetime import datetime, timezone
from enum import Enum

from beanie import Document
from pydantic import Field


class ProcessingStatus(str, Enum):
    """Processing status enumeration."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskType(str, Enum):
    """Task type enumeration."""

    CODING = "coding"
    WRITING = "writing"
    ANALYSIS = "analysis"
    FILE_UPLOAD = "file_upload"
    MULTIPLE_CHOICE = "multiple_choice"
    QUIZ = "quiz"


class DifficultyLevel(str, Enum):
    """Difficulty level enumeration."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class BaseDocument(Document):
    """
    Base document class with common fields.
    """

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime | None = Field(default=None)

    async def save(self, *args, **kwargs):
        """Override save to update timestamp."""
        self.updated_at = datetime.now(timezone.utc)
        return await super().save(*args, **kwargs)

    class Settings:
        # Common database settings
        use_cache = True
        cache_expiration_time = 300  # 5 minutes
