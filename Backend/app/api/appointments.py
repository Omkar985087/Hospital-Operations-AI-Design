
from datetime import date, time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.appointment_service import (
    get_available_slots,
    book_appointment
)

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"]
)


class AppointmentBookingRequest(BaseModel):
    patient_id: str
    doctor_id: int
    availability_id: int
    appointment_date: date
    start_time: time
    reason: Optional[str] = None


@router.get("/available")
def available_appointments(
    appointment_date: date,
    doctor_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    slots = get_available_slots(
        db=db,
        appointment_date=appointment_date,
        doctor_id=doctor_id
    )

    return {
        "total_slots": len(slots),
        "available_slots": slots
    }


@router.post("/book")
def create_appointment(
    request: AppointmentBookingRequest,
    db: Session = Depends(get_db)
):
    try:
        result = book_appointment(
            db=db,
            patient_id=request.patient_id,
            doctor_id=request.doctor_id,
            availability_id=request.availability_id,
            appointment_date=request.appointment_date,
            start_time=request.start_time,
            reason=request.reason
        )

        return {
            "message": "Appointment booked successfully",
            "appointment": result
        }

    except ValueError as e:
        raise HTTPException(
            status_code=409,
            detail=str(e)
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Appointment booking failed."
        )
