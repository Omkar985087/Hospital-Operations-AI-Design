import json
import os
import re

from datetime import date
from dotenv import load_dotenv
from langchain_groq import ChatGroq

from app.intake_agent.prompts import INTAKE_EXTRACTION_PROMPT
from app.database.connection import SessionLocal
from app.services.patient_service import register_patient

load_dotenv()

def validate_patient_data(state:dict)->dict:
    patient_data=state.get("patient_data",{})
    
    required_fields=[
        "name",
        "date_of_birth",
        "phone_no"
    ]
    
    missing_fields=[]
    
    for field in required_fields:
        value=patient_data.get(field)
        
        if value is None or not str(value).strip():
            missing_fields.append(field)
            
    phone=patient_data.get("phone_no")
    
    if phone and not re.fullmatch(r"\d{10}",str(phone)):
        return {
            "is_valid":False,
            "missing_fields":missing_fields,
            "assistant_response":"Please provide a valid 10-digit phone number"
        }
        
    dob=patient_data.get("date_of_birth")
    
    if dob and "date_of_birth" not in missing_fields:
        try:
            dob=date.fromisoformat(str(dob))
            
            if dob>=date.today():
                return {
                    "is_valid":False,
                    "missing_fields":missing_fields,
                    "assistant_response":"Please provide a valid date of birth"
                }
        except ValueError:
            return {
                "is_valid": False,
                "missing_fields": missing_fields,
                "assistant_response": "Date of birth must use YYYY-MM-DD format."
            }
            
    if missing_fields:
        return {
            "is_valid": False,
            "missing_fields": missing_fields,
            "assistant_response": (
                "Please provide the following missing information: "
                + ", ".join(missing_fields)
            )
        }
        
    return {
        "is_valid": True,
        "missing_fields": [],
        "assistant_response": "Patient information validated successfully."
    }
    
def extract_patient_information(state:dict)->dict:
    llm=ChatGroq(
        model="openai/gpt-oss-20b",
        temperature=0
    )
    
    reponse=llm.invoke([
        ("system",INTAKE_EXTRACTION_PROMPT),
        ("human",state['user_message'])
    ])
    
    extracted_data=json.loads(reponse.content)
    
    existing_data = state.get("patient_data", {})

    updated_data = existing_data.copy()

    # Only replace existing values with newly extracted,
    # non-empty information
    for key, value in extracted_data.items():
        if value is not None and str(value).strip():
            updated_data[key] = value

    return {
        "patient_data": updated_data
    }
    
def followup_node(state:dict)->dict:
    missing_fields=state.get("missing_fields",[])
    
    field_questions = {
        "name": "Please provide the patient's full name.",
        "date_of_birth": "Please provide the patient's date of birth in YYYY-MM-DD format.",
        "phone_no": "Please provide the patient's 10-digit phone number."
    }
    
    questions=[field_questions[field]
               for field in missing_fields
               if field in field_questions]
    
    return {
        "assistant_response": " ".join(questions)
    }
    
def prepare_registration_confirmation(state:dict)->dict:
    patient_data=state.get("patient_data",{})
    
    if not state.get("is_valid"):
        return {"assistant_response":"Patient information is incomplete"}
    
    message = (
        "Please confirm the patient registration:\n\n"
        f"Name: {patient_data.get('name')}\n"
        f"Date of Birth: {patient_data.get('date_of_birth')}\n"
        f"Phone: {patient_data.get('phone_no')}\n\n"
        "Do you want to register this patient? (Yes/No)"
    )
    
    return {
        "assistant_response":message,
        "awaiting_confirmation":True
    }
    
def handle_registration_confirmation(state:dict)->dict:
    response=state.get("user_message","").strip().lower()
    
    yes_responses = {"yes", "y", "yeah", "yep", "confirm", "confirmed"}
    no_responses = {"no", "n", "nope", "cancel", "cancel registration"}
   
    if response in yes_responses:
         return {
            "confirmed": True,
            "awaiting_confirmation": False,
            "registration_status": "CONFIRMED",
            "assistant_response": (
                "Registration confirmed. Proceeding with patient registration."
            )
        }
    elif response in no_responses:
        return {
            "confirmed": False,
            "awaiting_confirmation": False,
            "registration_status": "CANCELLED",
            "assistant_response": (
                "Patient registration has been cancelled. "
                "No patient record was created."
            )
        }
        
    return {
        "confirmed": False,
        "awaiting_confirmation": True,
        "registration_status": "PENDING",
        "assistant_response": (
            "Please respond with Yes to confirm registration "
            "or No to cancel it."
        )
    }
    

def register_patient_node(state: dict) -> dict:
    """
    Registers a patient in SQL Server after explicit confirmation.
    """

    if not state.get("confirmed"):
        return {
            "registration_status": "CANCELLED",
            "assistant_response": "Registration was not confirmed."
        }

    patient_data = state.get("patient_data", {})

    # Map Intake Agent fields to SQL Server column names
    registration_data = {
        "full_name": patient_data["name"],
        "date_of_birth": patient_data["date_of_birth"],
        "phone": patient_data["phone_no"]
    }

    db = SessionLocal()

    try:
        patient_record = register_patient(db, registration_data)

        return {
            "patient_id": patient_record.patient_id,
            "registration_status": "REGISTERED",
            "assistant_response": (
                "Patient registered successfully!\n\n"
                f"Patient ID: {patient_record.patient_id}\n"
                f"Name: {patient_record.full_name}"
            )
        }

    except Exception as e:
        return {
            "registration_status": "FAILED",
            "assistant_response": (
                "Patient registration failed. "
                "Please try again or contact the administrator."
            )
        }

    finally:
        db.close()
