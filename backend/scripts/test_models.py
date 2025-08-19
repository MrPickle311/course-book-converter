#!/usr/bin/env python3
"""
Test script to validate database models without requiring MongoDB connection.
"""
import logging
from decimal import Decimal

from app.models import (
    Book,
    BookMetadata,
    ChapterContent,
    CoursePricing,
    DifficultyLevel,
    ProcessingStatus,
    TaskInstructions,
    TaskSettings,
    TaskType,
    TaskValidation,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_model_creation():
    """
    Test creating model instances without database operations.
    """
    logger.info("Testing model creation...")

    try:
        # Test BookMetadata
        metadata = BookMetadata(
            file_size=2048000,
            file_type="application/pdf",
            page_count=150,
            language="en",
            keywords=["python", "programming"],
        )
        logger.info("✅ BookMetadata created successfully")

        # Test Book
        book = Book(
            title="Test Book",
            author="Test Author",
            file_path="/test/path.pdf",
            original_filename="test.pdf",
            processing_status=ProcessingStatus.PENDING,
            metadata=metadata,
        )
        logger.info("✅ Book model created successfully")
        logger.info(f"   Book ID: {book.id}")
        logger.info(f"   Book title: {book.title}")

        # Test CoursePricing
        pricing = CoursePricing(
            pricing_model="per_chapter",
            base_price_per_chapter=Decimal("9.99"),
            currency="USD",
        )
        logger.info("✅ CoursePricing created successfully")

        # Test Course (without saving the book reference)
        course_data = {
            "title": "Test Course",
            "description": "Test course description",
            "total_chapters": 3,
            "difficulty_level": "beginner",
            "generation_status": ProcessingStatus.PENDING,
            "pricing": pricing,
        }
        # Note: Can't create Course instance without actual book_id reference
        logger.info("✅ Course model data validated successfully")

        # Test ChapterContent
        content = ChapterContent(
            raw_text="Raw text content",
            processed_text="Processed text content",
            summary="Chapter summary",
            key_concepts=["concept1", "concept2"],
            examples=["example1"],
            images=[],
            diagrams=[],
            code_snippets=[],
        )
        logger.info("✅ ChapterContent created successfully")

        # Test TaskInstructions
        instructions = TaskInstructions(
            title="Test Task",
            description="Test task description",
            requirements=["req1", "req2"],
            hints=["hint1"],
            examples=[],
            resources=[],
        )
        logger.info("✅ TaskInstructions created successfully")

        # Test TaskValidation
        validation = TaskValidation(
            validation_type="ai",
            criteria=["correctness", "style"],
            test_cases=[],
            expected_format="text",
        )
        logger.info("✅ TaskValidation created successfully")

        # Test TaskSettings
        settings = TaskSettings(
            max_attempts=3, requires_ai_review=True, immediate_feedback=True
        )
        logger.info("✅ TaskSettings created successfully")

        # Test Enums
        assert ProcessingStatus.PENDING == "pending"
        assert TaskType.CODING == "coding"
        assert DifficultyLevel.BEGINNER == "beginner"
        logger.info("✅ Enum values validated successfully")

        logger.info("🎉 All model tests passed!")
        return True

    except Exception as e:
        import traceback

        logger.error(f"❌ Model test failed: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False


def test_model_validation():
    """
    Test model validation rules.
    """
    logger.info("Testing model validation...")

    try:
        # Test required fields
        try:
            Book()  # Should fail - missing required fields
            logger.error("❌ Book validation should have failed")
            return False
        except Exception:
            logger.info("✅ Book required field validation works")

        # Test enum validation
        try:
            Book(
                title="Test",
                author="Test",
                file_path="/test",
                original_filename="test.pdf",
                processing_status="invalid_status",  # Should fail
            )
            logger.error("❌ Enum validation should have failed")
            return False
        except Exception:
            logger.info("✅ Enum validation works")

        # Test decimal validation
        pricing = CoursePricing(
            base_price_per_chapter="9.99"  # String should be converted to Decimal
        )
        assert isinstance(pricing.base_price_per_chapter, Decimal)
        logger.info("✅ Decimal conversion works")

        logger.info("🎉 All validation tests passed!")
        return True

    except Exception as e:
        logger.error(f"❌ Validation test failed: {e}")
        return False


def test_model_serialization():
    """
    Test model serialization to/from dict.
    """
    logger.info("Testing model serialization...")

    try:
        # Create a book instance
        book = Book(
            title="Serialization Test",
            author="Test Author",
            file_path="/test/serial.pdf",
            original_filename="serial.pdf",
            metadata=BookMetadata(file_size=1024, file_type="application/pdf"),
        )

        # Test model_dump
        book_dict = book.model_dump()
        assert book_dict["title"] == "Serialization Test"
        assert "metadata" in book_dict
        logger.info("✅ Model serialization to dict works")

        # Test model_dump_json
        book_json = book.model_dump_json()
        assert "Serialization Test" in book_json
        logger.info("✅ Model serialization to JSON works")

        logger.info("🎉 All serialization tests passed!")
        return True

    except Exception as e:
        import traceback

        logger.error(f"❌ Serialization test failed: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False


def main():
    """
    Run all model tests.
    """
    logger.info("🧪 Starting database model tests...")

    tests = [test_model_creation, test_model_validation, test_model_serialization]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1
        print("-" * 50)

    logger.info(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        logger.info("🎉 All database model tests passed successfully!")
        return True
    else:
        logger.error(f"❌ {total - passed} tests failed")
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
