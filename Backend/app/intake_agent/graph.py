from langgraph.graph import StateGraph,START,END
from app.intake_agent.state import intakestate
from app.intake_agent.nodes import (validate_patient_data,extract_patient_information,followup_node,prepare_registration_confirmation,
                                    handle_registration_confirmation)
from langgraph.checkpoint.memory import InMemorySaver

def route_before_extraction(state:intakestate):
    if (state.get("awaiting_confirmation",False)):
        return "handle_confirmation"
    
    return "extract_confirmation"

def route_after_validation(state: intakestate):
    if state["is_valid"]:
        return "information_complete"

    return "information_incomplete"

def build_intake_graph():
    graph=StateGraph(intakestate)
    
    graph.add_node("extract_information",extract_patient_information)
    graph.add_node("validate_information",validate_patient_data)
    graph.add_node("followup",followup_node)
    graph.add_node("prepare_confirmation",prepare_registration_confirmation)
    graph.add_node("handle_confirmation", handle_registration_confirmation)
    
    graph.add_conditional_edges(
        START,
        route_before_extraction,
        {
            "extract_information":"extract_information",
            "handle_confirmation":"handle_confirmation"
        }
    )
    
    graph.add_edge("extract_information","validate_information")
    
    graph.add_conditional_edges(
        "validate_information",
        route_after_validation,
        {
            "information_complete": "prepare_confirmation",
            "information_incomplete": "followup"
        }
    )
    
    graph.add_edge("followup", END)
    graph.add_edge("prepare_confirmation", END)
    graph.add_edge("handle_confirmation", END)
    return graph.compile(checkpointer=InMemorySaver())

intake_graph=build_intake_graph()
