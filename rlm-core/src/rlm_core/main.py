"""
RLM Core - Local Reasoning Engine for WorkGraph OS

FastAPI microservice that provides:
1. Local SLM verification (Ollama: Phi-3, Llama 3.2)
2. Smart routing between local and cloud models
3. Local embedding generation
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal, Optional
import httpx
import json
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends

app = FastAPI(
    title="RLM Core",
    description="Local Reasoning Engine for WorkGraph OS",
    version="1.0.0"
)

security = HTTPBearer()

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_LOCAL_MODEL = os.getenv("DEFAULT_LOCAL_MODEL", "phi3:mini")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validates the Supabase JWT. Zero Trust enforcement."""
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="Server configuration error: JWT secret not set.")
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {str(e)}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_LOCAL_MODEL = os.getenv("DEFAULT_LOCAL_MODEL", "phi3:mini")


# --- Schemas ---

class VerificationRequest(BaseModel):
    """Request for local verification of a claim against context."""
    claim: str
    context: list[dict] = Field(default_factory=list)
    pin_nodes: list[dict] = Field(default_factory=list)
    task_complexity: Literal["LOW", "MEDIUM", "HIGH"] = "LOW"


class VerificationResponse(BaseModel):
    """Response from local verification."""
    consistent: bool
    confidence: float
    reasoning: str
    model_used: str
    cost_usd: float = 0.0  # Local models are free


class EmbeddingRequest(BaseModel):
    """Request for local embedding generation."""
    texts: list[str]
    model: str = "nomic-embed-text"


class EmbeddingResponse(BaseModel):
    """Response with embeddings."""
    embeddings: list[list[float]]
    model_used: str
    dimensions: int


class SmartRouteRequest(BaseModel):
    """Request to determine optimal model for a task."""
    task_type: Literal["verification", "generation", "embedding", "planning"]
    input_tokens: int
    complexity: Literal["LOW", "MEDIUM", "HIGH"]
    require_high_quality: bool = False


class SmartRouteResponse(BaseModel):
    """Response with routing decision."""
    use_local: bool
    recommended_model: str
    estimated_cost_usd: float
    reasoning: str


# --- Endpoints ---

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "rlm-core"}


@app.post("/verify", response_model=VerificationResponse)
async def verify_claim(req: VerificationRequest, _=Depends(verify_jwt)):
    """
    Verify if a claim is consistent with PIN nodes using a local SLM.
    This handles 80% of verification tasks without cloud API costs.
    """
    # Build the verification prompt
    context_summary = "\n".join([
        f"- [{n.get('type', 'node')}] {n.get('statement', n.get('content', str(n)))[:200]}"
        for n in req.context[:5]
    ])
    
    pin_summary = "\n".join([
        f"- [PIN] {n.get('statement', n.get('content', str(n)))[:200]}"
        for n in req.pin_nodes
    ])
    
    prompt = f"""You are a logic verification engine. Determine if the following CLAIM is consistent with the established INVARIANTS (PIN nodes).

INVARIANTS (GROUND TRUTH - Cannot be contradicted):
{pin_summary if pin_summary else "No invariants established."}

CONTEXT:
{context_summary if context_summary else "No additional context."}

CLAIM TO VERIFY:
{req.claim}

Respond in JSON format:
{{"consistent": true/false, "confidence": 0.0-1.0, "reasoning": "brief explanation"}}
"""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": DEFAULT_LOCAL_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
            )
            response.raise_for_status()
            result = response.json()
            
            # Parse the response
            try:
                parsed = json.loads(result.get("response", "{}"))
                return VerificationResponse(
                    consistent=parsed.get("consistent", True),
                    confidence=parsed.get("confidence", 0.7),
                    reasoning=parsed.get("reasoning", "Local model verification"),
                    model_used=DEFAULT_LOCAL_MODEL,
                    cost_usd=0.0
                )
            except json.JSONDecodeError:
                return VerificationResponse(
                    consistent=True,
                    confidence=0.5,
                    reasoning="Could not parse model response, defaulting to consistent",
                    model_used=DEFAULT_LOCAL_MODEL,
                    cost_usd=0.0
                )
                
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Ollama not available: {str(e)}")


@app.post("/embed", response_model=EmbeddingResponse)
async def generate_embeddings(req: EmbeddingRequest, _=Depends(verify_jwt)):
    """
    Generate embeddings locally using Ollama's embedding models.
    Much faster and cheaper than cloud APIs for search.
    """
    try:
        embeddings = []
        async with httpx.AsyncClient(timeout=60.0) as client:
            for text in req.texts:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/embeddings",
                    json={
                        "model": req.model,
                        "prompt": text
                    }
                )
                response.raise_for_status()
                result = response.json()
                embeddings.append(result.get("embedding", []))
        
        dimensions = len(embeddings[0]) if embeddings and embeddings[0] else 0
        
        return EmbeddingResponse(
            embeddings=embeddings,
            model_used=req.model,
            dimensions=dimensions
        )
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Ollama not available: {str(e)}")


@app.post("/route", response_model=SmartRouteResponse)
async def smart_route(req: SmartRouteRequest, _=Depends(verify_jwt)):
    """
    Determine whether to use local or cloud model based on task characteristics.
    This is the 'Smart Router' that saves money by using local models when possible.
    """
    # Decision logic
    use_local = True
    recommended_model = DEFAULT_LOCAL_MODEL
    cost = 0.0
    reasoning = ""
    
    if req.require_high_quality:
        use_local = False
        recommended_model = "gpt-4o"
        cost = (req.input_tokens / 1_000_000) * 5.0  # Approximate
        reasoning = "High quality required - routing to cloud"
    elif req.complexity == "HIGH" and req.task_type == "generation":
        use_local = False
        recommended_model = "claude-3-5-sonnet"
        cost = (req.input_tokens / 1_000_000) * 3.0
        reasoning = "Complex generation task - routing to cloud"
    elif req.task_type == "verification" and req.complexity in ["LOW", "MEDIUM"]:
        use_local = True
        recommended_model = DEFAULT_LOCAL_MODEL
        cost = 0.0
        reasoning = "Simple verification - using free local model"
    elif req.task_type == "embedding":
        use_local = True
        recommended_model = "nomic-embed-text"
        cost = 0.0
        reasoning = "Embeddings always local for speed"
    else:
        # Default: try local first
        use_local = True
        reasoning = "Default to local for cost savings"
    
    return SmartRouteResponse(
        use_local=use_local,
        recommended_model=recommended_model,
        estimated_cost_usd=cost,
        reasoning=reasoning
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8082)
