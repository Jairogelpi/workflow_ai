-- Memory Antibodies: Immunological memory for AI failures
CREATE TABLE IF NOT EXISTS public.memory_antibodies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(768), -- Using nomic-embed-text dimensions (768)
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    failure_type TEXT DEFAULT 'sycophancy',
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.memory_antibodies ENABLE ROW LEVEL SECURITY;

-- Index for searching
CREATE INDEX IF NOT EXISTS memory_antibodies_embedding_idx ON public.memory_antibodies 
USING hnsw (embedding vector_cosine_ops);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION public.match_antibodies(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM memory_antibodies m
  WHERE 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
