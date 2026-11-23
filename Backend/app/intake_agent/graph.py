from langgraph.graph import StateGraph,START,END
from app.intake_agent.state import intakestate
from app.intake_agent.nodes import (validate_patient_data,extract_patient_information)

def build_intake_graph():
    graph=StateGraph(intakestate)
    
    graph.add_node("extract_information",extract_patient_information)
    graph.add_node("validate_information",validate_patient_data)
    
    graph.add_edge(START,"extract_information")
    
    graph.add_edge("extract_information","validate_information")
    
    graph.add_edge("validate_information",END)
    
    return graph.compile()

intake_graph=build_intake_graph()
