from sentence_transformers import SentenceTransformer

class embeddinggenerator:
    def __init__(self):
        self.model=SentenceTransformer("all-MiniLM-L6-v2")
        
    def generate_embedding(self,text:str):
        embedding=self.model.encode(text)
        return embedding
    
    def generate_embeddings(self,chunks:list[str]):
        chunk_embedding=self.model.encode(chunks)
        return chunk_embedding.tolist()
    