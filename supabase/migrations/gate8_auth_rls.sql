-- Gate 8: Personal Cloud & Identity Auth Security

-- 1. Enable RLS on all core tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_edges ENABLE ROW LEVEL SECURITY;

-- 2. Project Policies (Isolation by owner_id)
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create own projects" ON projects;
CREATE POLICY "Users can create own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = owner_id);

-- 3. Node Policies (Transitive isolation via project ownership)
-- Note: work_nodes.project_id references projects.id
DROP POLICY IF EXISTS "Users can access nodes of own projects" ON work_nodes;
CREATE POLICY "Users can access nodes of own projects" ON work_nodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = work_nodes.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

-- 4. Edge Policies
DROP POLICY IF EXISTS "Users can access edges of own projects" ON work_edges;
CREATE POLICY "Users can access edges of own projects" ON work_edges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = work_edges.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_nodes_project ON work_nodes(project_id);

-- 6. Secure Vector Search (RPC)
-- This function allows searching for nodes by embedding similarity,
-- but enforces project-level isolation via a join with work_nodes.
CREATE OR REPLACE FUNCTION match_node_embeddings (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  target_project_id uuid
)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  content jsonb,
  type text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wn.id,
    wn.project_id,
    wn.content,
    wn.type,
    1 - (ne.embedding <=> query_embedding) AS similarity
  FROM node_embeddings ne
  JOIN work_nodes wn ON ne.node_id = wn.id
  WHERE wn.project_id = target_project_id
    AND 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

