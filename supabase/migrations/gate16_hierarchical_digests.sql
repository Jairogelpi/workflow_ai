-- Gate 16: Hierarchical Digests & Enhanced Job Queue
-- "Fractal Intelligence Tier"

-- 1. Expand Job Types
-- Since we can't easily add values to existing ENUMs in some environments without DO blocks, 
-- we ensure it's handled safely. In production environments, we'd use ALTER TYPE.
-- For this mission, we'll ensure the ingestion_jobs table can handle the 'type' column.

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_type') THEN
        CREATE TYPE job_type AS ENUM ('file_ingestion', 'digest_branch', 'neural_ripple');
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Enhance ingestion_jobs table
ALTER TABLE ingestion_jobs ADD COLUMN IF NOT EXISTS type job_type DEFAULT 'file_ingestion';
ALTER TABLE ingestion_jobs ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;

-- 3. Create node_digests table for "Crystallized Intelligence"
CREATE TABLE IF NOT EXISTS node_digests (
    node_id UUID PRIMARY KEY REFERENCES work_nodes(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    key_insights TEXT[] DEFAULT '{}',
    action_items TEXT[] DEFAULT '{}',
    conflicts_detected JSONB DEFAULT '[]'::jsonb,
    
    -- Analysis Metadata
    model_used TEXT,
    token_usage INTEGER,
    
    -- Staleness Control
    children_hash TEXT, -- Hash of child nodes at time of summary
    is_stale BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for staleness checks and retrieval
CREATE INDEX IF NOT EXISTS idx_node_digests_stale ON node_digests(node_id) WHERE is_stale = true;

-- RLS
ALTER TABLE node_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view digests for their projects" 
ON node_digests FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM work_nodes 
    JOIN projects ON work_nodes.project_id = projects.id
    WHERE work_nodes.id = node_digests.node_id
    AND (
      projects.owner_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
    )
  )
);
