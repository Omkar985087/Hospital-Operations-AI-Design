
from app.intake_agent.graph import intake_graph


# Test patient message
initial_state = {
    "user_message": (
        "Register Rahul Sharma, born on 15 March 1995. "
        "His phone number is 9876543210."
    )
}

# Execute LangGraph
result = intake_graph.invoke(initial_state)

print("\n========== INTAKE AGENT RESULT ==========")

print("\nExtracted Patient Information:")
print(result["patient_data"])

print("\nValidation Status:")
print(result["is_valid"])

print("\nMissing Fields:")
print(result["missing_fields"])

print("\nAssistant Response:")
print(result["assistant_response"])
