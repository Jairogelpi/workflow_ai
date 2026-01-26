-- ==============================================================================
-- GATE 11: FIX RLS FOR COLLABORATION
-- Ensures members of a project have same access as owners
-- ==============================================================================

-- 1. Update work_nodes policies
DROP POLICY IF EXISTS "Users can access nodes of own projects" ON work_nodes;
CREATE POLICY "Users and members can access nodes" ON work_nodes
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.id = work_nodes.project_id 
        AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
);

-- 2. Update work_edges policies
DROP POLICY IF EXISTS "Users can access edges of own projects" ON work_edges;
CREATE POLICY "Users and members can access edges" ON work_edges
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.id = work_edges.project_id 
        AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
);

-- 3. Update projects policies to ensure full access for members (not just SELECT)
DROP POLICY IF EXISTS "Members can view projects" ON projects;
CREATE POLICY "Owners and members can access projects" ON projects
FOR ALL USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid())
);

-- 4. Secure node_embeddings RPC (as seen in gate8_auth_rls.sql)
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
  similarity float,
  owner_id uuid
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
    1 - (ne.embedding <=> query_embedding) AS similarity,
    p.owner_id
  FROM node_embeddings ne
  JOIN work_nodes wn ON ne.node_id = wn.id
  JOIN projects p ON wn.project_id = p.id
  LEFT JOIN project_members pm ON p.id = pm.project_id
  WHERE wn.project_id = target_project_id
    AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid()) -- FIXED: Check members too
    AND 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
