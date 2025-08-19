#!/usr/bin/env python3
"""
Database setup and migration script.
"""
import asyncio
import logging
from datetime import datetime
from decimal import Decimal

from app.core.database import close_database, db_manager, init_database
from app.models import (
    Book,
    BookMetadata,
    Chapter,
    ChapterContent,
    Course,
    CoursePricing,
    DifficultyLevel,
    LearningObjective,
    ProcessingStatus,
    Task,
    TaskInstructions,
    TaskSettings,
    TaskType,
    TaskValidation,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_sample_data():
    """
    Create sample data for development and testing.
    """
    logger.info("Creating sample data...")

    try:
        # Sample Book
        sample_book = Book(
            title="Python Programming for Beginners",
            author="John Doe",
            description="A comprehensive introduction to Python programming",
            file_path="/uploads/python_book.pdf",
            original_filename="python_book.pdf",
            processing_status=ProcessingStatus.COMPLETED,
            chapter_count=10,
            total_words=15000,
            extracted_text_preview="Welcome to Python programming...",
            metadata=BookMetadata(
                file_size=2048000,  # 2MB
                file_type="application/pdf",
                page_count=150,
                language="en",
                subject="Programming",
                keywords=["python", "programming", "beginner", "tutorial"],
            ),
            upload_date=datetime.utcnow(),
            processing_completed_at=datetime.utcnow(),
        )

        await sample_book.save()
        logger.info(f"Created sample book: {sample_book.id}")

        # Sample Course
        sample_course = Course(
            book_id=sample_book,
            title="Learn Python Programming",
            description="Master Python programming from basics to advanced concepts",
            short_description="Comprehensive Python course for beginners",
            total_chapters=3,
            estimated_duration_hours=20,
            difficulty_level="beginner",
            learning_objectives=[
                LearningObjective(
                    id="obj_1",
                    title="Understand Python basics",
                    description="Learn variables, data types, and basic syntax",
                    bloom_level="understand",
                    estimated_time_minutes=120,
                ),
                LearningObjective(
                    id="obj_2",
                    title="Apply programming concepts",
                    description="Write simple Python programs",
                    bloom_level="apply",
                    estimated_time_minutes=180,
                ),
            ],
            prerequisites=["Basic computer literacy"],
            target_audience=["Beginners", "Students", "Career changers"],
            tags=["python", "programming", "beginner"],
            generation_status=ProcessingStatus.COMPLETED,
            pricing=CoursePricing(
                pricing_model="per_chapter",
                base_price_per_chapter=Decimal("12.99"),
                full_course_discount_percentage=Decimal("25.0"),
                currency="USD",
            ),
            is_published=True,
            published_at=datetime.utcnow(),
        )

        await sample_course.save()
        logger.info(f"Created sample course: {sample_course.id}")

        # Sample Chapters
        for i in range(1, 4):
            chapter = Chapter(
                course_id=sample_course,
                chapter_number=i,
                title=f"Chapter {i}: Python Fundamentals",
                subtitle=f"Part {i} of Python basics",
                content=ChapterContent(
                    raw_text=f"This is the raw text for chapter {i}...",
                    processed_text=f"Enhanced content for chapter {i}...",
                    summary=f"Chapter {i} covers fundamental Python concepts",
                    key_concepts=[f"concept_{i}_1", f"concept_{i}_2"],
                    examples=[f"example_{i}_1", f"example_{i}_2"],
                    images=[],
                    diagrams=[],
                    code_snippets=[],
                ),
                learning_objectives=[
                    {
                        "objective": f"Understand chapter {i} concepts",
                        "bloom_level": "understand",
                        "assessment_method": "quiz",
                    }
                ],
                difficulty_level=DifficultyLevel.BEGINNER,
                estimated_reading_time_minutes=30,
                estimated_completion_time_minutes=60,
                word_count=2000,
                task_count=2,
                price=Decimal("12.99"),
                is_free_preview=(i == 1),  # First chapter is free
                is_published=True,
            )

            await chapter.save()
            logger.info(f"Created sample chapter: {chapter.id}")

            # Sample Tasks for each chapter
            for j in range(1, 3):
                task_types = [TaskType.CODING, TaskType.WRITING]
                task_type = task_types[j - 1]

                task = Task(
                    chapter_id=chapter,
                    task_type=task_type,
                    sequence_number=j,
                    instructions=TaskInstructions(
                        title=f"Task {j}: {task_type.value.title()} Exercise",
                        description=f"Complete this {task_type.value} exercise",
                        requirements=[f"Requirement {j}.1", f"Requirement {j}.2"],
                        hints=[f"Hint {j}.1", f"Hint {j}.2"],
                        examples=[],
                        resources=[],
                    ),
                    difficulty_level=DifficultyLevel.BEGINNER,
                    learning_objectives=[f"Practice {task_type.value} skills"],
                    estimated_completion_time_minutes=20,
                    validation=TaskValidation(
                        validation_type="ai",
                        criteria=["Correctness", "Style", "Completeness"],
                        test_cases=[],
                        expected_format="text"
                        if task_type == TaskType.WRITING
                        else "code",
                    ),
                    points_possible=100,
                    settings=TaskSettings(
                        max_attempts=3, requires_ai_review=True, immediate_feedback=True
                    ),
                    task_data={
                        "language": "python" if task_type == TaskType.CODING else None,
                        "template": "# Write your code here"
                        if task_type == TaskType.CODING
                        else None,
                    },
                    is_published=True,
                )

                await task.save()
                logger.info(f"Created sample task: {task.id}")

        logger.info("Sample data created successfully!")

    except Exception as e:
        logger.error(f"Error creating sample data: {e}")
        raise


async def setup_database():
    """
    Setup database with indexes and sample data.
    """
    logger.info("Setting up database...")

    try:
        # Initialize database connection
        await init_database()

        # Check if we already have data
        existing_books = await Book.count()
        if existing_books > 0:
            logger.info(
                f"Database already has {existing_books} books. Skipping sample data creation."
            )
            return

        # Create sample data
        await create_sample_data()

        logger.info("Database setup completed successfully!")

    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        raise
    finally:
        await close_database()


async def reset_database():
    """
    Reset database by dropping all collections.
    WARNING: This will delete all data!
    """
    logger.warning("Resetting database - ALL DATA WILL BE LOST!")

    try:
        await init_database()

        # Drop all collections
        collections = ["books", "courses", "chapters", "tasks"]
        for collection_name in collections:
            await db_manager.database[collection_name].drop()
            logger.info(f"Dropped collection: {collection_name}")

        # Recreate indexes
        await db_manager.create_indexes()

        logger.info("Database reset completed!")

    except Exception as e:
        logger.error(f"Database reset failed: {e}")
        raise
    finally:
        await close_database()


async def main():
    """
    Main function for database management.
    """
    import sys

    if len(sys.argv) < 2:
        print("Usage: python db_setup.py [setup|reset]")
        print("  setup - Initialize database with sample data")
        print("  reset - Reset database (WARNING: Deletes all data)")
        return

    command = sys.argv[1].lower()

    if command == "setup":
        await setup_database()
    elif command == "reset":
        response = input("Are you sure you want to reset the database? (yes/no): ")
        if response.lower() == "yes":
            await reset_database()
        else:
            print("Database reset cancelled.")
    else:
        print(f"Unknown command: {command}")
        print("Available commands: setup, reset")


if __name__ == "__main__":
    asyncio.run(main())
