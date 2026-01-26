-- ==============================================================================
-- GATE 19 (V8 - THE EXORCISM): DYNAMIC WIPE + SHADOW INDEX
-- ==============================================================================

-- 1. EMERGENCY STOP: Disable RLS on all tables immediately
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE work_edges DISABLE ROW LEVEL SECURITY;
ALTER TABLE node_embeddings DISABLE ROW LEVEL SECURITY;

-- 2. DYNAMIC POLICY WIPE (The "Exorcism")
-- Iterates through system catalog to find and destroy ALL policies on these tables.
-- This bypasses the "policy already exists" errors caused by name mismatches.
DO $$ 
DECLARE 
  pol RECORD; 
BEGIN 
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('projects', 'project_members', 'work_nodes', 'work_edges', 'node_embeddings') 
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename); 
  END LOOP; 
END $$;

-- 3. NUKE FUNCTIONS
DROP FUNCTION IF EXISTS is_project_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_project_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_my_project_ids() CASCADE;

-- 4. CREATE SHADOW INDEX (The Physics Fix)
-- A table with NO RLS that mirrors membership, used solely for permission checks.
CREATE TABLE IF NOT EXISTS project_members_index (
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role text DEFAULT 'viewer',
    PRIMARY KEY (project_id, user_id)
);

ALTER TABLE project_members_index DISABLE ROW LEVEL SECURITY; -- Critical

-- Sync Data
TRUNCATE TABLE project_members_index;
INSERT INTO project_members_index (project_id, user_id, role)
SELECT project_id, user_id, role FROM project_members;

-- Sync Triggers
CREATE OR REPLACE FUNCTION sync_members_index() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO project_members_index (project_id, user_id, role)
        VALUES (NEW.project_id, NEW.user_id, NEW.role)
        ON CONFLICT DO NOTHING;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM project_members_index
        WHERE project_id = OLD.project_id AND user_id = OLD.user_id;
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE project_members_index
        SET role = NEW.role
        WHERE project_id = NEW.project_id AND user_id = NEW.user_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_members_index ON project_members;
CREATE TRIGGER trg_sync_members_index
AFTER INSERT OR UPDATE OR DELETE ON project_members
FOR EACH ROW EXECUTE FUNCTION sync_members_index();

-- 5. CREATE SAFE FUNCTIONS (Reading from Shadow Index)
CREATE OR REPLACE FUNCTION is_project_owner(_id UUID) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  -- Reads from projects directly (owner_id check usually safe, but let's be atomic)
  RETURN EXISTS (SELECT 1 FROM projects WHERE id=_id AND owner_id=auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION is_project_member(_id UUID) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  -- Reads from SHADOW table (No RLS = No Recursion)
  RETURN EXISTS (SELECT 1 FROM project_members_index WHERE project_id=_id AND user_id=auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION get_my_project_ids() RETURNS TABLE (project_id UUID) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  -- Reads from SHADOW table
  RETURN QUERY SELECT idx.project_id FROM project_members_index idx WHERE idx.user_id=auth.uid();
END;
$$;

-- 6. RE-ENABLE RLS AND APPLY FRESH POLICIES
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_embeddings ENABLE ROW LEVEL SECURITY;

-- Projects
CREATE POLICY "Users can view projects they belong to" ON projects FOR SELECT 
USING (owner_id = auth.uid() OR id IN (SELECT get_my_project_ids()));
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their projects" ON projects FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete their projects" ON projects FOR DELETE USING (owner_id = auth.uid());

-- Members
CREATE POLICY "Members can view other members" ON project_members FOR SELECT 
USING (user_id = auth.uid() OR is_project_member(project_id));
CREATE POLICY "Owners can manage members" ON project_members FOR ALL 
USING (is_project_owner(project_id));

-- Nodes
CREATE POLICY "Members can view nodes" ON work_nodes FOR SELECT 
USING (is_project_member(project_id) OR is_project_owner(project_id));
CREATE POLICY "Members can create nodes" ON work_nodes FOR INSERT 
WITH CHECK (is_project_member(project_id) OR is_project_owner(project_id));
CREATE POLICY "Members can update nodes" ON work_nodes FOR UPDATE 
USING (is_project_member(project_id) OR is_project_owner(project_id));
CREATE POLICY "Owners can delete nodes" ON work_nodes FOR DELETE 
USING (is_project_owner(project_id));

-- Edges
CREATE POLICY "Members can view edges" ON work_edges FOR SELECT 
USING (is_project_member(project_id) OR is_project_owner(project_id));
CREATE POLICY "Members can manage edges" ON work_edges FOR ALL 
USING (is_project_member(project_id) OR is_project_owner(project_id));

-- Vectors
CREATE POLICY "Members can search vectors" ON node_embeddings FOR SELECT 
USING (EXISTS (SELECT 1 FROM work_nodes WHERE id = node_id AND (is_project_member(project_id) OR is_project_owner(project_id))));
