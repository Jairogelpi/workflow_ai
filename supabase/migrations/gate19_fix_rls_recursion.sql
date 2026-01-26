-- ==============================================================================
-- GATE 19: SYSTEM STABILITY FIX (Broken RLS Recursion)
-- ==============================================================================

-- Problem: The policy "Members can view other members" queried 'project_members' directly,
-- causing an infinite loop when the RLS engine tried to validate membership.

-- Solution: Use the pre-defined SECURITY DEFINER function 'is_project_member()' 
-- which bypasses RLS for the lookup, breaking the cycle.

DROP POLICY IF EXISTS "Members can view other members" ON project_members;

CREATE POLICY "Members can view other members" 
ON project_members FOR SELECT 
USING (
  user_id = auth.uid() OR -- I can see myself
  
  -- Use SECURITY DEFINER function to check providing safe access to peers
  is_project_member(project_id) OR 
  
  -- Owners can see everyone
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);
