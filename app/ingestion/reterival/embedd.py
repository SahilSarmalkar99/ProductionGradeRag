from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.config import settings
import time

BATCH_SIZE = 10
# _GEMINI_DIM = 3072
_GEMINI_DIM = 768
_FALLBACK_DIM = 768  # all-mpnet-base-v2

_active_model = None
_model_type: str | None = None  # "gemini" or "fallback"

def probe_gemini():
    "check if gemini is avalable"
    try:
        model = GoogleGenerativeAIEmbeddings(
            model = "models/gemini-embedding-2-preview",
            google_api_key = settings.GEMINI_API_KEY,
            output_dimensionality=768
        )
        
        model.embed_query("probe")
        print(f'length of gemini dim : {len(model.embed_query("probe"))}')
        print("gemini is working")
        return model
    except Exception as e :
        print(f"Gemini probe failed: {e}. Will use sentence-transformers fallback.")
        return None

def fallback_model():

    from sentence_transformers import SentenceTransformer
    
    model = SentenceTransformer("all-mpnet-base-v2")
    print("Model selected fallback : all-mpnet-base-v2")
    return model

def _init():
    
    global _active_model , _model_type
    
    gemini = probe_gemini()
    
    if gemini:
        _active_model = gemini
        _model_type = "gemini"
    
    else :
        _active_model = fallback_model()
        _model_type = "fallback"
        
def get_dim():
    
    _init()
    return _GEMINI_DIM if _model_type == "gemini" else _FALLBACK_DIM

def get_emb_batch(batch: list[str]) -> list[list[float]]:
    global _active_model, _model_type

    if _model_type == "gemini":
        for attempt in range(4):
            try:
                return _active_model.embed_documents(batch)

            except Exception as e:
                err = str(e).lower()

                is_rate_limit = any(
                    x in err
                    for x in (
                        "429",
                        "rate",
                        "quota",
                        "resource_exhausted"
                    )
                )

                if is_rate_limit and attempt < 3:
                    wait = 2 ** attempt

                    print(
                        f"Gemini rate limit hit — "
                        f"retrying in {wait}s "
                        f"(attempt {attempt + 1}/4)."
                    )

                    time.sleep(wait)

                elif is_rate_limit:
                    print(
                        "Gemini rate limit persisted. "
                        "Switching to fallback model."
                    )

                    _active_model = fallback_model()
                    _model_type = "fallback"

                    return _active_model.encode(
                        batch,
                        show_progress_bar=False
                    ).tolist()

                else:
                    print(f"Gemini embedding failed: {e}")
                    raise

    return _active_model.encode(
        batch,
        show_progress_bar=False
    ).tolist()
           
def embed_query(query: str) -> list[float]:
    _init()
    
    if _model_type == "gemini":
    
        return _active_model.embed_query(query)
    
    return _active_model.encode([query])[0].tolist()

def embed_texts(texts: list[str]) -> list[list[float]]:
    _init()
    all_embeddings: list[list[float]] = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        print(f"Embedding batch: start={i}, size={len(batch)}, model={_model_type}")
        all_embeddings.extend(get_emb_batch(batch))

    return all_embeddings

# probe_gemini()