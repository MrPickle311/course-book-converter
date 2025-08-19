"""
Type definitions for PDF processing services.
"""
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ContentType(str, Enum):
    """Content type enumeration."""

    HEADING = "heading"
    PARAGRAPH = "paragraph"
    LIST = "list"
    TABLE = "table"
    IMAGE = "image"
    CODE = "code"
    QUOTE = "quote"
    CAPTION = "caption"


class HeadingLevel(int, Enum):
    """Heading level enumeration."""

    H1 = 1
    H2 = 2
    H3 = 3
    H4 = 4
    H5 = 5
    H6 = 6


class BoundingBox(BaseModel):
    """Bounding box coordinates."""

    x0: float = Field(description="Left coordinate")
    y0: float = Field(description="Top coordinate")
    x1: float = Field(description="Right coordinate")
    y1: float = Field(description="Bottom coordinate")

    @property
    def width(self) -> float:
        return self.x1 - self.x0

    @property
    def height(self) -> float:
        return self.y1 - self.y0

    @property
    def area(self) -> float:
        return self.width * self.height


class FontInfo(BaseModel):
    """Font information."""

    name: str = Field(description="Font name")
    size: float = Field(description="Font size")
    flags: int = Field(default=0, description="Font flags (bold, italic, etc.)")
    color: Optional[str] = Field(default=None, description="Font color")

    @property
    def is_bold(self) -> bool:
        """Check if font is bold."""
        return bool(self.flags & 16)

    @property
    def is_italic(self) -> bool:
        """Check if font is italic."""
        return bool(self.flags & 2)


class TextElement(BaseModel):
    """Individual text element with positioning and formatting."""

    text: str = Field(description="Text content")
    bbox: BoundingBox = Field(description="Bounding box")
    font: FontInfo = Field(description="Font information")
    page_number: int = Field(description="Page number (0-indexed)")


class StructuredContent(BaseModel):
    """Structured content element."""

    content_type: ContentType = Field(description="Type of content")
    text: str = Field(description="Text content")
    level: Optional[int] = Field(
        default=None, description="Heading level or list depth"
    )
    page_number: int = Field(description="Page number (0-indexed)")
    bbox: Optional[BoundingBox] = Field(default=None, description="Bounding box")
    font: Optional[FontInfo] = Field(default=None, description="Font information")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Additional metadata"
    )


class TableCell(BaseModel):
    """Table cell information."""

    text: str = Field(description="Cell text content")
    row: int = Field(description="Row index")
    col: int = Field(description="Column index")
    bbox: Optional[BoundingBox] = Field(default=None, description="Cell bounding box")


class Table(BaseModel):
    """Table structure."""

    cells: List[TableCell] = Field(description="Table cells")
    rows: int = Field(description="Number of rows")
    cols: int = Field(description="Number of columns")
    bbox: BoundingBox = Field(description="Table bounding box")
    page_number: int = Field(description="Page number (0-indexed)")
    caption: Optional[str] = Field(default=None, description="Table caption")

    def to_dict(self) -> List[List[str]]:
        """Convert table to 2D list format."""
        table_data = [["" for _ in range(self.cols)] for _ in range(self.rows)]
        for cell in self.cells:
            if cell.row < self.rows and cell.col < self.cols:
                table_data[cell.row][cell.col] = cell.text
        return table_data


class Image(BaseModel):
    """Image information."""

    bbox: BoundingBox = Field(description="Image bounding box")
    page_number: int = Field(description="Page number (0-indexed)")
    image_data: Optional[bytes] = Field(default=None, description="Raw image data")
    format: Optional[str] = Field(
        default=None, description="Image format (PNG, JPEG, etc.)"
    )
    size: Optional[tuple[int, int]] = Field(
        default=None, description="Image dimensions (width, height)"
    )
    caption: Optional[str] = Field(default=None, description="Image caption")
    alt_text: Optional[str] = Field(
        default=None, description="Alternative text from OCR"
    )


class Chapter(BaseModel):
    """Detected chapter information."""

    title: str = Field(description="Chapter title")
    level: int = Field(description="Chapter level (1 for main chapters)")
    start_page: int = Field(description="Starting page number (0-indexed)")
    end_page: Optional[int] = Field(
        default=None, description="Ending page number (0-indexed)"
    )
    content: List[StructuredContent] = Field(default=[], description="Chapter content")
    subsections: List["Chapter"] = Field(default=[], description="Subsections")
    word_count: Optional[int] = Field(default=None, description="Word count")


class DocumentStructure(BaseModel):
    """Complete document structure."""

    raw_text: str = Field(description="Raw extracted text")
    structured_content: List[StructuredContent] = Field(
        description="Structured content elements"
    )
    chapters: List[Chapter] = Field(description="Detected chapters")
    tables: List[Table] = Field(description="Extracted tables")
    images: List[Image] = Field(description="Extracted images")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Document metadata"
    )
    page_count: int = Field(description="Total number of pages")
    word_count: int = Field(description="Total word count")
    processing_time: Optional[float] = Field(
        default=None, description="Processing time in seconds"
    )


class MediaAssets(BaseModel):
    """Extracted media assets."""

    images: List[Image] = Field(description="Extracted images")
    tables: List[Table] = Field(description="Extracted tables")
    total_images: int = Field(description="Total number of images")
    total_tables: int = Field(description="Total number of tables")


class CleanText(BaseModel):
    """Cleaned and normalized text."""

    original_text: str = Field(description="Original text")
    cleaned_text: str = Field(description="Cleaned text")
    normalized_text: str = Field(description="Normalized text")
    removed_elements: List[str] = Field(description="List of removed elements")
    word_count: int = Field(description="Word count after cleaning")
    character_count: int = Field(description="Character count after cleaning")
    language: Optional[str] = Field(default=None, description="Detected language")


class ToCItem(BaseModel):
    """Single Table-of-Contents entry."""

    title: str
    level: int = Field(ge=1, le=6)
    page: int = Field(ge=0, description="Zero-based page index")


# Update forward references
Chapter.model_rebuild()
