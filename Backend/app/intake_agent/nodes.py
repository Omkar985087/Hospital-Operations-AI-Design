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
        "full_name",
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
        (
            "system",INTAKE_EXTRACTION_PROMPT
        ),
        (
            "human",
            state['user_message']
        )
    ])
    
    extracted_data=json.loads(reponse.content)
    
    return {
        "patient_data":extracted_data
    }