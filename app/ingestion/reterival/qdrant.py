from qdrant_client import QdrantClient
from app.config import settings
from app.ingestion.reterival.embedd import embed_query

client = QdrantClient(
    url= settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY
)

def search_enterprise_knowledge(query : str , limit : int = 8):
    """
    Performs a high-precision search in the enterprise knowledge base.
    Uses the modern query_points interface.
    """
    try:
        query_vector = embed_query(query)
        
        response = client.query_points(
            collection_name=settings.QDRANT_COLLECTION,
            query = query_vector,
            limit = limit,
            with_payload = True
        )
        
        results =[]
        for res in response.points:
            results.append({
                "content": res.payload.get("text", ""),
                "source": res.payload.get("source", "Unknown"),
                "score": res.score
            })
            
        return results
    except Exception as e:
        print(f"❌ Qdrant Search Failed: {e}")
        return []
        