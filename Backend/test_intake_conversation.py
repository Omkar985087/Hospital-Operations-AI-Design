
from app.intake_agent.graph import intake_graph

# Same thread ID must be used for both messages
config = {
    "configurable": {
        "thread_id": "rahul-registration-001"
    }
}

# First message
first_message = {
    "user_message": (
        "Register Rahul Sharma, born on 15 March 1995."
    ),
    "patient_data": {},
    "missing_fields": [],
    "is_valid": False,
    "confirmed": False,
    "patient_id": None,
    "assistant_response": "",
    "conversation_id": "rahul-registration-001"
}

print("\n========== MESSAGE 1 ==========")

result1 = intake_graph.invoke(first_message, config=config)

print("Patient data:", result1["patient_data"])
print("Missing fields:", result1["missing_fields"])
print("Agent:", result1["assistant_response"])


# Second message: provide missing phone number
second_message = {
    "user_message": "9876543210"
}

print("\n========== MESSAGE 2 ==========")

result2 = intake_graph.invoke(second_message, config=config)

print("Patient data:", result2["patient_data"])
print("Missing fields:", result2["missing_fields"])
print("Validation:", result2["is_valid"])
print("Agent:", result2["assistant_response"])
