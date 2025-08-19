"""
Book document model for MongoDB.
"""
from datetime import datetime

from app.models.base import BaseDocument, ProcessingStatus
from pydantic import BaseModel, Field
from pymongo import IndexModel


class BookMetadata(BaseModel):
    """
    Book metadata embedded document.
    """

    file_size: int = Field(description="File size in bytes")
    file_type: str = Field(description="File MIME type")
    page_count: int | None = Field(default=None, description="Number of pages")
    language: str | None = Field(default=None, description="Detected language")
    isbn: str | None = Field(default=None, description="ISBN number")
    publisher: str | None = Field(default=None, description="Publisher name")
    publication_date: datetime | None = Field(
        default=None, description="Publication date"
    )
    subject: str | None = Field(default=None, description="Subject/category")
    keywords: list[str] = Field(default=[], description="Extracted keywords")


class Book(BaseDocument):
    """
    Book document schema.

    Represents uploaded PDF books with processing status and metadata.
    """

    # Core book information
    title: str = Field(description="Book title")
    author: str = Field(description="Book author")
    description: str | None = Field(default=None, description="Book description")

    # File information
    file_path: str = Field(description="Path to uploaded file")
    original_filename: str = Field(description="Original uploaded filename")

    # Processing information
    processing_status: ProcessingStatus = Field(
        default=ProcessingStatus.PENDING, description="Current processing status"
    )
    processing_started_at: datetime | None = Field(
        default=None, description="When processing started"
    )
    processing_completed_at: datetime | None = Field(
        default=None, description="When processing completed"
    )
    processing_error: str | None = Field(
        default=None, description="Error message if processing failed"
    )

    # Content information
    chapter_count: int | None = Field(
        default=None, description="Number of detected chapters"
    )
    total_words: int | None = Field(default=None, description="Total word count")
    extracted_text_preview: str | None = Field(
        default=None, description="First 500 characters of extracted text"
    )

    # Metadata
    metadata: BookMetadata | None = Field(default=None, description="Book metadata")

    # AI Analysis results
    ai_analysis: dict | None = Field(default=None, description="AI analysis results")

    # Upload information
    upload_date: datetime = Field(
        default_factory=datetime.utcnow, description="When the book was uploaded"
    )
    uploaded_by: str | None = Field(
        default=None, description="User who uploaded (for future auth)"
    )

    class Settings:
        name = "books"
        indexes = [
            IndexModel([("title", 1)]),
            IndexModel([("author", 1)]),
            IndexModel([("upload_date", -1)]),
            IndexModel([("processing_status", 1)]),
            IndexModel(
                [("title", "text"), ("author", "text"), ("description", "text")]
            ),
        ]
