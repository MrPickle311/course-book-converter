"""
Task document model for MongoDB.
"""
from typing import Any

from app.models.base import BaseDocument, DifficultyLevel, TaskType
from app.models.chapter import Chapter
from beanie import Link
from pydantic import BaseModel, Field
from pymongo import IndexModel


class TaskInstructions(BaseModel):
    """
    Task instructions embedded document.
    """

    title: str = Field(description="Task title")
    description: str = Field(description="Detailed task description")
    requirements: list[str] = Field(default=[], description="Task requirements")
    hints: list[str] = Field(default=[], description="Helpful hints")
    examples: list[dict] = Field(
        default=[], description="Example solutions or approaches"
    )
    resources: list[dict] = Field(default=[], description="Additional resources")


class TaskValidation(BaseModel):
    """
    Task validation criteria embedded document.
    """

    validation_type: str = Field(
        description="Type of validation (automated, ai, manual)"
    )
    criteria: list[str] = Field(default=[], description="Validation criteria")
    test_cases: list[dict] = Field(
        default=[], description="Test cases for coding tasks"
    )
    rubric: dict | None = Field(default=None, description="Grading rubric")
    expected_format: str | None = Field(
        default=None, description="Expected submission format"
    )
    file_extensions: list[str] = Field(
        default=[], description="Allowed file extensions"
    )
    max_file_size_mb: int | None = Field(default=None, description="Maximum file size")


class TaskSettings(BaseModel):
    """
    Task configuration settings embedded document.
    """

    max_attempts: int | None = Field(
        default=None, description="Maximum submission attempts"
    )
    time_limit_minutes: int | None = Field(
        default=None, description="Time limit for completion"
    )
    requires_ai_review: bool = Field(
        default=True, description="Whether AI review is required"
    )
    immediate_feedback: bool = Field(
        default=True, description="Whether to provide immediate feedback"
    )
    collaborative: bool = Field(
        default=False, description="Whether task allows collaboration"
    )
    auto_grade: bool = Field(
        default=True, description="Whether to auto-grade when possible"
    )


class Task(BaseDocument):
    """
    Task document schema.

    Represents interactive exercises and assignments within chapters.
    """

    # Core task information
    chapter_id: Link[Chapter] = Field(description="Reference to parent chapter")
    task_type: TaskType = Field(description="Type of task")
    sequence_number: int = Field(description="Task order within chapter")

    # Task content
    instructions: TaskInstructions = Field(description="Task instructions and details")

    # Difficulty and learning
    difficulty_level: DifficultyLevel = Field(
        default=DifficultyLevel.INTERMEDIATE, description="Task difficulty level"
    )
    learning_objectives: list[str] = Field(
        default=[], description="What students will learn"
    )
    prerequisite_concepts: list[str] = Field(
        default=[], description="Required prerequisite knowledge"
    )

    # Time estimates
    estimated_completion_time_minutes: int | None = Field(
        default=None, description="Estimated time to complete"
    )

    # Validation and grading
    validation: TaskValidation = Field(description="Task validation configuration")
    points_possible: int = Field(
        default=100, description="Maximum points for this task"
    )
    weight: float = Field(default=1.0, description="Weight in chapter grade")

    # Task configuration
    settings: TaskSettings = Field(
        default_factory=TaskSettings, description="Task configuration settings"
    )

    # Content specific to task type
    task_data: dict[str, Any] = Field(
        default={},
        description="Task-specific data (coding environment, file templates, etc.)",
    )

    # AI Generation metadata
    generation_prompt: str | None = Field(
        default=None, description="Prompt used to generate this task"
    )
    ai_complexity_score: float | None = Field(
        default=None, description="AI-assessed task complexity (0-1)"
    )
    quality_score: float | None = Field(
        default=None, description="AI-assessed task quality (0-1)"
    )

    # Publication status
    is_published: bool = Field(default=False, description="Whether task is published")
    is_optional: bool = Field(default=False, description="Whether task is optional")

    # Dependencies
    prerequisite_task_ids: list[str] = Field(
        default=[], description="Tasks that must be completed first"
    )
    unlock_conditions: list[str] = Field(
        default=[], description="Additional unlock conditions"
    )

    # Statistics
    attempt_count: int = Field(default=0, description="Total submission attempts")
    completion_count: int = Field(default=0, description="Successful completions")
    average_score: float | None = Field(
        default=None, description="Average score across all submissions"
    )
    average_completion_time_minutes: float | None = Field(
        default=None, description="Average completion time"
    )
    success_rate: float | None = Field(
        default=None, description="Success rate (completions/attempts)"
    )

    # Feedback
    common_mistakes: list[str] = Field(
        default=[], description="Common mistakes identified by AI"
    )
    improvement_suggestions: list[str] = Field(
        default=[], description="AI-generated improvement suggestions"
    )

    class Settings:
        name = "tasks"
        indexes = [
            IndexModel([("chapter_id", 1)]),
            IndexModel([("task_type", 1)]),
            IndexModel([("chapter_id", 1), ("sequence_number", 1)], unique=True),
            IndexModel([("chapter_id", 1), ("task_type", 1)]),
            IndexModel([("difficulty_level", 1)]),
            IndexModel([("is_published", 1)]),
            IndexModel(
                [("learning_objectives", "text"), ("instructions.title", "text")]
            ),
        ]
