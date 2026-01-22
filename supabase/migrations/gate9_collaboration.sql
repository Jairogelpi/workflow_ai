-- ==============================================================================
-- GATE 9: SISTEMA DE COLABORACIÓN Y GOBERNANZA (WorkGraph OS Team Protocol)
-- DEFINITIVE 2026 EDITION: AI-MEDIATED CONSENSUS
-- ==============================================================================

-- 1. ENUMS (Tipos estrictos para lógica de negocio)
DO $$ BEGIN
    CREATE TYPE project_role AS ENUM ('viewer', 'editor', 'maintainer', 'owner');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE cr_status AS ENUM ('open', 'reviewing', 'approved', 'rejected', 'merged', 'closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('mention', 'cr_created', 'cr_approved', 'conflict_detected', 'ai_suggestion');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 2. MEMBRESÍA DE EQUIPOS (RBAC)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role project_role NOT NULL DEFAULT 'viewer',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ,
    PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_user ON project_members(user_id);

-- ==============================================================================
-- 3. CHANGE REQUESTS (El Corazón de la Colaboración Asíncrona)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    source_branch_id UUID, -- No FK to branches yet as it might be a sub-project or abstract ref
    target_branch_id UUID, 
    
    author_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    status cr_status DEFAULT 'open',
    
    -- CEREBRO DE LA IA
    semantic_check_passed BOOLEAN DEFAULT FALSE, 
    analysis_report JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    merged_at TIMESTAMPTZ
);

-- ==============================================================================
-- 4. DISCUSIÓN CONTEXTUAL
-- ==============================================================================

CREATE TABLE IF NOT EXISTS change_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    node_id UUID REFERENCES work_nodes(id),
    selection_range JSONB, 
    
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ==============================================================================
-- 5. NOTIFICACIONES ASÍNCRONAS (La Bandeja de Entrada)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. SEGURIDAD (RLS 2.0)
-- ==============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Projects Policy: Owner or Member
DROP POLICY IF EXISTS "Members can view projects" ON projects;
CREATE POLICY "Members can view projects" ON projects
FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM project_members WHERE project_id = id AND user_id = auth.uid())
);

-- CR Policy
DROP POLICY IF EXISTS "Members can view CRs" ON change_requests;
CREATE POLICY "Members can view CRs" ON change_requests
FOR SELECT USING (
    EXISTS (SELECT 1 FROM project_members WHERE project_id = change_requests.project_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Members can create CRs" ON change_requests;
CREATE POLICY "Members can create CRs" ON change_requests
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM project_members WHERE project_id = change_requests.project_id AND user_id = auth.uid())
);

-- Notifications Policy
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications" ON notifications
FOR ALL USING (auth.uid() = user_id);
