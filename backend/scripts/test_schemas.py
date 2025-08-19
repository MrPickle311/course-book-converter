#!/usr/bin/env python3
"""
Test script to validate Pydantic schemas without requiring MongoDB connection.
"""
import logging
from decimal import Decimal

from app.models.base import DifficultyLevel, ProcessingStatus, TaskType
from app.models.book import BookMetadata
from app.models.chapter import ChapterContent
from app.models.course import CoursePricing, LearningObjective
from app.models.task import TaskInstructions, TaskSettings, TaskValidation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_embedded_schemas():
    """
    Test creating embedded document schemas (Pydantic models).
    """
    logger.info("Testing embedded schemas...")

    try:
        # Test BookMetadata
        metadata = BookMetadata(
            file_size=2048000,
            file_type="application/pdf",
            page_count=150,
            language="en",
            keywords=["python", "programming"],
        )
        assert metadata.file_size == 2048000
        assert metadata.file_type == "application/pdf"
        logger.info("✅ BookMetadata schema works")

        # Test CoursePricing
        pricing = CoursePricing(
            pricing_model="per_chapter",
            base_price_per_chapter=Decimal("9.99"),
            currency="USD",
        )
        assert pricing.base_price_per_chapter == Decimal("9.99")
        assert pricing.currency == "USD"
        logger.info("✅ CoursePricing schema works")

        # Test LearningObjective
        objective = LearningObjective(
            id="obj_1",
            title="Learn Python basics",
            description="Understand variables and data types",
            bloom_level="understand",
            estimated_time_minutes=60,
        )
        assert objective.id == "obj_1"
        assert objective.estimated_time_minutes == 60
        logger.info("✅ LearningObjective schema works")

        # Test ChapterContent
        content = ChapterContent(
            raw_text="Raw chapter text",
            processed_text="Processed chapter text",
            summary="Chapter summary",
            key_concepts=["variables", "data types"],
            examples=["example 1"],
            images=[],
            diagrams=[],
            code_snippets=[],
        )
        assert content.raw_text == "Raw chapter text"
        assert len(content.key_concepts) == 2
        logger.info("✅ ChapterContent schema works")

        # Test TaskInstructions
        instructions = TaskInstructions(
            title="Coding Exercise",
            description="Write a Python function",
            requirements=["Use proper syntax", "Add comments"],
            hints=["Start with def", "Use descriptive names"],
            examples=[],
            resources=[],
        )
        assert instructions.title == "Coding Exercise"
        assert len(instructions.requirements) == 2
        logger.info("✅ TaskInstructions schema works")

        # Test TaskValidation
        validation = TaskValidation(
            validation_type="automated",
            criteria=["Correctness", "Style"],
            test_cases=[{"input": "test", "expected": "result"}],
            expected_format="python",
        )
        assert validation.validation_type == "automated"
        assert len(validation.criteria) == 2
        logger.info("✅ TaskValidation schema works")

        # Test TaskSettings
        settings = TaskSettings(
            max_attempts=3,
            time_limit_minutes=30,
            requires_ai_review=True,
            immediate_feedback=True,
        )
        assert settings.max_attempts == 3
        assert settings.requires_ai_review is True
        logger.info("✅ TaskSettings schema works")

        logger.info("🎉 All embedded schema tests passed!")
        return True

    except Exception as e:
        import traceback

        logger.error(f"❌ Embedded schema test failed: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False


def test_enums():
    """
    Test enum definitions and values.
    """
    logger.info("Testing enums...")

    try:
        # Test ProcessingStatus
        assert ProcessingStatus.PENDING == "pending"
        assert ProcessingStatus.PROCESSING == "processing"
        assert ProcessingStatus.COMPLETED == "completed"
        assert ProcessingStatus.FAILED == "failed"
        assert ProcessingStatus.CANCELLED == "cancelled"
        logger.info("✅ ProcessingStatus enum works")

        # Test TaskType
        assert TaskType.CODING == "coding"
        assert TaskType.WRITING == "writing"
        assert TaskType.ANALYSIS == "analysis"
        assert TaskType.FILE_UPLOAD == "file_upload"
        assert TaskType.MULTIPLE_CHOICE == "multiple_choice"
        assert TaskType.QUIZ == "quiz"
        logger.info("✅ TaskType enum works")

        # Test DifficultyLevel
        assert DifficultyLevel.BEGINNER == "beginner"
        assert DifficultyLevel.INTERMEDIATE == "intermediate"
        assert DifficultyLevel.ADVANCED == "advanced"
        logger.info("✅ DifficultyLevel enum works")

        # Test enum in lists
        all_statuses = list(ProcessingStatus)
        assert len(all_statuses) == 5
        logger.info("✅ Enum iteration works")

        logger.info("🎉 All enum tests passed!")
        return True

    except Exception as e:
        import traceback

        logger.error(f"❌ Enum test failed: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False


def test_schema_serialization():
    """
    Test schema serialization and validation.
    """
    logger.info("Testing schema serialization...")

    try:
        # Test BookMetadata serialization
        metadata = BookMetadata(
            file_size=1024, file_type="application/pdf", page_count=50
        )

        # Test dict conversion
        metadata_dict = metadata.model_dump()
        assert metadata_dict["file_size"] == 1024
        assert metadata_dict["file_type"] == "application/pdf"
        logger.info("✅ Schema to dict conversion works")

        # Test JSON conversion
        metadata_json = metadata.model_dump_json()
        assert "1024" in metadata_json
        assert "application/pdf" in metadata_json
        logger.info("✅ Schema to JSON conversion works")

        # Test validation with invalid data
        try:
            BookMetadata(
                file_size="invalid", file_type="application/pdf"  # Should be int
            )
            logger.error("❌ Validation should have failed")
            return False
        except Exception:
            logger.info("✅ Schema validation works correctly")

        # Test default values
        pricing = CoursePricing()  # Should use defaults
        assert pricing.pricing_model == "per_chapter"
        assert pricing.base_price_per_chapter == Decimal("9.99")
        assert pricing.currency == "USD"
        logger.info("✅ Default values work")

        logger.info("🎉 All serialization tests passed!")
        return True

    except Exception as e:
        import traceback

        logger.error(f"❌ Serialization test failed: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False


def test_complex_structures():
    """
    Test complex nested structures.
    """
    logger.info("Testing complex structures...")

    try:
        # Test nested structure with all components
        course_data = {
            "pricing": CoursePricing(
                base_price_per_chapter=Decimal("15.99"),
                full_course_discount_percentage=Decimal("20.0"),
            ),
            "learning_objectives": [
                LearningObjective(
                    id="obj_1",
                    title="Master Python",
                    description="Learn Python programming",
                    bloom_level="apply",
                ),
                LearningObjective(
                    id="obj_2",
                    title="Build Projects",
                    description="Create real applications",
                    bloom_level="create",
                ),
            ],
        }

        # Validate structure
        assert len(course_data["learning_objectives"]) == 2
        assert course_data["pricing"].base_price_per_chapter == Decimal("15.99")
        assert course_data["learning_objectives"][0].bloom_level == "apply"
        logger.info("✅ Complex nested structures work")

        # Test comprehensive task structure
        task_data = {
            "instructions": TaskInstructions(
                title="Build a Calculator",
                description="Create a simple calculator application",
                requirements=[
                    "Implement basic operations (+, -, *, /)",
                    "Handle division by zero",
                    "Use proper error handling",
                ],
                hints=[
                    "Start with a simple function structure",
                    "Test each operation separately",
                ],
            ),
            "validation": TaskValidation(
                validation_type="ai",
                criteria=["Functionality", "Code quality", "Error handling"],
                test_cases=[
                    {"operation": "add", "a": 2, "b": 3, "expected": 5},
                    {"operation": "divide", "a": 5, "b": 0, "expected": "error"},
                ],
            ),
            "settings": TaskSettings(
                max_attempts=5, time_limit_minutes=45, requires_ai_review=True
            ),
        }

        # Validate task structure
        assert task_data["instructions"].title == "Build a Calculator"
        assert len(task_data["validation"].criteria) == 3
        assert task_data["settings"].max_attempts == 5
        logger.info("✅ Complex task structures work")

        logger.info("🎉 All complex structure tests passed!")
        return True

    except Exception as e:
        import traceback

        logger.error(f"❌ Complex structure test failed: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False


def main():
    """
    Run all schema tests.
    """
    logger.info("🧪 Starting database schema tests...")

    tests = [
        test_embedded_schemas,
        test_enums,
        test_schema_serialization,
        test_complex_structures,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1
        print("-" * 60)

    logger.info(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        logger.info("🎉 All database schema tests passed successfully!")
        logger.info("✅ Database models are ready for use!")
        return True
    else:
        logger.error(f"❌ {total - passed} tests failed")
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
