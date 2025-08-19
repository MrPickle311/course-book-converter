"""
Chapter document model for MongoDB.
"""
from decimal import Decimal

from app.models.base import BaseDocument, DifficultyLevel
from app.models.course import Course
from beanie import Link
from pydantic import BaseModel, Field
from pymongo import IndexModel


class ChapterContent(BaseModel):
    """
    Chapter content embedded document.
    """

    raw_text: str = Field(description="Original extracted text")
    processed_text: str = Field(description="AI-processed and enhanced text")
    summary: str = Field(description="Chapter summary")
    key_concepts: list[str] = Field(default=[], description="Key concepts covered")
    examples: list[str] = Field(default=[], description="Examples and case studies")

    # Media content
    images: list[dict] = Field(default=[], description="Images with metadata")
    diagrams: list[dict] = Field(default=[], description="Diagrams and charts")
    code_snippets: list[dict] = Field(default=[], description="Code examples")


class LearningObjective(BaseModel):
    """
    Chapter-specific learning objective.
    """

    objective: str = Field(description="Learning objective statement")
    bloom_level: str = Field(description="Bloom's taxonomy level")
    assessment_method: str | None = Field(
        default=None, description="How this objective is assessed"
    )


class Chapter(BaseDocument):
    """
    Chapter document schema.

    Represents individual chapters within courses.
    """

    # Core chapter information
    course_id: Link[Course] = Field(description="Reference to parent course")
    chapter_number: int = Field(description="Chapter sequence number")
    title: str = Field(description="Chapter title")
    subtitle: str | None = Field(default=None, description="Chapter subtitle")

    # Content
    content: ChapterContent = Field(description="Chapter content")

    # Learning information
    learning_objectives: list[LearningObjective] = Field(
        default=[], description="Chapter-specific learning objectives"
    )
    prerequisites: list[str] = Field(
        default=[], description="Prerequisites for this chapter"
    )
    difficulty_level: DifficultyLevel = Field(
        default=DifficultyLevel.INTERMEDIATE, description="Chapter difficulty level"
    )

    # Time estimates
    estimated_reading_time_minutes: int | None = Field(
        default=None, description="Estimated reading time"
    )
    estimated_completion_time_minutes: int | None = Field(
        default=None, description="Estimated total completion time including tasks"
    )

    # Structure information
    word_count: int | None = Field(default=None, description="Chapter word count")
    task_count: int = Field(default=0, description="Number of tasks in this chapter")

    # AI Analysis
    ai_summary: str | None = Field(
        default=None, description="AI-generated chapter summary"
    )
    complexity_score: float | None = Field(
        default=None, description="AI-assessed complexity score (0-1)"
    )
    quality_score: float | None = Field(
        default=None, description="AI-assessed content quality score (0-1)"
    )

    # Pricing
    price: Decimal = Field(
        default=Decimal("9.99"), description="Individual chapter price"
    )
    is_free_preview: bool = Field(
        default=False, description="Whether this chapter is available as free preview"
    )

    # Access control
    is_published: bool = Field(
        default=False, description="Whether chapter is published"
    )
    requires_previous_completion: bool = Field(
        default=True, description="Whether previous chapters must be completed"
    )

    # Navigation
    previous_chapter_id: str | None = Field(
        default=None, description="Previous chapter ID"
    )
    next_chapter_id: str | None = Field(default=None, description="Next chapter ID")

    # Statistics
    view_count: int = Field(default=0, description="Number of views")
    completion_count: int = Field(default=0, description="Number of completions")
    average_completion_time_minutes: float | None = Field(
        default=None, description="Average time users take to complete"
    )
    user_rating: float | None = Field(
        default=None, description="Average user rating (1-5)"
    )

    class Settings:
        name = "chapters"
        indexes = [
            IndexModel([("course_id", 1)]),
            IndexModel([("chapter_number", 1)]),
            IndexModel([("course_id", 1), ("chapter_number", 1)], unique=True),
            IndexModel([("title", "text"), ("content.summary", "text")]),
            IndexModel([("is_published", 1)]),
            IndexModel([("difficulty_level", 1)]),
        ]
