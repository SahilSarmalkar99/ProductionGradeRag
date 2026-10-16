from app.agents.state import AgentState
from langchain_groq import ChatGroq
from app.config import settings


llm = ChatGroq(
    model=settings.GROQ_MODEL,
    api_key=settings.GROQ_API_KEY
)


def planner_node(state: AgentState):
    history = ""

    for msg in state["messages"][:-1]:
        role = "User" if msg["role"] == "user" else "Assistant"
        history += f"{role}: {msg['content']}\n"

    user_message = (
        state["messages"][-1]["content"]
        if state["messages"]
        else ""
    )

    prompt = f"""
You are an intelligent RAG Planner.

Analyze the conversation history and the latest user message.

CONVERSATION HISTORY:
{history}

LATEST USER MESSAGE:
"{user_message}"

Your job is to decide whether the user's message needs information
from the knowledge base.

Return ONLY one of these:

1. CONVERSATIONAL
Use this ONLY for:
- Greetings such as hi, hello, hey
- Casual conversation
- Thanks, goodbye, etc.
- Questions that can be answered purely from the conversation history
- Follow-up questions that clearly refer only to something already stated
  in the conversation

2. A SEARCH QUERY
Use this for anything that requires knowledge from the indexed documents
or website, including:
- Products
- Product lists
- Features
- Pricing
- Documentation
- Technical information
- Company information
- Policies
- Specifications
- Availability
- Comparisons
- "What", "which", "show me", "list", "tell me", "how much", etc.
- Questions about information that is not explicitly present in the
  conversation history

IMPORTANT:
If you are uncertain whether retrieval is required, ALWAYS choose
a search query instead of CONVERSATIONAL.

The search query should preserve the user's actual information need
and be suitable for semantic search.

Output ONLY CONVERSATIONAL or the search query.
"""

    decision = llm.invoke(prompt).content.strip()

    print(f"Planner Node Decision: {decision}")

    if decision == "CONVERSATIONAL":
        return {
            "current_query": "CONVERSATIONAL",
            "status": "Handling conversationally using memory.",
            "plan": [
                "Intent: Conversational/Memory",
                "Retrieval: Skipped"
            ]
        }

    return {
        "current_query": decision,
        "status": f"Knowledge retrieval needed. Searching for: {decision}",
        "plan": [
            "Intent: Knowledge Retrieval",
            f"Search Term: {decision}"
        ]
    }