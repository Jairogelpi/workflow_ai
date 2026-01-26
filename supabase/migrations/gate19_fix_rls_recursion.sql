-- ==============================================================================
-- GATE 19 (V2): SYSTEM STABILITY FIX (Broken RLS Recursion)
-- ==============================================================================

-- 1. Redefine the Helper Function with SECURITY DEFINER (Critical to break recursion)
-- This runs with the privileges of the creator (postgres/admin), bypassing the table's RLS.
CREATE OR REPLACE FUNCTION is_project_member(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Security Best Practice
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = _project_id
    AND user_id = auth.uid()
  );
END;
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Members can view other members" ON project_members;

-- 3. Recreate it using the secure function
CREATE POLICY "Members can view other members" 
ON project_members FOR SELECT 
USING (
  user_id = auth.uid() OR -- I can see myself
  
  -- Use SECURITY DEFINER function to check providing safe access to peers
  is_project_member(project_id) OR 
  
  -- Owners can see everyone
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
);
