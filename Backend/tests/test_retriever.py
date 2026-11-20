
from app.rag.retriever import documentretriever


def main():

    retriever = documentretriever()

    question = "What is the patient's hemoglobin level?"

    results = retriever.retrieve(
        question=question,
        patient_id="P001",
        top_k=3
    )

    print("\nRetrieved Documents:\n")

    for result in results:
        print("Content:", result["content"])
        print("Distance:", result["distance"])
        print("-" * 50)


if __name__ == "__main__":
    main()
