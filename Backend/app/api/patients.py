from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.patient_service import register_patient


router = APIRouter()


class PatientRegistrationRequest(BaseModel):
    full_name: str
    date_of_birth: date
    gender: str | None = None
    phone: str
    email: EmailStr | None = None
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None


@router.post("/register")
def register_new_patient(
    request: PatientRegistrationRequest,
    db: Session = Depends(get_db)
):
    try:
        patient_data = request.model_dump()

        patient = register_patient(
            db=db,
            patient_data=patient_data
        )

        return {
            "message": "Patient registered successfully",
            "patient_id": patient.patient_id,
            "full_name": patient.full_name,
            "registration_status": patient.registration_status
        }

    except Exception as e:
        print("PATIENT REGISTRATION ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=f"Patient registration failed: {str(e)}"
        )