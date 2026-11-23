from datetime import date
import re

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