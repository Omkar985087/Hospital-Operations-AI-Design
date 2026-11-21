from app.document_processing.processor import documentprocessor
from app.rag.chunking import chunk_document
from app.rag.embedding import embeddinggenerator
from app.rag.vector_store import store_embedding

class ragpipeline:
    def __init__(self):
        self.document_processor=documentprocessor()
        self.embedding_generator=embeddinggenerator()
        
    def ingest_document(self,file_path:str,patient_id:str,document_id:str):
        text=self.document_processor.process_pdf(file_path)
        
        if not text.strip():
            raise ValueError("No text could be extracted from the document.")
        
        chunks=chunk_document(text)
        
        if not chunks:
            raise ValueError("No chunk could be extracted from the document.")
        
        embedding=self.embedding_generator.generate_embeddings(chunks)
        
        store_embedding(
            chunks=chunks,
            embedding=embedding,
            patient_id=patient_id,
            document_id=document_id
        )
        
        return {
            "patient_id": patient_id,
            "document_id": document_id,
            "total_chunks": len(chunks),
            "status": "success"
        }