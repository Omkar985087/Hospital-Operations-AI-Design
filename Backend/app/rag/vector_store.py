
import json

from app.database.connection import engine

VECTOR_DIMENSION = 384


def store_embedding(chunks, embeddings, patient_id, document_id):

    if len(chunks) != len(embeddings):
        raise ValueError("Chunks and embeddings count mismatch")

    if not chunks:
        print("No chunks to store.")
        return

    records = []

    for index, (chunk, embedding) in enumerate(zip(chunks, embeddings)):

        if len(embedding) != VECTOR_DIMENSION:
            raise ValueError(
                f"Expected {VECTOR_DIMENSION} dimensions, "
                f"received {len(embedding)}"
            )

        records.append((
            patient_id,
            document_id,
            index,
            chunk,
            json.dumps(embedding),
            json.dumps({"source": "medical_report"})
        ))

    query = """
        INSERT INTO dbo.MedicalDocumentChunks
        (
            patient_id,
            document_id,
            chunk_index,
            content,
            embedding,
            extra_metadata
        )
        VALUES (?, ?, ?, ?, CAST(CAST(? AS NVARCHAR(MAX)) AS VECTOR(384)), ?)
    """

    with engine.begin() as connection:

        for record in records:
            connection.exec_driver_sql(query, record)

    print(f"Successfully stored {len(records)} chunks!")


def search_similar_chunks(query_embedding, patient_id, top_k=10):

    if len(query_embedding) != VECTOR_DIMENSION:
        raise ValueError("Invalid query embedding dimension")

    query_vector = json.dumps(query_embedding.tolist())

    query = """
        SELECT TOP (?)
            id,
            patient_id,
            document_id,
            chunk_index,
            content,
            VECTOR_DISTANCE(
                'cosine',
                embedding,
                CAST(CAST(? AS NVARCHAR(MAX)) AS VECTOR(384))
            ) AS distance

        FROM dbo.MedicalDocumentChunks

        WHERE patient_id = ?

        ORDER BY distance ASC
    """

    with engine.connect() as connection:

        result = connection.exec_driver_sql(
            query,
            (top_k, query_vector, patient_id)
        )

        results = []

        for row in result:
            results.append({
                "id": row.id,
                "patient_id": row.patient_id,
                "document_id": row.document_id,
                "chunk_index": row.chunk_index,
                "content": row.content,
                "distance": row.distance
            })

        return results