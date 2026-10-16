import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional

from fastapi import FastAPI , Response
from fastapi.middleware.cors import CORSMiddleware
from app.gaurdrails.guardrail import guard , initialize_rails
from app.agents.graph import rag_agent



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    initialize_rails()

class QueryReq(BaseModel):
    q : str
    thread_id : Optional[str] = "default_user"

@app.get("/")
def home():
    return {"message": "Enterprise LangGraph RAG API is live."}

@app.get("/graph")
def agent_graph():
    
    try:
        png_bytes = rag_agent.get_graph().draw_mermaid_png()
        return Response(content = png_bytes , media_type = "image/png")
    except Exception as e:
        return {"error": f"Could not generate graph image: {e}"}

@app.post("/query")
def agent(request : QueryReq):
    
    q = request.q
    thread_id = request.thread_id
    
    initial_state ={
        "messages" :[{"role" : "User" , "content" : q}],
        "current_query" : q,
        "documents" : [],
        "plan" : ["Start"],
        "status" : "Initializing Graph...",
    }
    
    config = {"configurable" : {"thread_id" : thread_id}}
    
    try :
        rail_fired , rail_response = guard(q)
        if rail_fired:
            print("Msg blocked by the rail guardrail")
            return{
                "question" : q,
                "answer": rail_response,
                "thought_process": ["Intent: Guardrails Fired", "Retrieval: Skipped"],
                "status": "Blocked by guardrails.",
                "sources": []
            }
        
        final_output = rag_agent.invoke(initial_state , config=config)
        
        return {
            "question" : q,
            "answer": final_output.get("final_answer"),
            "throught_process" : final_output.get("plan"),
            "status" : final_output.get("status"),
            "sources": final_output.get("documents", [])
        }
        
    except Exception as e :
        print(f"❌ Backend Execution Failed: {e}")
        return{
            "question": q,
            "answer": "I apologize, but I encountered an internal error while processing your request. Please try again later.",
            "thought_process": ["Error encountered during execution."],
            "status": "error",
            "sources": []
        }