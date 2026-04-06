import logging

logger = logging.getLogger(__name__)


async def parse_input(
    content: str,
    content_type: str,
    file_path: str | None = None,
) -> str:
    """Parse various input types into a text string for the LLM."""

    if content_type == "pdf" and file_path:
        return _extract_pdf_text(file_path)

    # text and latex pass through directly
    return content


def _extract_pdf_text(file_path: str) -> str:
    """Extract text from a PDF file using pymupdf."""
    import pymupdf

    with pymupdf.open(file_path) as document:
        pages = [page.get_text() for page in document]

    text = "\n\n".join(pages).strip()
    if not text:
        raise ValueError("Could not extract text from PDF. The file may be image-only.")

    logger.info("Extracted %d characters from PDF (%d pages)", len(text), len(pages))
    return text
