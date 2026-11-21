
from app.rag.pipeline import ragpipeline


def main():

    pipeline = ragpipeline()

    result = pipeline.ingest_document(
        file_path="storage/sample_report.pdf",
        patient_id="P002",
        document_id="DOC002"
    )

    print("\nDocument Ingestion Result:")
    print(result)


if __name__ == "__main__":
    main()
