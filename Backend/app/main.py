from fastapi import FastAPI
from app.api.documents import router as documents_router

app=FastAPI(
    title="Hospital Operations AI Design",
    description="Multi-agent hospital administration and document intelligence system",
    version="1.0.0"
)

app.include_router(
    documents_router,
    prefix="/documents",
    tags=["Documents"]
)

@app.get("/")
def home():
    return {
        "message":"Hospital Operations AI Design backend is running",
        "status":"running"
    }
    
app.get("/health")
def health_check():
    return {
        "status":"healthy",
        "service":"Hospital Operations AI Design"
    }