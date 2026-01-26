-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your documents/nodes embeddings
create table if not exists node_embeddings (
  id uuid primary key references work_nodes(id) on delete cascade,
  project_id uuid not null, -- references projects(id)
  content text, -- Optional: cache of what was embedded
  embedding vector(768), -- Local nomic-embed-text dimension (Unified Standard)
  checksum text, -- To avoid re-embedding if content hasn't changed
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a search function directly in Postgres for speed
create or replace function match_nodes (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_project_id uuid
)
returns table (
  id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    node_embeddings.id,
    node_embeddings.content,
    1 - (node_embeddings.embedding <=> query_embedding) as similarity
  from node_embeddings
  where 1 - (node_embeddings.embedding <=> query_embedding) > match_threshold
  and node_embeddings.project_id = filter_project_id
  order by node_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create an HNSW index for ultra-fast approximate nearest neighbor search
-- (Essential for performance as graph grows > 1000 nodes)
create index on node_embeddings using hnsw (embedding vector_cosine_ops);
