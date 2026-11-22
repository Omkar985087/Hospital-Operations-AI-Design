
import uuid

from app.database.models.patient import patient as PatientModel


def register_patient(db, patient_data):

    try:
        patient_record = PatientModel(
            patient_id=str(uuid.uuid4()),
            full_name=patient_data["full_name"],
            date_of_birth=patient_data["date_of_birth"],
            gender=patient_data.get("gender"),
            phone=patient_data["phone"],
            email=patient_data.get("email"),
            address=patient_data.get("address"),
            emergency_contact_name=patient_data.get(
                "emergency_contact_name"
            ),
            emergency_contact_phone=patient_data.get(
                "emergency_contact_phone"
            )
        )

        db.add(patient_record)
        db.commit()
        db.refresh(patient_record)

        return patient_record

    except Exception:
        db.rollback()
        raise
