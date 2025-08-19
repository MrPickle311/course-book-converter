"""
PDF processing API endpoints.
Implements Task 1.2.1: PDF processing service exposure.
"""
from __future__ import annotations

import logging
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List

from app.core.config import settings
from app.services.pdf_processor import PDFProcessor
from fastapi import APIRouter, File, HTTPException, UploadFile, status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pdf", tags=["PDF"])


def _ensure_upload_dir() -> Path:
    base = Path(settings.upload_dir)
    (base / "tmp").mkdir(parents=True, exist_ok=True)
    return base


def _validate_pdf_file(upload: UploadFile) -> None:
    filename = (upload.filename or "").lower()
    if not filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported",
        )


@router.post("/process", status_code=status.HTTP_200_OK)
async def process_pdf(file: UploadFile = File(...)) -> Dict[str, Any]:
    start = time.time()
    _validate_pdf_file(file)
    logger.debug(
        "/pdf/process: received file=%s size=%s",
        file.filename,
        getattr(file, "size", "n/a"),
    )

    upload_dir = _ensure_upload_dir()
    tmp_path = (upload_dir / "tmp" / f"{uuid.uuid4()}.pdf").resolve()

    content = await file.read()
    logger.debug("/pdf/process: read %d bytes", len(content))
    try:
        with open(tmp_path, "wb") as f:
            f.write(content)
    except Exception as e:
        logger.exception("/pdf/process: failed to save file: %s", e)
        raise HTTPException(
            status_code=500, detail=f"Failed to save uploaded file: {e}"
        )
    finally:
        await file.seek(0)

    processor = PDFProcessor(
        ocr_enabled=settings.pdf_ocr_enabled,
        language=settings.pdf_ocr_language,
    )

    try:
        stage = time.time()
        structure = await processor.extract_text_with_structure(str(tmp_path))
        logger.debug("/pdf/process: text+structure in %.3fs", time.time() - stage)

        stage = time.time()
        media = await processor.extract_images_and_tables(str(tmp_path))
        logger.debug(
            "/pdf/process: media in %.3fs (images=%d tables=%d)",
            time.time() - stage,
            media.total_images,
            media.total_tables,
        )

        stage = time.time()
        clean = processor.normalize_text(structure.raw_text)
        logger.debug("/pdf/process: normalize in %.3fs", time.time() - stage)

        stage = time.time()
        toc = processor.build_toc_from_pdf(str(tmp_path), structure.structured_content)
        # filter trash and early pages
        toc = [
            t
            for t in toc
            if isinstance(t.get("title"), str)
            and not processor._should_discard_title(
                str(t["title"]), int(t.get("page", 0))
            )
        ]
        logger.debug(
            "/pdf/process: toc in %.3fs (items=%d)", time.time() - stage, len(toc)
        )

        # if toc exists, re-split chapters using it
        chapters = processor.split_chapters_from_toc(toc, structure.structured_content)

    except Exception as e:
        try:
            if tmp_path.exists():
                tmp_path.unlink()
        except Exception:
            pass
        logger.exception("/pdf/process: processing error: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {e}")

    try:
        if tmp_path.exists():
            tmp_path.unlink()
    except Exception:
        pass

    chapter_summaries: List[Dict[str, Any]] = [
        {
            "title": c.title,
            "level": c.level,
            "startPage": c.start_page,
            "endPage": c.end_page,
        }
        for c in (chapters or [])
    ]

    structured_counts: Dict[str, int] = {}
    for item in structure.structured_content:
        key = str(item.content_type)
        structured_counts[key] = structured_counts.get(key, 0) + 1

    logger.info(
        "/pdf/process: completed in %.3fs (pages=%d words=%d chapters=%d)",
        time.time() - start,
        structure.page_count,
        structure.word_count,
        len(chapter_summaries),
    )

    return {
        "success": True,
        "message": "PDF processed successfully",
        "data": {
            "pageCount": structure.page_count,
            "wordCount": structure.word_count,
            "chapters": chapter_summaries,
            "structuredCounts": structured_counts,
            "images": media.total_images,
            "tables": media.total_tables,
            "toc": toc,
            "cleanText": {
                "wordCount": clean.word_count,
                "removedElements": clean.removed_elements,
            },
        },
    }
