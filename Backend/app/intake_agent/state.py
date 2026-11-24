from typing import TypedDict,Optional

class intakestate(TypedDict):
    user_message:str
    patient_data:dict
    missing_fields:list[str]
    is_valid:bool
    confirmed:bool
    awaiting_confirmation: bool
    patient_id:Optional[str]
    assistant_response:str
    conversation_id: str