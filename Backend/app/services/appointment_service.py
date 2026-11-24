from sqlalchemy import text

def get_available_slots(db,appointment_date,doctor_id=None):
    
    query = text("""
        WITH SlotNumbers AS
        (
            SELECT 0 AS slot_number

            UNION ALL

            SELECT slot_number + 1
            FROM SlotNumbers
            WHERE slot_number < 100
        ),

        GeneratedSlots AS
        (
            SELECT
                d.doctor_id,
                d.doctor_name,
                d.specialization,
                a.availability_id,
                a.available_date,

                CAST(
                    DATEADD(
                        MINUTE,
                        s.slot_number * a.slot_duration_minutes,
                        CAST(a.start_time AS DATETIME2)
                    ) AS TIME
                ) AS slot_start,

                CAST(
                    DATEADD(
                        MINUTE,
                        (s.slot_number + 1) * a.slot_duration_minutes,
                        CAST(a.start_time AS DATETIME2)
                    ) AS TIME
                ) AS slot_end

            FROM dbo.DoctorAvailability a

            JOIN dbo.Doctors d
                ON d.doctor_id = a.doctor_id

            CROSS JOIN SlotNumbers s

            WHERE a.available_date = :appointment_date
              AND a.is_available = 1
              AND d.is_active = 1
              AND (
                    :doctor_id IS NULL
                    OR d.doctor_id = :doctor_id
                  )

              AND DATEADD(
                    MINUTE,
                    (s.slot_number + 1) * a.slot_duration_minutes,
                    CAST(a.start_time AS DATETIME2)
                  ) <= CAST(a.end_time AS DATETIME2)
        )

        SELECT
            g.doctor_id,
            g.doctor_name,
            g.specialization,
            g.availability_id,
            g.available_date,
            g.slot_start,
            g.slot_end

        FROM GeneratedSlots g

        WHERE NOT EXISTS
        (
            SELECT 1
            FROM dbo.Appointments ap
            WHERE ap.availability_id = g.availability_id
              AND ap.appointment_date = g.available_date
              AND ap.appointment_status = 'BOOKED'
              AND ap.start_time < g.slot_end
              AND ap.end_time > g.slot_start
        )

        ORDER BY g.doctor_id, g.slot_start

        OPTION (MAXRECURSION 1000);
    """)
    
    result=db.execute(
        query,
        {
            "appointment_date":appointment_date,
            "doctor_id":doctor_id
        }
    )
    
    return [
        dict(row)
        for row in result.mappings().all()
    ]
    

def book_appointment(
    db,
    patient_id,
    doctor_id,
    availability_id,
    appointment_date,
    start_time,
    reason=None
):
    """
    Books an appointment after validating availability.
    Uses SQL Server transaction locks to prevent double booking.
    """

    try:
        with db.begin():

            # Lock the doctor's availability record.
            availability = db.execute(
                text("""
                    SELECT
                        availability_id,
                        doctor_id,
                        available_date,
                        start_time,
                        end_time,
                        slot_duration_minutes
                    FROM dbo.DoctorAvailability
                        WITH (UPDLOCK, HOLDLOCK)
                    WHERE availability_id = :availability_id
                      AND doctor_id = :doctor_id
                      AND available_date = :appointment_date
                      AND is_available = 1
                """),
                {
                    "availability_id": availability_id,
                    "doctor_id": doctor_id,
                    "appointment_date": appointment_date
                }
            ).mappings().first()

            if not availability:
                raise ValueError("Doctor availability not found.")

            # Calculate the requested appointment end time.
            from datetime import datetime, timedelta

            start_dt = datetime.combine(
                appointment_date, start_time
            )

            end_dt = start_dt + timedelta(
                minutes=availability["slot_duration_minutes"]
            )

            end_time = end_dt.time()

            if (
                start_time < availability["start_time"]
                or end_time > availability["end_time"]
            ):
                raise ValueError(
                    "Requested slot is outside doctor availability."
                )

            # Verify that the slot is aligned with the schedule.
            elapsed_minutes = (
                start_dt -
                datetime.combine(
                    appointment_date,
                    availability["start_time"]
                )
            ).total_seconds() / 60

            if elapsed_minutes % availability["slot_duration_minutes"] != 0:
                raise ValueError("Invalid appointment slot.")

            # Check for overlapping bookings.
            conflict = db.execute(
                text("""
                    SELECT TOP 1 appointment_id
                    FROM dbo.Appointments
                    WHERE doctor_id = :doctor_id
                      AND appointment_date = :appointment_date
                      AND appointment_status = 'BOOKED'
                      AND start_time < :end_time
                      AND end_time > :start_time
                """),
                {
                    "doctor_id": doctor_id,
                    "appointment_date": appointment_date,
                    "start_time": start_time,
                    "end_time": end_time
                }
            ).first()

            if conflict:
                raise ValueError("This appointment slot is already booked.")

            # Insert the appointment.
            result = db.execute(
                text("""
                    INSERT INTO dbo.Appointments
                    (
                        patient_id,
                        doctor_id,
                        availability_id,
                        appointment_date,
                        start_time,
                        end_time,
                        appointment_status,
                        reason
                    )
                    OUTPUT INSERTED.appointment_id
                    VALUES
                    (
                        :patient_id,
                        :doctor_id,
                        :availability_id,
                        :appointment_date,
                        :start_time,
                        :end_time,
                        'BOOKED',
                        :reason
                    )
                """),
                {
                    "patient_id": patient_id,
                    "doctor_id": doctor_id,
                    "availability_id": availability_id,
                    "appointment_date": appointment_date,
                    "start_time": start_time,
                    "end_time": end_time,
                    "reason": reason
                }
            )

            appointment_id = result.scalar_one()

        return {
            "appointment_id": appointment_id,
            "appointment_status": "BOOKED",
            "appointment_date": appointment_date,
            "start_time": start_time,
            "end_time": end_time
        }

    except Exception:
        raise
