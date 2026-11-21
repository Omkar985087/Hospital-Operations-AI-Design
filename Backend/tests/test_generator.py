
from app.rag.generator import raggenerator


def main():

    generator = raggenerator()

    question = "What is the patient's hemoglobin level?"

    result = generator.generate_answer(
        question=question,
        patient_id="P001",
        top_k=3
    )

    print("\nGenerated Answer:\n")
    print(result["answer"])

    print("\nSource Documents:\n")

    for source in result["sources"]:
        print(source)


if __name__ == "__main__":
    main()
