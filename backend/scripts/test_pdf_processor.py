#!/usr/bin/env python3
"""
Test script for PDF processing functionality.
"""
import asyncio
import logging
import tempfile
from pathlib import Path

from app.services.pdf_processor import PDFProcessor
from app.services.types import ContentType

# Mock PDF content for testing
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_sample_pdf(file_path: Path) -> None:
    """
    Create a sample PDF file for testing.

    Args:
        file_path: Path where to save the PDF
    """
    doc = SimpleDocTemplate(str(file_path), pagesize=letter)
    styles = getSampleStyleSheet()

    # Create content
    content = []

    # Title
    title = Paragraph("Chapter 1: Introduction to Python Programming", styles["Title"])
    content.append(title)
    content.append(Spacer(1, 12))

    # Heading
    heading = Paragraph("1.1 What is Python?", styles["Heading1"])
    content.append(heading)
    content.append(Spacer(1, 12))

    # Paragraph
    paragraph1 = Paragraph(
        "Python is a high-level, interpreted programming language with dynamic semantics. "
        "Its high-level built-in data structures, combined with dynamic typing and dynamic "
        "binding, make it very attractive for Rapid Application Development.",
        styles["Normal"],
    )
    content.append(paragraph1)
    content.append(Spacer(1, 12))

    # Another heading
    heading2 = Paragraph("1.2 Python Features", styles["Heading2"])
    content.append(heading2)
    content.append(Spacer(1, 12))

    # List items (simulated)
    list_items = [
        "• Easy to learn and use",
        "• Extensive standard library",
        "• Cross-platform compatibility",
        "• Large community support",
    ]

    for item in list_items:
        list_para = Paragraph(item, styles["Normal"])
        content.append(list_para)
        content.append(Spacer(1, 6))

    content.append(Spacer(1, 12))

    # Code example
    code_text = """
def hello_world():
    print("Hello, World!")
    return "Python is awesome!"
    """

    code_para = Paragraph(f"<font name='Courier'>{code_text}</font>", styles["Code"])
    content.append(code_para)
    content.append(Spacer(1, 12))

    # Chapter 2
    chapter2_title = Paragraph("Chapter 2: Data Types and Variables", styles["Title"])
    content.append(chapter2_title)
    content.append(Spacer(1, 12))

    chapter2_content = Paragraph(
        "In this chapter, we will explore Python's built-in data types including "
        "integers, floats, strings, lists, tuples, and dictionaries. Understanding "
        "these fundamental concepts is crucial for effective Python programming.",
        styles["Normal"],
    )
    content.append(chapter2_content)

    # Build PDF
    doc.build(content)
    logger.info(f"Created sample PDF: {file_path}")


async def test_basic_extraction():
    """Test basic PDF text extraction."""
    logger.info("Testing basic PDF text extraction...")

    try:
        # Create a temporary PDF file
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
            tmp_path = Path(tmp_file.name)

        # Create sample PDF
        create_sample_pdf(tmp_path)

        # Test extraction
        processor = PDFProcessor(ocr_enabled=False)  # Disable OCR for faster testing
        result = await processor.extract_text_with_structure(tmp_path)

        # Validate results
        assert result.raw_text, "Raw text should not be empty"
        assert result.page_count > 0, "Should have at least one page"
        assert result.word_count > 0, "Should have word count"
        assert len(result.structured_content) > 0, "Should have structured content"

        logger.info(
            f"✅ Extracted {result.word_count} words from {result.page_count} pages"
        )
        logger.info(f"✅ Found {len(result.structured_content)} structured elements")

        # Clean up
        tmp_path.unlink()

        return True

    except Exception as e:
        logger.error(f"❌ Basic extraction test failed: {e}")
        return False


async def test_chapter_detection():
    """Test chapter detection functionality."""
    logger.info("Testing chapter detection...")

    try:
        # Create a temporary PDF file
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
            tmp_path = Path(tmp_file.name)

        # Create sample PDF
        create_sample_pdf(tmp_path)

        # Test extraction
        processor = PDFProcessor(ocr_enabled=False)
        result = await processor.extract_text_with_structure(tmp_path)

        # Validate chapter detection
        assert len(result.chapters) > 0, "Should detect chapters"

        # Check chapter details
        for chapter in result.chapters:
            assert chapter.title, "Chapter should have a title"
            assert chapter.level > 0, "Chapter should have a level"
            assert len(chapter.content) > 0, "Chapter should have content"

            logger.info(
                f"✅ Detected chapter: '{chapter.title}' (Level {chapter.level})"
            )

        logger.info(f"✅ Total chapters detected: {len(result.chapters)}")

        # Clean up
        tmp_path.unlink()

        return True

    except Exception as e:
        logger.error(f"❌ Chapter detection test failed: {e}")
        return False


async def test_content_classification():
    """Test content type classification."""
    logger.info("Testing content classification...")

    try:
        # Create a temporary PDF file
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
            tmp_path = Path(tmp_file.name)

        # Create sample PDF
        create_sample_pdf(tmp_path)

        # Test extraction
        processor = PDFProcessor(ocr_enabled=False)
        result = await processor.extract_text_with_structure(tmp_path)

        # Check content types
        content_types = {element.content_type for element in result.structured_content}

        # Should have at least headings and paragraphs
        assert ContentType.HEADING in content_types, "Should detect headings"
        assert ContentType.PARAGRAPH in content_types, "Should detect paragraphs"

        # Count content types
        type_counts = {}
        for element in result.structured_content:
            type_counts[element.content_type] = (
                type_counts.get(element.content_type, 0) + 1
            )

        for content_type, count in type_counts.items():
            logger.info(f"✅ Found {count} {content_type.value} elements")

        # Clean up
        tmp_path.unlink()

        return True

    except Exception as e:
        logger.error(f"❌ Content classification test failed: {e}")
        return False


async def test_text_normalization():
    """Test text cleaning and normalization."""
    logger.info("Testing text normalization...")

    try:
        processor = PDFProcessor()

        # Test with sample messy text
        messy_text = """

        This   is    a   test     document.

        1

        Header Text

        2

        This is normal paragraph text with some issues.It has poor spacing.

        Another paragraph here.

        3

        """

        result = processor.normalize_text(messy_text)

        # Validate cleaning
        assert result.cleaned_text != result.original_text, "Text should be cleaned"
        assert (
            result.normalized_text != result.original_text
        ), "Text should be normalized"
        assert result.word_count > 0, "Should have word count"
        assert len(result.removed_elements) > 0, "Should have removed elements"

        logger.info(f"✅ Original text: {len(result.original_text)} chars")
        logger.info(f"✅ Cleaned text: {len(result.cleaned_text)} chars")
        logger.info(f"✅ Normalized text: {len(result.normalized_text)} chars")
        logger.info(f"✅ Word count: {result.word_count}")
        logger.info(f"✅ Removed elements: {result.removed_elements}")

        return True

    except Exception as e:
        logger.error(f"❌ Text normalization test failed: {e}")
        return False


async def test_error_handling():
    """Test error handling for invalid files."""
    logger.info("Testing error handling...")

    try:
        processor = PDFProcessor()

        # Test with non-existent file
        try:
            await processor.extract_text_with_structure("nonexistent.pdf")
            logger.error("❌ Should have raised FileNotFoundError")
            return False
        except FileNotFoundError:
            logger.info("✅ Correctly handled non-existent file")

        # Test with invalid file type
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp_file:
            tmp_path = Path(tmp_file.name)
            tmp_file.write(b"This is not a PDF file")

        try:
            await processor.extract_text_with_structure(tmp_path)
            logger.error("❌ Should have raised an error for invalid PDF")
            tmp_path.unlink()
            return False
        except Exception:
            logger.info("✅ Correctly handled invalid PDF file")
            tmp_path.unlink()

        return True

    except Exception as e:
        logger.error(f"❌ Error handling test failed: {e}")
        return False


async def test_media_extraction():
    """Test image and table extraction capabilities."""
    logger.info("Testing media extraction...")

    try:
        # Create a temporary PDF file (basic test)
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
            tmp_path = Path(tmp_file.name)

        # Create sample PDF
        create_sample_pdf(tmp_path)

        # Test media extraction
        processor = PDFProcessor(ocr_enabled=False)
        media_assets = await processor.extract_images_and_tables(tmp_path)

        # Validate structure (even if no media found in simple PDF)
        assert hasattr(media_assets, "images"), "Should have images list"
        assert hasattr(media_assets, "tables"), "Should have tables list"
        assert hasattr(media_assets, "total_images"), "Should have image count"
        assert hasattr(media_assets, "total_tables"), "Should have table count"

        logger.info(f"✅ Found {media_assets.total_images} images")
        logger.info(f"✅ Found {media_assets.total_tables} tables")

        # Clean up
        tmp_path.unlink()

        return True

    except Exception as e:
        logger.error(f"❌ Media extraction test failed: {e}")
        return False


async def main():
    """Run all PDF processor tests."""
    logger.info("🧪 Starting PDF processor tests...")

    # Check if reportlab is available for creating test PDFs
    try:
        import reportlab

        logger.info("✅ ReportLab available for creating test PDFs")
    except ImportError:
        logger.warning("⚠️ ReportLab not available, installing...")
        import subprocess
        import sys

        subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
        logger.info("✅ ReportLab installed")

    tests = [
        test_basic_extraction,
        test_chapter_detection,
        test_content_classification,
        test_text_normalization,
        test_error_handling,
        test_media_extraction,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        try:
            if await test():
                passed += 1
            print("-" * 60)
        except Exception as e:
            logger.error(f"Test failed with exception: {e}")
            print("-" * 60)

    logger.info(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        logger.info("🎉 All PDF processor tests passed successfully!")
        logger.info("✅ PDF processing service is ready for use!")
        return True
    else:
        logger.error(f"❌ {total - passed} tests failed")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
