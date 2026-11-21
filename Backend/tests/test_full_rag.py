
from app.rag.pipeline import ragpipeline
from app.rag.generator import raggenerator


def main():

    # 1. Ingest the PDF
    pipeline = ragpipeline()

    result = pipeline.ingest_document(
        file_path="storage/sample_report.pdf",
        patient_id="P003",
        document_id="DOC003"
    )

    print("\nIngestion Result:")
    print(result)

    # 2. Ask a question
    generator = raggenerator()

    answer = generator.generate_answer(
        question="What is the patient's hemoglobin level?",
        patient_id="P003",
        top_k=3
    )

    print("\nGenerated Answer:")
    print(answer["answer"])

    print("\nSources:")
    for source in answer["sources"]:
        print(source)


if __name__ == "__main__":
    main()
