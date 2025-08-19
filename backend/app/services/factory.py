"""
Service factory for creating service instances.
"""
from functools import lru_cache

from app.core.config import settings
from app.services.pdf_processor import PDFProcessor


@lru_cache()
def get_pdf_processor() -> PDFProcessor:
    """
    Get PDF processor instance with configuration from settings.

    Returns:
        Configured PDFProcessor instance
    """
    return PDFProcessor(
        ocr_enabled=settings.pdf_ocr_enabled, language=settings.pdf_ocr_language
    )


# Add other service factories here as they are implemented
# @lru_cache()
# def get_ai_service() -> AIService:
#     return AIService(api_key=settings.openai_api_key)
