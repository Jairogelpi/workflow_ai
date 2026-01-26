# Graph-RAG Architecture (v2.0 - Real Memory)

> **Status**: Production (Phase 2 Complete)
> **Engine**: PostgreSQL (`pgvector`) + OpenAI (`text-embedding-3-large`)

## 1. Core Philosophy: "The Physical Brain"
Unlike traditional RAG (which chunks text blindly), WorkGraph OS implements **Graph-RAG**. This means we embed *nodes* (concepts), not just *text*. The retrieval verifies structural relationships (Edges) alongside semantic similarity.

## 2. The Vector Pipeline

### A. Automatic Ingestion (`SyncService`)
Every time a `WorkNode` is created or updated:
1. **Trigger**: `SyncService.upsertNode` (Client Side / Server Action).
2. **Contextualization**: The system constructs a "Rich Context String":
   ```typescript
   `[${node.type}] ${node.title} - ${node.content}`
   ```
3. **Embedding**: Calls OpenAI `text-embedding-3-large` (3072 dimensions).
4. **Storage**: Upserts into `node_embeddings` table in Supabase.

### B. The Storage Layer (`pgvector`)
We use a dedicated table separate from the main graph for high-performance vector search.

```sql
create table node_embeddings (
  id uuid primary key references work_nodes(id),
  embedding vector(3072),
  content text, -- Cached text for rapid retrieval transparency
  ...
);
create index on node_embeddings using hnsw (embedding vector_cosine_ops);
```

## 3. The Retrieval Engine (`Hybrid Retriever`)

Located in `src/compiler/retriever.ts`. It performs a two-stage "Neuro-Symbolic" search:

1. **Semantic Stage (The "Gut Check")**:
   - Generates query embedding.
   - Calls `match_nodes` RPC function.
   - Returns top K matches based on Cosine Similarity.
   - *Filters*: Users can restrict by `project_id`.

2. **Topology Stage (The "Logic Check")** (Pending Phase 3 Enhancement):
   - Will expand "Semantic Hits" to include their neighbors (Contextual Expansion).
   - *Current Status*: Pure Vector + Metadata Filtering.

## 4. Usage in Agents
The `SwarmOrchestrator` and `MediatorAgent` uses this memory to:
- **Ground Truth**: Validate synthetic thoughts against stored facts.
- **Context Injection**: The `ProductEngine` injects retrieved nodes into the PRD prompt.
- **Deduplication**: Checks if a "New Idea" already exists semantically.
