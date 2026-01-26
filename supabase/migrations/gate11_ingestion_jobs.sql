-- ==============================================================================
-- GATE 11: ASYNCHRONOUS INGESTION (Job Queue Pattern)
-- ==============================================================================

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    node_id UUID REFERENCES work_nodes(id) ON DELETE CASCADE,
    
    status job_status DEFAULT 'pending',
    progress FLOAT DEFAULT 0.0, -- 0.0 to 1.0
    
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for jobs
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs" ON ingestion_jobs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projects WHERE id = project_id 
        AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM project_members WHERE project_id = id AND user_id = auth.uid()))
    )
);

-- Index for polling
CREATE INDEX IF NOT EXISTS idx_jobs_status ON ingestion_jobs(status) WHERE status IN ('pending', 'processing');
