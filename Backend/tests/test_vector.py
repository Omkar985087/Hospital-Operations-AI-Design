
from app.rag.chunking import chunk_document
from app.rag.embedding import embeddinggenerator

from app.rag.vector_store import (
    store_embedding,
    search_similar_chunks
)


def main():

    text = """
    Patient blood test report.

    Hemoglobin: 13.5 g/dL.
    WBC: 7500 cells/mcL.
    Platelets: 250000 cells/mcL.

    Patient visited the hospital for a routine examination.
    """

    # Step 1: Chunking
    chunks = chunk_document(text)

    print("Total chunks:", len(chunks))

    # Step 2: Generate embeddings
    generator = embeddinggenerator()

    embeddings = generator.generate_embeddings(chunks)

    print("Embedding dimensions:", len(embeddings[0]))

    # Step 3: Store embeddings
    store_embedding(
        chunks=chunks,
        embeddings=embeddings,
        patient_id="P001",
        document_id="DOC001"
    )

    # Step 4: Search
    question = "What was the patient's hemoglobin level?"

    query_embedding = generator.generate_embedding(question)

    results = search_similar_chunks(
        query_embedding=query_embedding,
        patient_id="P001",
        top_k=3
    )

    print("\nRetrieved Results:")

    for result in results:
        print("\nContent:", result["content"])
        print("Distance:", result["distance"])


if __name__ == "__main__":
    main()
