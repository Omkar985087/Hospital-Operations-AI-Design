
import fitz
from pathlib import Path

from app.document_processing.extractor import extract_text_from_pdf
from app.document_processing.ocr import documentocr


class documentprocessor:

    def __init__(self):
        self.ocr = documentocr()

    def process_pdf(self, file_path: str) -> str:

        # First, try normal PDF text extraction
        text = extract_text_from_pdf(file_path)

        # If text is available, return it
        if text.strip():
            return text

        # Otherwise, use OCR on each PDF page
        extracted_text = []

        with fitz.open(file_path) as pdf:
            for page_number, page in enumerate(pdf, start=1):

                pix = page.get_pixmap(dpi=200)

                image_path = (
                    Path(file_path).parent
                    / f"temp_page_{page_number}.png"
                )

                pix.save(str(image_path))

                page_text = self.ocr.extract_text_from_image(
                    str(image_path)
                )

                extracted_text.append(
                    f"\n--- Page {page_number} ---\n{page_text}"
                )

                image_path.unlink(missing_ok=True)

        return "\n".join(extracted_text)


if __name__ == "__main__":

    processor = documentprocessor()

    text = processor.process_pdf(
        "storage/sample_report.pdf"
    )

    print("\nFinal Extracted Text:\n")
    print(text)
