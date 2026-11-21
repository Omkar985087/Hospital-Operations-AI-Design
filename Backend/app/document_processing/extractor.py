
import fitz


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF document.
    """

    extracted_text = []

    with fitz.open(file_path) as pdf:
        for page_number, page in enumerate(pdf, start=1):
            text = page.get_text("text")

            if text.strip():
                extracted_text.append(
                    f"\n--- Page {page_number} ---\n{text}"
                )

    return "\n".join(extracted_text)


if __name__ == "__main__":
    file_path = "storage/sample_report.pdf"

    text = extract_text_from_pdf(file_path)

    print("Extracted Text:\n")
    print(text)
