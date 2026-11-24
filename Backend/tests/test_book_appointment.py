
from datetime import date, time

from app.database.connection import SessionLocal
from app.services.appointment_service import book_appointment


def test_book_appointment():

    db = SessionLocal()

    try:
        result = book_appointment(
            db=db,
            patient_id="fa7d7cbc-581d-4f51-8f79-aabe48f0dad0",
            doctor_id=1,
            availability_id=1,  # Replace with actual availability_id
            appointment_date=date(2026, 11, 25),
            start_time=time(9, 0),
            reason="Routine consultation"
        )

        print("\n========== APPOINTMENT BOOKED ==========")
        print("Appointment ID:", result["appointment_id"])
        print("Status:", result["appointment_status"])
        print("Date:", result["appointment_date"])
        print("Start:", result["start_time"])
        print("End:", result["end_time"])

    except ValueError as e:
        print("Booking failed:", e)

    finally:
        db.close()


if __name__ == "__main__":
    test_book_appointment()
