from app.rag.embedding import embeddinggenerator
from app.rag.vector_store import search_similar_chunks

class documentretriever:
    def __init__(self):
        self.embedding_generator = embeddinggenerator()

    def retrieve(
        self,
        question: str,
        patient_id: str,
        top_k: int = 10
    ):

        # Validate question
        if not question or not question.strip():
            return []

        # Generate embedding for question
        query_embedding = (
            self.embedding_generator.generate_embedding(question)
        )

        # Search similar chunks
        results = search_similar_chunks(
            query_embedding=query_embedding,
            patient_id=patient_id,
            top_k=top_k
        )

        return results