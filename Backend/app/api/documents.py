
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
import shutil
import uuid

from app.rag.pipeline import ragpipeline

router = APIRouter()

UPLOAD_DIR = Path("storage")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
):

    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    # Generate a unique document ID
    document_id = str(uuid.uuid4())

    # Save uploaded file
    file_path = UPLOAD_DIR / f"{document_id}.pdf"

    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Process document through RAG pipeline
        pipeline = ragpipeline()

        result = pipeline.ingest_document(
            file_path=str(file_path),
            patient_id=patient_id,
            document_id=document_id
        )

        return result

    except Exception as e:
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(e)}"
        )

    finally:
        await file.close()
