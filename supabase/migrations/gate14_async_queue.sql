-- Gate 14: Async Ingestion Queue
-- "Reliability First"

CREATE TYPE ingestion_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    node_id UUID REFERENCES work_nodes(id) ON DELETE CASCADE,
    
    status ingestion_status DEFAULT 'pending',
    progress FLOAT DEFAULT 0.0,
    
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Index for the Worker to poll fast
CREATE INDEX idx_jobs_status ON ingestion_jobs(status, created_at) WHERE status = 'pending';

-- RLS
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project jobs" 
ON ingestion_jobs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = ingestion_jobs.project_id 
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = ingestion_jobs.project_id 
    AND owner_id = auth.uid()
  )
);

-- API needs insert permission (Service Role usually, but we allow members for now)
CREATE POLICY "Users can submit jobs" 
ON ingestion_jobs FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = ingestion_jobs.project_id 
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = ingestion_jobs.project_id 
    AND owner_id = auth.uid()
  )
);
