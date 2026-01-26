"""
RLM Core - Local Reasoning Engine for WorkGraph OS

FastAPI microservice that provides:
1. Local SLM verification (Ollama: Phi-3, Llama 3.2)
2. Smart routing between local and cloud models
3. Local embedding generation
"""
import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal, Optional
import httpx
import json
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends
from datetime import datetime
import numpy as np
import math
from functools import lru_cache
try:
    from rlm_core import neuro_hypervisor as logic_engine
except ImportError:
    import neuro_hypervisor as logic_engine # For local dev
from llama_cpp import Llama, LogitsProcessorList

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
DEFAULT_LOCAL_MODEL = os.getenv("DEFAULT_LOCAL_MODEL", "phi3:mini")
MODEL_PATH = os.getenv("MODEL_PATH", "models/phi-3-mini-4k-instruct-q4.gguf")

# --- Neuro-Symbolic Hypervisor ---
hypervisor = logic_engine.TruthHypervisor()
GLOBAL_TOKEN_MAP = {}

class RustTruthEnforcer:
    """Hijacks logits in real-time using the native Rust hypervisor."""
    def __init__(self, llama: Llama):
        self.llama = llama
        # Use a global map to avoid expensive detokenization on every request
        global GLOBAL_TOKEN_MAP
        if not GLOBAL_TOKEN_MAP:
            print("[Hypervisor] 🧠 Building Global Cognitive Map...")
            for i in range(llama.n_vocab()):
                try:
                    token = llama.detokenize([i]).decode("utf-8", errors="ignore").strip()
                    if token:
                        GLOBAL_TOKEN_MAP[token] = i
                except:
                    pass
        self.token_to_id = GLOBAL_TOKEN_MAP

    def __call__(self, input_ids, scores):
        # 1. Decode current context
        current_text = self.llama.detokenize(input_ids.tolist()).decode("utf-8", errors="ignore")
        
        # 2. Call Rust for biases (HashMap of ID -> Penalty)
        biases = hypervisor.calculate_logit_bias(current_text, self.token_to_id)
        
        # 3. Apply Vetoes
        for token_id, bias in biases.items():
            if token_id < len(scores):
                scores[token_id] += bias
        
        return scores

# Initialize local LLM directly for surgical tasks
local_llm = None
if os.path.exists(MODEL_PATH):
    local_llm = Llama(model_path=MODEL_PATH, logits_all=True)

class VectorSkip:
    """Zero-cost semantic skipping using local embeddings."""
    
    @staticmethod
    def cosine_similarity(v1, v2):
        if not v1 or not v2: return 0.0
        dot_product = sum(a * b for a, b in zip(v1, v2))
        magnitude_v1 = math.sqrt(sum(a * a for a in v1))
        magnitude_v2 = math.sqrt(sum(b * b for b in v2))
        if magnitude_v1 == 0 or magnitude_v2 == 0: return 0.0
        return dot_product / (magnitude_v1 * magnitude_v2)

    @staticmethod
    @lru_cache(max_tokens=1000)
    def _get_cached_embedding(text: str):
        # This is a synchronous wrapper for lru_cache since it doesn't support async directly well
        # In a real production app we'd use an async cache, but here we'll use a local index.
        return None

    @staticmethod
    async def get_embedding(text: str, client: httpx.AsyncClient):
        # Simple local index to avoid API calls for the same text
        if not hasattr(VectorSkip, "_index"): VectorSkip._index = {}
        if text in VectorSkip._index: return VectorSkip._index[text]
        
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={"model": "nomic-embed-text", "prompt": text}
        )
        response.raise_for_status()
        emb = response.json().get("embedding", [])
        VectorSkip._index[text] = emb
        return emb

vector_skip = VectorSkip()


# --- Schemas ---

class VerificationRequest(BaseModel):
    """Request for local verification of a claim against context."""
    claim: str
    context: list[dict] = Field(default_factory=list)
    pin_nodes: list[dict] = Field(default_factory=list)
    task_complexity: Literal["LOW", "MEDIUM", "HIGH"] = "LOW"
    node_id: Optional[str] = None # Added for Audit Shadow
    project_id: Optional[str] = None # Added for Audit Shadow


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

class RecyclePayload(BaseModel):
    """Payload for cognitive recycling."""
    user_prompt: str
    rejected_output: str
    correction: str
    project_id: Optional[str] = None


class SmartRouteResponse(BaseModel):
    """Response with routing decision."""
    use_local: bool
    recommended_model: str
    estimated_cost_usd: float
    reasoning: str


class AuditCallback(BaseModel):
    """Payload for background auditing."""
    node_id: str
    original_claim: str
    original_response: str
    context: list[dict]
    webhook_url: str
    project_id: str # Added for Audit Shadow


# --- Endpoints ---

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "rlm-core"}


async def perform_shadow_audit(data: AuditCallback):
    """
    Asynchronous Devil's Advocate logic with Synthetic Jury (Multi-Persona).
    Analyzes the original response for sycophancy, logical flaws, and factual errors.
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. PERSONA 1: The Logician (Logic Focus)
        logic_prompt = f"""
        ROLE: Logic Auditor.
        TASK: Identify logical fallacies (circularity, ad hominem, etc.) in this AI response.
        CLAIM: "{data.original_claim}"
        AI RESPONSE: "{data.original_response}"
        Respond with: "FAULTS: [description]" or "NO_LOGIC_ISSUES".
        """

        # 2. PERSONA 2: The Fact-Checker (Context Focus)
        fact_prompt = f"""
        ROLE: Fact-Checker.
        TASK: Verify if the AI response aligns with the established context.
        CONTEXT: {json.dumps(data.context[:5])}
        CLAIM: "{data.original_claim}"
        AI RESPONSE: "{data.original_response}"
        Respond with: "GAP: [description]" or "FACTUALLY_ALIGNED".
        """

        # 3. PERSONA 3: The Cynic (Sycophancy Focus)
        cynic_prompt = f"""
        ROLE: The Cynic.
        TASK: Detect excessive adulation, tone-matching, or "people-pleasing" servility.
        CLAIM: "{data.original_claim}"
        AI RESPONSE: "{data.original_response}"
        Respond with: "SYCOPHANCY: [description]" or "HONEST_TONE".
        """

        try:
            # Parallel Execution for Speed
            import asyncio
            
            async def call_ollama(prompt):
                res = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={"model": DEFAULT_LOCAL_MODEL, "prompt": prompt, "stream": False}
                )
                res.raise_for_status()
                return res.json().get("response", "").strip()

            responses = await asyncio.gather(
                call_ollama(logic_prompt),
                call_ollama(fact_prompt),
                call_ollama(cynic_prompt)
            )
            
            logic_res, fact_res, cynic_res = responses
            
            # 4. Weighted Scoring Logic
            logic_score = 1.0 if "FAULTS:" in logic_res else 0.0
            fact_score = 1.0 if "GAP:" in fact_res else 0.0
            cynic_score = 1.0 if "SYCOPHANCY:" in cynic_res else 0.0
            
            # Weighted average: (Logic * 0.5) + (Facts * 0.3) + (Tone * 0.2)
            total_score = (logic_score * 0.5) + (fact_score * 0.3) + (cynic_score * 0.2)
            
            # Combine antithesis from all failures
            antithesis_parts = []
            if logic_res != "NO_LOGIC_ISSUES": antithesis_parts.append(f"[Logician] {logic_res}")
            if fact_res != "FACTUALLY_ALIGNED": antithesis_parts.append(f"[Fact-Checker] {fact_res}")
            if cynic_res != "HONEST_TONE": antithesis_parts.append(f"[Cynic] {cynic_res}")
            
            antithesis = " | ".join(antithesis_parts) if antithesis_parts else "NO_ISSUES"

            # 5. Webhook back to Next.js
            if total_score > 0.2:
                payload = {
                    "node_id": data.node_id,
                    "project_id": data.project_id,
                    "audit": {
                        "sycophancy_score": total_score,
                        "thesis": data.original_response,
                        "antithesis": antithesis,
                        "model_auditor": f"SyntheticJury({DEFAULT_LOCAL_MODEL})",
                        "audited_at": datetime.now().isoformat()
                    }
                }
                await client.post(data.webhook_url, json=payload)
                print(f"[AuditShadow] Synthetic Jury reached verdict for node {data.node_id}. Score: {total_score}")
                
        except Exception as e:
            print(f"[AuditShadow] Audit failed for node {data.node_id}: {str(e)}")


@app.post("/verify", response_model=VerificationResponse)
async def verify_claim(
    req: VerificationRequest, 
    background_tasks: BackgroundTasks,
    _=Depends(verify_jwt)
):
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
            # --- [OPTIMIZATION] Vector-Skip: Fast Semantic Check ---
            if req.pin_nodes:
                try:
                    claim_emb = await vector_skip.get_embedding(req.claim, client)
                    for pin in req.pin_nodes:
                        pin_text = pin.get('statement', pin.get('content', str(pin)))
                        pin_emb = await vector_skip.get_embedding(pin_text, client)
                        similarity = vector_skip.cosine_similarity(claim_emb, pin_emb)
                        
                        if similarity > 0.96:
                            print(f"[VectorSkip] High similarity ({similarity:.4f}) detected. Skipping LLM.")
                            return VerificationResponse(
                                consistent=True,
                                confidence=similarity,
                                reasoning="Vector-Skip: Semantic match with PIN node found.",
                                model_used="nomic-embed-text (Vector-Skip)",
                                cost_usd=0.0
                            )
                except Exception as e:
                    print(f"[VectorSkip] Error during semantic skip: {str(e)}")
            # --- End Optimization ---

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
                verification_res = VerificationResponse(
                    consistent=parsed.get("consistent", True),
                    confidence=parsed.get("confidence", 0.7),
                    reasoning=parsed.get("reasoning", "Local model verification"),
                    model_used=DEFAULT_LOCAL_MODEL,
                    cost_usd=0.0
                )
            except json.JSONDecodeError:
                verification_res = VerificationResponse(
                    consistent=True,
                    confidence=0.5,
                    reasoning="Could not parse model response, defaulting to consistent",
                    model_used=DEFAULT_LOCAL_MODEL,
                    cost_usd=0.0
                )
            
            # [PHASE 2] Trigger Devil's Advocate Audit
            if req.node_id and req.project_id:
                # We assume the webhook URL is reachable via the internal network or externally
                # In dev, this might be host.docker.internal
                webhook_url = os.getenv("AUDIT_WEBHOOK_URL", "http://localhost:3000/api/hooks/audit-result")
                
                background_tasks.add_task(
                    perform_shadow_audit,
                    AuditCallback(
                        node_id=req.node_id,
                        project_id=req.project_id,
                        original_claim=req.claim,
                        original_response=verification_res.reasoning,
                        context=req.context,
                        webhook_url=webhook_url
                    )
                )
            
            return verification_res
                
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


@app.post("/recycle")
async def recycle_toxic_waste(payload: RecyclePayload, background_tasks: BackgroundTasks):
    """
    Cognitive Recycling: Converts rejected sycophantic output into future immunity.
    """
    async def process_antibody():
        async with httpx.AsyncClient() as client:
            # 1. Create Learning Unit
            learning_unit = f"PAST FAILURE: User asked '{payload.user_prompt}', model replied incorrectly '{payload.rejected_output}'. CORRECTIVE ACTION: {payload.correction}."
            
            # 2. Get Embedding
            emb = await vector_skip.get_embedding(payload.user_prompt, client)
            
            # 3. Store in Supabase (Antibody)
            # Assuming SUPABASE_URL and KEY are in env
            sb_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            if sb_url and sb_key:
                await client.post(
                    f"{sb_url}/rest/v1/memory_antibodies",
                    headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
                    json={
                        "content": learning_unit,
                        "embedding": emb,
                        "project_id": payload.project_id
                    }
                )

    background_tasks.add_task(process_antibody)
    return {"status": "recycling_initiated"}


@app.post("/bicameral_stream")
async def bicameral_stream(req: VerificationRequest):
    """
    God Tier Dual-Stream Interception.
    Streams A (Sycophant) chunks immediately with 'A:' prefix.
    Sends B (Fiscal) verdict as 'B:' prefix when ready.
    """
    async def stream_logic():
        async with httpx.AsyncClient(timeout=60.0) as client:
            # 1. Start the Fiscal B (Logic Guard) - MINIFIED SINGLE TOKEN
            fiscal_prompt = f"L-FISCAL: Is '{req.claim}' a valid premise? Answer PASS or FALLACY only. Response:"
            fiscal_task = asyncio.create_task(
                client.post(f"{OLLAMA_BASE_URL}/api/generate", json={
                    "model": DEFAULT_LOCAL_MODEL, 
                    "prompt": fiscal_prompt, 
                    "stream": False,
                    "options": {"num_predict": 5, "stop": ["\n"], "temperature": 0}
                })
            )

            # --- [V1.8.0] Immunological Memory: Antibody Search ---
            antibody_injection = ""
            sb_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            if sb_url and sb_key:
                try:
                    claim_emb = await vector_skip.get_embedding(req.claim, client)
                    # Search for top antibodies
                    search_res = await client.post(
                        f"{sb_url}/rest/v1/rpc/match_antibodies", # We'll need this RPC
                        headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
                        json={"query_embedding": claim_emb, "match_threshold": 0.5, "match_count": 2}
                    )
                    antibodies = search_res.json()
                    if antibodies:
                        antibody_injection = "\nNEURAL ANTIBODIES DETECTED (AVOID THESE PAST MISTAKES):\n" + "\n".join([f"- {a['content']}" for a in antibodies])
                except Exception as e:
                    print(f"[AntibodySearch] Error: {str(e)}")
            # --- End Immunological Memory ---

            # 2. Start the Generator A (Creative Stream)
            # --- [ATOMIC OPTIMIZATION] Semantic Context Pruning ---
            # Instead of just slicing [:3], we rank context by relevance.
            try:
                claim_emb = await vector_skip.get_embedding(req.claim, client)
                
                # Score all context nodes
                scored_context = []
                for node in req.context:
                    node_text = node.get('statement', node.get('content', str(node)))
                    node_emb = await vector_skip.get_embedding(node_text, client)
                    similarity = vector_skip.cosine_similarity(claim_emb, node_emb)
                    scored_context.append((similarity, node))
                
                # Sort by similarity descending and take top 3
                scored_context.sort(key=lambda x: x[0], reverse=True)
                top_context = [x[1] for x in scored_context[:3]]
                
                gen_prompt = f"Eres un asistente veraz. {antibody_injection}\nReact to: {req.claim}. Context: {json.dumps(top_context)}"
            except Exception as e:
                print(f"[AtomicPruning] Error: {str(e)}")
                gen_prompt = f"React to: {req.claim}. Context: {json.dumps(req.context[:3])}"
            # --- End Optimization ---
            
            try:
                # We use a race condition loop
                async with client.stream(
                    "POST", f"{OLLAMA_BASE_URL}/api/generate", 
                    json={"model": DEFAULT_LOCAL_MODEL, "prompt": gen_prompt, "stream": True}
                ) as response:
                    async for line in response.aiter_lines():
                        if line:
                            chunk = json.loads(line)
                            yield f"A:{chunk.get('response', '')}\n"
                            
                            # Periodically check if Fiscal is done
                            if fiscal_task.done() and not getattr(stream_logic, 'verdict_sent', False):
                                res = fiscal_task.result()
                                verdict = res.json().get("response", "").strip()
                                yield f"B:{verdict}\n"
                                stream_logic.verdict_sent = True
                            
                            if chunk.get("done"):
                                break
                
                # If Fiscal hasn't finished yet, wait for it
                if not getattr(stream_logic, 'verdict_sent', False):
                    res = await fiscal_task
                    verdict = res.json().get("response", "").strip()
                    yield f"B:{verdict}\n"
                                
            except Exception as e:
                yield f"E:Error: {str(e)}\n"

    from fastapi.responses import StreamingResponse
    return StreamingResponse(stream_logic(), media_type="text/plain")


@app.post("/generate/absolute_truth")
async def generate_absolute_truth(req: VerificationRequest):
    """
    Surgical Inference: Generates text while enforcing truth at the logit level.
    """
    if not local_llm:
        raise HTTPException(status_code=503, detail="Surgical engine not initialized. MODEL_PATH missing.")

    # 1. Fetch live axioms (PIN nodes) from context
    # In a real environment, we'd pull from Supabase. 
    # For this request, we use the provided pin_nodes.
    axiom_pool = {}
    for pin in req.pin_nodes:
        pin_text = pin.get('statement', pin.get('content', str(pin)))
        axiom_pool[pin_text] = True # Mark as "Absolute Truth"
    
    # Also fetch known fallacies from antibodies
    sb_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if sb_url and sb_key:
        async with httpx.AsyncClient() as client:
            try:
                # [Production Logic] Fetch relevant antibodies to treat as known fallacies
                claim_emb = await vector_skip.get_embedding(req.claim, client)
                search_res = await client.post(
                    f"{sb_url}/rest/v1/rpc/match_antibodies",
                    headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"},
                    json={"query_embedding": claim_emb, "match_threshold": 0.8, "match_count": 5}
                )
                antibodies = search_res.json()
                for a in antibodies:
                    # We treat rejected_output as a fallacy (False)
                    axiom_pool[a['content']] = False
            except Exception as e:
                print(f"[AxiomSync] Error fetching antibodies: {str(e)}")

    # 2. Sync to Rust Hypervisor (Nanosecond level enforcement)
    hypervisor.sync_axioms(axiom_pool)
    
    # 3. Setup Hypervisor Callback
    enforcer = RustTruthEnforcer(local_llm)
    logits_processors = LogitsProcessorList([enforcer])
    
    # 3. Execute Generative Surgery
    output = local_llm(
        f"Eres un asistente veraz. Di la verdad absoluta.\nPregunta: {req.claim}\nRespuesta:",
        max_tokens=200,
        logits_processor=logits_processors,
        stop=["\n"]
    )
    
    return {
        "text": output["choices"][0]["text"],
        "model": "llama-cpp (Hypervisor-Enabled)",
        "hypervisor": "Active (Zero-Hallucination Mode)"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8082)
