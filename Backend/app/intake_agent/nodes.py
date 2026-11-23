import json
import os
import re

from datetime import date
from dotenv import load_dotenv
from langchain_groq import ChatGroq

from app.intake_agent.prompts import INTAKE_EXTRACTION_PROMPT

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