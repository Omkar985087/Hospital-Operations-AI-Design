from sqlalchemy import Column, String, Date, DateTime, text
from app.database.base import Base


class patient(Base):

    __tablename__ = "Patients"
    __table_args__ = {"schema": "dbo"}

    patient_id = Column(String(64), primary_key=True)
    full_name = Column(String(150), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String(30))
    phone = Column(String(20), nullable=False)
    email = Column(String(150))
    address = Column(String(500))
    emergency_contact_name = Column(String(150))
    emergency_contact_phone = Column(String(20))

    registration_status = Column(
        String(30),
        nullable=False,
        server_default=text("'REGISTERED'")
    )

    created_at = Column(
        DateTime,
        server_default=text("SYSUTCDATETIME()")
    )

    updated_at = Column(
        DateTime,
        server_default=text("SYSUTCDATETIME()")
    )