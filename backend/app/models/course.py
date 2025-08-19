"""
Course document model for MongoDB.
"""
from datetime import datetime
from decimal import Decimal

from app.models.base import BaseDocument, ProcessingStatus
from app.models.book import Book
from beanie import Link
from pydantic import BaseModel, Field
from pymongo import IndexModel


class LearningObjective(BaseModel):
    """
    Learning objective embedded document.
    """

    id: str = Field(description="Unique objective ID")
    title: str = Field(description="Objective title")
    description: str = Field(description="Detailed description")
    bloom_level: str = Field(description="Bloom's taxonomy level")
    estimated_time_minutes: int | None = Field(
        default=None, description="Estimated time to complete"
    )


class CoursePricing(BaseModel):
    """
    Course pricing information embedded document.
    """

    pricing_model: str = Field(
        default="per_chapter",
        description="Pricing model (per_chapter, full_course, etc.)",
    )
    base_price_per_chapter: Decimal = Field(
        default=Decimal("9.99"), description="Base price per chapter"
    )
    full_course_discount_percentage: Decimal | None = Field(
        default=Decimal("20.0"), description="Discount for purchasing full course"
    )
    currency: str = Field(default="USD", description="Currency code")


class Course(BaseDocument):
    """
    Course document schema.

    Represents AI-generated courses created from books.
    """

    # Core course information
    book_id: Link[Book] = Field(description="Reference to source book")
    title: str = Field(description="Course title")
    description: str = Field(description="Course description")
    short_description: str | None = Field(
        default=None, description="Brief course summary"
    )

    # Course structure
    total_chapters: int = Field(description="Total number of chapters")
    estimated_duration_hours: int | None = Field(
        default=None, description="Estimated course duration in hours"
    )
    difficulty_level: str = Field(
        default="intermediate", description="Course difficulty level"
    )

    # Learning information
    learning_objectives: list[LearningObjective] = Field(
        default=[], description="Course learning objectives"
    )
    prerequisites: list[str] = Field(default=[], description="Course prerequisites")
    target_audience: list[str] = Field(
        default=[], description="Target audience descriptions"
    )
    tags: list[str] = Field(default=[], description="Course tags for categorization")

    # Generation information
    generation_status: ProcessingStatus = Field(
        default=ProcessingStatus.PENDING, description="Course generation status"
    )
    generation_started_at: datetime | None = Field(
        default=None, description="When generation started"
    )
    generation_completed_at: datetime | None = Field(
        default=None, description="When generation completed"
    )
    generation_error: str | None = Field(
        default=None, description="Error message if generation failed"
    )

    # AI Analysis
    ai_analysis: dict | None = Field(
        default=None, description="AI analysis results for course generation"
    )
    quality_score: float | None = Field(
        default=None, description="AI-assessed quality score (0-1)"
    )

    # Pricing
    pricing: CoursePricing = Field(
        default_factory=CoursePricing, description="Course pricing information"
    )

    # Publication information
    is_published: bool = Field(default=False, description="Whether course is published")
    published_at: datetime | None = Field(
        default=None, description="When course was published"
    )

    # Statistics
    view_count: int = Field(default=0, description="Number of views")
    enrollment_count: int = Field(default=0, description="Number of enrollments")
    completion_rate: float | None = Field(
        default=None, description="Course completion rate (0-1)"
    )
    average_rating: float | None = Field(
        default=None, description="Average user rating (1-5)"
    )

    class Settings:
        name = "courses"
        indexes = [
            IndexModel([("book_id", 1)]),
            IndexModel([("title", 1)]),
            IndexModel([("generation_status", 1)]),
            IndexModel([("is_published", 1)]),
            IndexModel([("tags", 1)]),
            IndexModel([("book_id", 1), ("title", 1)]),
            IndexModel([("title", "text"), ("description", "text"), ("tags", "text")]),
        ]
