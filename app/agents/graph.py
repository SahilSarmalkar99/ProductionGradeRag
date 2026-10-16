from langgraph.graph import START , END , StateGraph
from langgraph.checkpoint.memory import MemorySaver
from app.agents.state import AgentState
from app.agents.nodes.planner import planner_node
from app.agents.nodes.retriever import retrieve_node
from app.agents.nodes.responder import generate_node

from app.gaurdrails.guardrail import guard , initialize_rails

initialize_rails()

workflow = StateGraph(AgentState)

workflow.add_node("planner" , planner_node)
workflow.add_node("retriever" , retrieve_node)
workflow.add_node("responder" , generate_node)

def route_planner(state : AgentState):
    """
    Routes the workflow based on the planner's decision.
    """
    
    if state["current_query"] == "CONVERSATIONAL":
        return "responder"
    return "retriever"

workflow.set_entry_point("planner")

workflow.add_conditional_edges(
    "planner",
    route_planner,
    {
        "retriever" : "retriever",
        "responder" : "responder"
    }
)

workflow.add_edge("retriever" , "responder")
workflow.add_edge("responder" , END)

checkpointer = MemorySaver()

rag_agent = workflow.compile(checkpointer=checkpointer)

# thread_id = "1"
# config = {"configurable" : {"thread_id" : thread_id}}



# msg = "tell me a joke"

# blocked , guardrail_response = guard(msg)

# if blocked:
#     print(guardrail_response)
# else:
#     res = rag_agent.invoke({
#         "current_query": msg,
#         "messages": [
#             {
#                 "role": "user",
#                 "content": msg
#             }
#         ],
#         "documents": [],
#         "plan": [],
#         "status": "",
#         "final_answer": ""
#     } , config= config)

#     print("RAG response:", res)