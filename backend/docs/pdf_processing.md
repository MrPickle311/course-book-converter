# PDF Processing Service Documentation

## Overview

The PDF Processing Service provides advanced text extraction, structure analysis, and media asset extraction from PDF documents. It uses PyMuPDF and pdfplumber for comprehensive document processing with optional OCR capabilities.

## Features

### Core Capabilities
- **Advanced Text Extraction**: Preserves formatting, font information, and positioning
- **Document Structure Analysis**: Automatically detects headings, paragraphs, lists, and code blocks
- **Chapter Detection**: Intelligent chapter and section detection using multiple heuristics
- **Media Asset Extraction**: Extracts images and tables with metadata
- **Text Normalization**: Comprehensive cleaning and normalization pipeline
- **OCR Support**: Optional Tesseract OCR for scanned documents

### Supported PDF Types
- Text-based PDFs with embedded fonts
- Scanned PDFs (with OCR enabled)
- Mixed content PDFs (text + images + tables)
- Multi-language documents
- Complex layouts with multiple columns

## Architecture

### Service Components

```
PDFProcessor
├── Text Extraction (PyMuPDF)
│   ├── Font Analysis
│   ├── Position Tracking
│   └── Structure Detection
├── Media Extraction
│   ├── Image Extraction (PyMuPDF)
│   ├── Table Extraction (pdfplumber)
│   └── OCR Processing (Tesseract)
└── Content Processing
    ├── Chapter Detection
    ├── Content Classification
    └── Text Normalization
```

### Data Models

#### DocumentStructure
Complete document representation with all extracted elements:

```python
class DocumentStructure(BaseModel):
    raw_text: str                               # Complete raw text
    structured_content: List[StructuredContent] # Classified content elements
    chapters: List[Chapter]                     # Detected chapters
    tables: List[Table]                        # Extracted tables
    images: List[Image]                        # Extracted images
    metadata: Dict[str, Any]                   # Document metadata
    page_count: int                            # Total pages
    word_count: int                            # Total words
    processing_time: Optional[float]           # Processing duration
```

#### Chapter
Chapter structure with hierarchical content:

```python
class Chapter(BaseModel):
    title: str                              # Chapter title
    level: int                             # Hierarchy level (1=main, 2=sub, etc.)
    start_page: int                        # Starting page (0-indexed)
    end_page: Optional[int]                # Ending page (0-indexed)
    content: List[StructuredContent]       # Chapter content elements
    subsections: List["Chapter"]           # Nested subsections
    word_count: Optional[int]              # Chapter word count
```

#### StructuredContent
Individual content elements with classification:

```python
class StructuredContent(BaseModel):
    content_type: ContentType              # HEADING, PARAGRAPH, LIST, etc.
    text: str                             # Text content
    level: Optional[int]                  # Heading level or list depth
    page_number: int                      # Page number (0-indexed)
    bbox: Optional[BoundingBox]           # Bounding box coordinates
    font: Optional[FontInfo]              # Font information
    metadata: Dict[str, Any]              # Additional metadata
```

## Usage Examples

### Basic Text Extraction

```python
from app.services import get_pdf_processor

# Get configured processor instance
processor = get_pdf_processor()

# Extract document structure
result = await processor.extract_text_with_structure("book.pdf")

print(f"Extracted {result.word_count} words from {result.page_count} pages")
print(f"Found {len(result.chapters)} chapters")
print(f"Processing took {result.processing_time:.2f} seconds")

# Access structured content
for element in result.structured_content:
    print(f"{element.content_type}: {element.text[:50]}...")
```

### Chapter Analysis

```python
# Analyze chapter structure
for chapter in result.chapters:
    print(f"Chapter {chapter.level}: {chapter.title}")
    print(f"  Pages: {chapter.start_page} - {chapter.end_page}")
    print(f"  Words: {chapter.word_count}")
    print(f"  Subsections: {len(chapter.subsections)}")

    # Access chapter content
    for content in chapter.content:
        if content.content_type == ContentType.HEADING:
            print(f"    Heading: {content.text}")
```

### Media Asset Extraction

```python
# Extract images and tables separately
media_assets = await processor.extract_images_and_tables("book.pdf")

print(f"Found {media_assets.total_images} images")
print(f"Found {media_assets.total_tables} tables")

# Process images
for image in media_assets.images:
    print(f"Image on page {image.page_number}")
    print(f"  Size: {image.size}")
    print(f"  Format: {image.format}")
    if image.alt_text:
        print(f"  OCR Text: {image.alt_text}")

# Process tables
for table in media_assets.tables:
    print(f"Table on page {table.page_number}")
    print(f"  Dimensions: {table.rows}x{table.cols}")

    # Convert to 2D array
    table_data = table.to_dict()
    for row in table_data:
        print("  ", row)
```

### Text Normalization

```python
# Clean and normalize extracted text
clean_result = processor.normalize_text(result.raw_text)

print(f"Original: {len(clean_result.original_text)} chars")
print(f"Cleaned: {len(clean_result.cleaned_text)} chars")
print(f"Normalized: {len(clean_result.normalized_text)} chars")
print(f"Removed: {clean_result.removed_elements}")
print(f"Language: {clean_result.language}")
```

## Configuration

### Environment Variables

```bash
# PDF Processing Settings
PDF_OCR_ENABLED=true                    # Enable/disable OCR
PDF_OCR_LANGUAGE=eng                    # OCR language (eng, fra, deu, etc.)
PDF_MAX_FILE_SIZE=104857600             # Max file size (100MB)
PDF_EXTRACT_IMAGES=true                 # Extract images
PDF_EXTRACT_TABLES=true                 # Extract tables
```

### Service Configuration

```python
from app.services.pdf_processor import PDFProcessor

# Custom processor configuration
processor = PDFProcessor(
    ocr_enabled=True,
    language="eng+fra"  # Multiple languages
)

# Configure font thresholds
processor.heading_font_threshold = 16.0
processor.large_heading_threshold = 20.0

# Add custom chapter patterns
processor.chapter_patterns.extend([
    r"^lesson\s+\d+",
    r"^unit\s+\d+",
])
```

## Content Classification

### Content Types
- **HEADING**: Document headings (H1-H6)
- **PARAGRAPH**: Regular text paragraphs
- **LIST**: Bulleted or numbered lists
- **TABLE**: Tabular data
- **IMAGE**: Images and figures
- **CODE**: Code blocks and snippets
- **QUOTE**: Quoted text
- **CAPTION**: Image/table captions

### Classification Logic

The service uses multiple heuristics for content classification:

1. **Font Analysis**: Size, weight, and style
2. **Position Analysis**: Layout and indentation
3. **Text Pattern Matching**: Regular expressions for specific patterns
4. **Context Analysis**: Surrounding content analysis

### Chapter Detection Patterns

Built-in patterns for chapter detection:
- `^chapter\s+\d+` - "Chapter 1", "Chapter 2", etc.
- `^ch\.\s*\d+` - "Ch. 1", "Ch. 2", etc.
- `^\d+\.\s+[A-Z]` - "1. Introduction", "2. Methods", etc.
- `^part\s+\d+` - "Part I", "Part II", etc.
- `^section\s+\d+` - "Section 1", "Section 2", etc.

## Performance Optimization

### Processing Tips

1. **Disable OCR for Text PDFs**: OCR adds significant processing time
2. **Configure Memory Limits**: Large PDFs may require memory management
3. **Use Async Processing**: All methods are async for non-blocking operation
4. **Cache Results**: Store processed results to avoid reprocessing

### Memory Management

```python
# For large PDFs, process in chunks
async def process_large_pdf(pdf_path: str):
    processor = PDFProcessor(ocr_enabled=False)  # Disable OCR for speed

    # Process structure first
    result = await processor.extract_text_with_structure(pdf_path)

    # Extract media separately if needed
    if settings.pdf_extract_images or settings.pdf_extract_tables:
        media = await processor.extract_images_and_tables(pdf_path)
        # Merge media into result if needed

    return result
```

### Batch Processing

```python
import asyncio
from pathlib import Path

async def process_pdf_batch(pdf_files: List[Path]):
    processor = get_pdf_processor()

    # Process multiple PDFs concurrently
    tasks = [
        processor.extract_text_with_structure(pdf_file)
        for pdf_file in pdf_files
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Handle results and exceptions
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"Failed to process {pdf_files[i]}: {result}")
        else:
            print(f"Processed {pdf_files[i]}: {result.word_count} words")

    return results
```

## Error Handling

### Common Error Scenarios

1. **File Not Found**: PDF file doesn't exist
2. **Invalid PDF**: Corrupted or non-PDF file
3. **OCR Errors**: Tesseract processing failures
4. **Memory Errors**: Large file processing issues
5. **Permission Errors**: File access restrictions

### Error Handling Example

```python
from app.services import get_pdf_processor
from app.services.types import DocumentStructure

async def safe_pdf_processing(pdf_path: str) -> Optional[DocumentStructure]:
    processor = get_pdf_processor()

    try:
        # Validate file size
        file_size = Path(pdf_path).stat().st_size
        if file_size > settings.pdf_max_file_size:
            raise ValueError(f"File too large: {file_size} bytes")

        # Process PDF
        result = await processor.extract_text_with_structure(pdf_path)

        # Validate results
        if result.word_count == 0:
            logger.warning(f"No text extracted from {pdf_path}")

        return result

    except FileNotFoundError:
        logger.error(f"PDF file not found: {pdf_path}")
    except Exception as e:
        logger.error(f"PDF processing failed: {e}")

    return None
```

## Integration with Database

### Storing Results

```python
from app.models import Book, BookMetadata
from app.services import get_pdf_processor

async def process_and_store_book(book_id: str, pdf_path: str):
    processor = get_pdf_processor()

    # Process PDF
    result = await processor.extract_text_with_structure(pdf_path)

    # Update book record
    book = await Book.get(book_id)
    book.processing_status = ProcessingStatus.COMPLETED
    book.chapter_count = len(result.chapters)
    book.total_words = result.word_count
    book.extracted_text_preview = result.raw_text[:500]

    # Store metadata
    book.metadata = BookMetadata(
        file_size=Path(pdf_path).stat().st_size,
        file_type="application/pdf",
        page_count=result.page_count,
        language=result.metadata.get("language"),
    )

    # Store AI analysis placeholder
    book.ai_analysis = {
        "chapters": [
            {
                "title": chapter.title,
                "level": chapter.level,
                "word_count": chapter.word_count,
                "pages": f"{chapter.start_page}-{chapter.end_page}"
            }
            for chapter in result.chapters
        ],
        "content_types": {
            content_type.value: len([
                c for c in result.structured_content
                if c.content_type == content_type
            ])
            for content_type in ContentType
        },
        "processing_time": result.processing_time
    }

    await book.save()
    return result
```

## Testing

### Running Tests

```bash
# Run PDF processor tests
poetry run python scripts/test_pdf_processor.py

# Test with custom PDF
poetry run python -c "
import asyncio
from app.services import get_pdf_processor

async def test():
    processor = get_pdf_processor()
    result = await processor.extract_text_with_structure('your_book.pdf')
    print(f'Chapters: {len(result.chapters)}')
    print(f'Words: {result.word_count}')

asyncio.run(test())
"
```

### Test Coverage

The test suite covers:
- ✅ Basic text extraction
- ✅ Chapter detection algorithms
- ✅ Content type classification
- ✅ Text normalization pipeline
- ✅ Error handling scenarios
- ✅ Media asset extraction
- ✅ Performance characteristics

## Troubleshooting

### Common Issues

1. **OCR Not Working**
   - Install Tesseract: `sudo apt-get install tesseract-ocr`
   - Install language packs: `sudo apt-get install tesseract-ocr-eng`

2. **Memory Issues with Large PDFs**
   - Increase system memory limits
   - Disable OCR for text-based PDFs
   - Process pages in smaller batches

3. **Poor Chapter Detection**
   - Customize chapter patterns for specific document types
   - Adjust font size thresholds
   - Review document structure manually

4. **Missing Dependencies**
   - Ensure all PDF processing dependencies are installed
   - Check PyMuPDF and pdfplumber versions
   - Verify Pillow installation for image processing

This comprehensive PDF processing service provides the foundation for converting books into structured course content with high accuracy and performance.
