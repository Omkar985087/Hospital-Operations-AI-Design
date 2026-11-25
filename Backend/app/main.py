from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.documents import router as documents_router
from app.api.patients import router as patients_router
from app.api.appointments import router as appointments_router

app=FastAPI(
    title="Hospital Operations AI Design",
    description="Multi-agent hospital administration and document intelligence system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    documents_router,
    prefix="/documents",
    tags=["Documents"]
)

app.include_router(
    patients_router,
    prefix="/patients",
    tags=["Patients"]
)

app.include_router(appointments_router)

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