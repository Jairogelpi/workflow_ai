-- ==============================================================================
-- GATE 9: RLS STRENGTHENING (Collaboration & RBAC)
-- ==============================================================================

-- 1. Enable RLS on membership table
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- 2. Project Members Policy
DROP POLICY IF EXISTS "Users can view members of their projects" ON project_members;
CREATE POLICY "Users can view members of their projects" ON project_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projects p 
        WHERE p.id = project_id 
        AND (p.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid()))
    )
);

-- 3. Update Work Nodes Policy (Shift from owner_id only to project membership)
DROP POLICY IF EXISTS "Users can see nodes of default or own projects" ON work_nodes;
CREATE POLICY "Users can view project nodes" ON work_nodes
FOR SELECT USING (
    project_id = '00000000-0000-0000-0000-000000000000' OR 
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM project_members WHERE project_id = id AND user_id = auth.uid())))
);

DROP POLICY IF EXISTS "Users can modify nodes of default or own projects" ON work_nodes;
CREATE POLICY "Members can modify project nodes" ON work_nodes
FOR ALL USING (
    project_id = '00000000-0000-0000-0000-000000000000' OR 
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = work_nodes.project_id 
        AND user_id = auth.uid() 
        AND role IN ('editor', 'maintainer', 'owner')
    ) OR EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);

-- 4. Update Work Edges Policy
DROP POLICY IF EXISTS "Users can see edges of default or own projects" ON work_edges;
CREATE POLICY "Users can view project edges" ON work_edges
FOR SELECT USING (
    project_id = '00000000-0000-0000-0000-000000000000' OR 
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM project_members WHERE project_id = id AND user_id = auth.uid())))
);

CREATE POLICY "Members can modify project edges" ON work_edges
FOR ALL USING (
    project_id = '00000000-0000-0000-0000-000000000000' OR 
    EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = work_edges.project_id 
        AND user_id = auth.uid() 
        AND role IN ('editor', 'maintainer', 'owner')
    ) OR EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);
