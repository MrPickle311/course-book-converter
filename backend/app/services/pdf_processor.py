"""
Advanced PDF processing service using PyMuPDF and pdfplumber.
"""
import logging
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import fitz  # PyMuPDF
import pdfplumber

# Only import OCR modules conditionally to reduce memory footprint
try:
    import pytesseract  # type: ignore
    from PIL import Image as PILImage  # type: ignore
except Exception:  # pragma: no cover - optional path
    pytesseract = None
    PILImage = None  # type: ignore

from app.core.config import settings
from app.services.types import (
    BoundingBox,
    Chapter,
    CleanText,
    ContentType,
    DocumentStructure,
    FontInfo,
    Image,
    MediaAssets,
    StructuredContent,
    Table,
    TableCell,
    TextElement,
)

logger = logging.getLogger(__name__)


class PDFProcessor:
    """
    Lean PDF processing service optimized for text-based PDFs by default.
    """

    def __init__(self, ocr_enabled: bool = False, language: str = "eng"):
        self.ocr_enabled = bool(ocr_enabled and settings.pdf_ocr_enabled)
        self.ocr_language = language
        self.heading_font_threshold = 14.0
        self.large_heading_threshold = 18.0
        self.chapter_patterns = [
            r"^chapter\s+\d+",
            r"^ch\.\s*\d+",
            r"^\d+\.\s+[A-Z]",
            r"^part\s+\d+",
            r"^section\s+\d+",
            r"^\d+\s+[A-Z][A-Za-z\s]{10,}",
        ]

    def _is_chapter_heading(self, text: str, level: int) -> bool:
        """Heuristic to determine if a heading looks like a chapter title.
        - Prefer larger heading levels (level 1 or 2)
        - Match common patterns like 'Chapter 1', '1. Introduction', etc.
        - Require minimum length to reduce false positives
        """
        if not text:
            return False
        candidate = text.strip()
        if len(candidate) < 4:
            return False
        # Stronger if primary heading
        if level <= 2:
            low = candidate.lower()
            for pat in self.chapter_patterns:
                if re.match(pat, low):
                    return True
            # Fallback: long capitalized title-like strings
            if re.match(r"^[A-Z][A-Za-z0-9\s,'\-:]{6,}$", candidate):
                return True
        return False

    async def extract_text_with_structure(
        self, pdf_path: Union[str, Path]
    ) -> DocumentStructure:
        start_time = time.time()
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        logger.info(f"Starting PDF processing for: {pdf_path}")
        fitz_doc = fitz.open(str(pdf_path))
        try:
            metadata = self._extract_metadata(fitz_doc)
            text_elements = self._extract_text_elements(fitz_doc)
            structured_content = self._classify_content(text_elements)
            raw_text = "\n".join([element.text for element in text_elements])
            chapters = self.detect_chapters(structured_content)
            word_count = len(raw_text.split())
            processing_time = time.time() - start_time
            page_count = len(fitz_doc)
            return DocumentStructure(
                raw_text=raw_text,
                structured_content=structured_content,
                chapters=chapters,
                tables=[],
                images=[],
                metadata=metadata,
                page_count=page_count,
                word_count=word_count,
                processing_time=processing_time,
            )
        finally:
            fitz_doc.close()

    def detect_chapters(self, content: List[StructuredContent]) -> List[Chapter]:
        chapters: List[Chapter] = []
        current_chapter: Optional[Chapter] = None
        for element in content:
            if element.content_type == ContentType.HEADING:
                if self._is_chapter_heading(element.text, element.level or 1):
                    if current_chapter:
                        current_chapter.end_page = element.page_number - 1
                        chapters.append(current_chapter)
                    current_chapter = Chapter(
                        title=element.text.strip(),
                        level=element.level or 1,
                        start_page=element.page_number,
                        content=[],
                    )
                elif (
                    current_chapter
                    and element.level
                    and element.level > (current_chapter.level)
                ):
                    subsection = Chapter(
                        title=element.text.strip(),
                        level=element.level,
                        start_page=element.page_number,
                        content=[],
                    )
                    current_chapter.subsections.append(subsection)
            if current_chapter:
                current_chapter.content.append(element)
                if current_chapter.word_count is None:
                    current_chapter.word_count = 0
                current_chapter.word_count += len(element.text.split())
        if current_chapter:
            chapters.append(current_chapter)
        logger.info(f"Detected {len(chapters)} chapters")
        return chapters

    async def extract_images_and_tables(
        self, pdf_path: Union[str, Path]
    ) -> MediaAssets:
        """Optional image/table extraction controlled by settings to reduce memory usage."""
        images: List[Image] = []
        tables: List[Table] = []
        pdf_path = Path(pdf_path)
        if settings.pdf_extract_images:
            try:
                fitz_doc = fitz.open(str(pdf_path))
                images = await self._extract_images_from_doc(fitz_doc)
                fitz_doc.close()
            except Exception as e:
                logger.warning(f"Image extraction skipped due to error: {e}")
        if settings.pdf_extract_tables:
            try:
                with pdfplumber.open(str(pdf_path)) as pdf:
                    for page_num, page in enumerate(pdf.pages):
                        page_tables = page.extract_tables()
                        for table_data in page_tables:
                            if table_data and len(table_data) > 1:
                                cells: List[TableCell] = []
                                for row_idx, row in enumerate(table_data):
                                    for col_idx, cell_text in enumerate(row):
                                        if cell_text:
                                            cells.append(
                                                TableCell(
                                                    text=str(cell_text).strip(),
                                                    row=row_idx,
                                                    col=col_idx,
                                                )
                                            )
                                tables.append(
                                    Table(
                                        cells=cells,
                                        rows=len(table_data),
                                        cols=len(table_data[0]) if table_data else 0,
                                        bbox=BoundingBox(x0=0, y0=0, x1=100, y1=100),
                                        page_number=page_num,
                                    )
                                )
            except Exception as e:
                logger.warning(f"Table extraction skipped due to error: {e}")
        return MediaAssets(
            images=images,
            tables=tables,
            total_images=len(images),
            total_tables=len(tables),
        )

    def normalize_text(self, raw_text: str) -> CleanText:
        removed_elements: List[str] = []
        cleaned_text = re.sub(r"\s+", " ", raw_text)
        removed_elements.append("excessive_whitespace")
        lines = cleaned_text.split("\n")
        cleaned_lines: List[str] = []
        for line in lines:
            line = line.strip()
            if re.match(r"^\d+$", line) and len(line) <= 3:
                removed_elements.append("page_numbers")
                continue
            if len(line) < 5 and line.isupper():
                removed_elements.append("short_headers")
                continue
            cleaned_lines.append(line)
        normalized_text = "\n".join(cleaned_lines)
        return CleanText(
            original_text=raw_text,
            cleaned_text=" ".join(cleaned_lines),
            normalized_text=normalized_text,
            removed_elements=list(dict.fromkeys(removed_elements)),
            word_count=len(normalized_text.split()),
            character_count=len(normalized_text),
            language=None,
        )

    # helper methods below (unchanged signatures)
    def _extract_metadata(self, fitz_doc: fitz.Document) -> Dict[str, Any]:
        meta = fitz_doc.metadata or {}
        return {
            k: (meta.get(k) or "") for k in ["author", "title", "subject", "keywords"]
        }

    def _extract_text_elements(self, fitz_doc: fitz.Document) -> List[TextElement]:
        elements: List[TextElement] = []
        for page_num in range(len(fitz_doc)):
            page = fitz_doc[page_num]
            doc_dict = page.get_text("dict") or {}
            blocks = doc_dict.get("blocks", []) or []
            for block in blocks:
                if block.get("type") != 0:
                    continue
                for line in block.get("lines", []) or []:
                    for span in line.get("spans", []) or []:
                        text = (span.get("text") or "").strip()
                        if not text:
                            continue
                        bbox_list = span.get("bbox") or [0.0, 0.0, 0.0, 0.0]
                        try:
                            bbox = BoundingBox(
                                x0=float(bbox_list[0]),
                                y0=float(bbox_list[1]),
                                x1=float(bbox_list[2]),
                                y1=float(bbox_list[3]),
                            )
                        except Exception:
                            bbox = BoundingBox(x0=0, y0=0, x1=0, y1=0)
                        font_name = str(span.get("font") or "")
                        try:
                            font_size = float(span.get("size") or 0.0)
                        except Exception:
                            font_size = 0.0
                        try:
                            flags_val = int(span.get("flags") or 0)
                        except Exception:
                            flags_val = 0
                        font = FontInfo(
                            name=font_name, size=font_size, flags=flags_val, color=None
                        )
                        elements.append(
                            TextElement(
                                text=text, bbox=bbox, font=font, page_number=page_num
                            )
                        )
        return elements

    def _classify_content(
        self, text_elements: List[TextElement]
    ) -> List[StructuredContent]:
        structured: List[StructuredContent] = []
        for el in text_elements:
            level: Optional[int] = None
            if el.font.size >= self.large_heading_threshold:
                level = 1
            elif el.font.size >= self.heading_font_threshold:
                level = 2
            ctype = ContentType.HEADING if level else ContentType.PARAGRAPH
            structured.append(
                StructuredContent(
                    content_type=ctype,
                    text=el.text,
                    level=level,
                    page_number=el.page_number,
                    bbox=el.bbox,
                    font=el.font,
                    metadata={},
                )
            )
        return structured

    def build_toc(
        self, structured: List[StructuredContent]
    ) -> List[Dict[str, int | str]]:
        """Create a simplified table of contents from structured headings.
        Returns list of {title, level, page} sorted by page and level.
        """
        items: List[Dict[str, int | str]] = []
        for el in structured:
            if el.content_type == ContentType.HEADING and el.level:
                items.append(
                    {
                        "title": el.text.strip(),
                        "level": int(el.level),
                        "page": int(el.page_number),
                    }
                )
        # sort by page then level
        items.sort(key=lambda x: (int(x["page"]), int(x["level"])))
        return items

    def build_toc_from_pdf(
        self, pdf_path: Union[str, Path], structured: List[StructuredContent]
    ) -> List[Dict[str, int | str]]:
        """Prefer PDF bookmarks as ToC; fall back to structured headings.
        Returns list of {title, level, page} with zero-based pages.
        """
        items: List[Dict[str, int | str]] = []
        try:
            with fitz.open(str(pdf_path)) as doc:
                # PyMuPDF pages in get_toc are 1-based
                bm = doc.get_toc(simple=True) or []
                for entry in bm:
                    if not isinstance(entry, (list, tuple)) or len(entry) < 3:
                        continue
                    level, title, page = (
                        int(entry[0]),
                        str(entry[1] or ""),
                        int(entry[2]),
                    )
                    if title.strip():
                        items.append(
                            {
                                "title": title.strip(),
                                "level": level,
                                "page": max(0, page - 1),
                            }
                        )
        except Exception:
            # Ignore bookmark errors and fall back
            items = []
        if not items:
            items = self.build_toc(structured)
        # Final ordering
        items.sort(key=lambda x: (int(x["page"]), int(x["level"])))
        return items

    def _should_discard_title(self, title: str, page: int) -> bool:
        low = title.strip().lower()
        if page < settings.pdf_discard_before_page:
            return True
        for bad in settings.pdf_discard_titles:
            if bad in low:
                return True
        return False

    def detect_toc_pages(self, structured: List[StructuredContent]) -> List[int]:
        """Detect pages that likely contain the Table of Contents heading."""
        pages = set()
        keys = [k.lower() for k in settings.pdf_toc_title_keywords]
        for el in structured:
            if el.content_type == ContentType.HEADING and el.level and el.level <= 2:
                txt = el.text.strip().lower()
                if any(k in txt for k in keys):
                    pages.add(el.page_number)
        return sorted(pages)

    def split_chapters_from_toc(
        self, toc: List[Dict[str, int | str]], structured: List[StructuredContent]
    ):
        """Split chapters using only top-level ToC anchors; nest subsections where possible.
        This mirrors printed ToCs where level-1 entries are primary chapters.
        """
        anchors = [
            t
            for t in toc
            if isinstance(t.get("title"), str)
            and not self._should_discard_title(
                str(t.get("title", "")), int(t.get("page", 0))
            )
        ]
        if not anchors:
            return self.detect_chapters(structured)
        # Determine root/top level among anchors (usually 1)
        root_level = min(int(a.get("level", 1)) for a in anchors) or 1
        # Prefer anchors that look like real chapter titles
        top_anchors: List[Dict[str, int | str]] = []
        for a in anchors:
            lvl = int(a.get("level", root_level))
            title = str(a.get("title", ""))
            if lvl == root_level and self._is_chapter_heading(title, 1):
                top_anchors.append(a)
        # Fallback: if empty, take all root-level anchors
        if not top_anchors:
            top_anchors = [
                a for a in anchors if int(a.get("level", root_level)) == root_level
            ]

        # Build primary chapters from top_anchors
        chapters: List[Chapter] = []
        for idx, item in enumerate(top_anchors):
            title = str(item["title"]).strip()
            start = int(item["page"]) if item.get("page") is not None else 0
            end = None
            if idx + 1 < len(top_anchors):
                end = max(start, int(top_anchors[idx + 1]["page"]) - 1)
            chapters.append(
                Chapter(
                    title=title,
                    level=1,
                    start_page=start,
                    end_page=end or None,
                    content=[],
                    subsections=[],
                )
            )

        # Attach subsection anchors (levels > root_level)
        for a in anchors:
            lvl = int(a.get("level", root_level))
            if lvl <= root_level:
                continue
            title = str(a.get("title", "")).strip()
            page = int(a.get("page", 0))
            for ch in chapters:
                in_range = page >= ch.start_page and (
                    ch.end_page is None or page <= ch.end_page
                )
                if in_range:
                    ch.subsections.append(
                        Chapter(
                            title=title,
                            level=lvl,
                            start_page=page,
                            end_page=None,
                            content=[],
                        )
                    )
                    break

        # Attach content spans to chapter by page
        for el in structured:
            for ch in chapters:
                in_range = el.page_number >= ch.start_page and (
                    ch.end_page is None or el.page_number <= ch.end_page
                )
                if in_range:
                    ch.content.append(el)
                    break
        return chapters
