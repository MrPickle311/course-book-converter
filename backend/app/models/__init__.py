"""
Database models for the Book to Course Converter application.
"""

from app.models.base import BaseDocument, DifficultyLevel, ProcessingStatus, TaskType
from app.models.book import Book, BookMetadata
from app.models.chapter import Chapter, ChapterContent
from app.models.chapter import LearningObjective as ChapterLearningObjective
from app.models.course import Course, CoursePricing, LearningObjective
from app.models.task import Task, TaskInstructions, TaskSettings, TaskValidation

__all__ = [
    # Base classes
    "BaseDocument",
    "ProcessingStatus",
    "TaskType",
    "DifficultyLevel",
    # Book models
    "Book",
    "BookMetadata",
    # Course models
    "Course",
    "LearningObjective",
    "CoursePricing",
    # Chapter models
    "Chapter",
    "ChapterContent",
    "ChapterLearningObjective",
    # Task models
    "Task",
    "TaskInstructions",
    "TaskValidation",
    "TaskSettings",
]
