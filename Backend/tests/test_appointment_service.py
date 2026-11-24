
from datetime import date

from app.database.connection import SessionLocal
from app.services.appointment_service import get_available_slots


def test_available_slots():

    db = SessionLocal()

    try:
        slots = get_available_slots(
            db=db,
            appointment_date=date(2026, 11, 25),
            doctor_id=1
        )

        print("\n========== AVAILABLE APPOINTMENT SLOTS ==========")

        for slot in slots:
            print(
                f"Doctor: {slot['doctor_name']} | "
                f"Specialization: {slot['specialization']} | "
                f"Date: {slot['available_date']} | "
                f"Start: {slot['slot_start']} | "
                f"End: {slot['slot_end']}"
            )

        print(f"\nTotal available slots: {len(slots)}")

    finally:
        db.close()


if __name__ == "__main__":
    test_available_slots()
