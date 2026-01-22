-- ==============================================================================
-- GATE 10: FORENSIC TRANSPARENCY & MEDIATOR ENHANCEMENTS
-- 2026 EDITION: SINCERITY & AUTHORITY
-- ==============================================================================

-- 1. Ampliar ENUM node_origin para GHOST NODES (Drafts de la IA)
DO $$ 
BEGIN
    ALTER TYPE node_origin ADD VALUE 'ai_proposal';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Mejorar COMPILATION_RECEIPTS para trazabilidad forense
ALTER TABLE compilation_receipts 
ADD COLUMN IF NOT EXISTS job_id UUID,
ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(10, 6);

CREATE INDEX IF NOT EXISTS idx_receipts_job_id ON compilation_receipts(job_id);

-- 3. Nueva tabla AUDIT_METRICS (El registro forense persistente)
CREATE TABLE IF NOT EXISTS audit_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    step_id TEXT NOT NULL,
    model TEXT NOT NULL,
    
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    cost_usd NUMERIC(10, 6) DEFAULT 0.0,
    
    operation_type TEXT, -- e.g., 'recursive_generation', 'vector_search', 'verdict'
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_job_id ON audit_metrics(job_id);

-- 4. Seguridad (RLS) para Auditoría
ALTER TABLE audit_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view audit metrics for their projects" ON audit_metrics;
CREATE POLICY "Users can view audit metrics for their projects" ON audit_metrics
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM projects 
        WHERE (id = '00000000-0000-0000-0000-000000000000' OR owner_id = auth.uid())
    )
);

-- 5. Comentario de integridad
COMMENT ON TABLE audit_metrics IS 'Registro forense inmutable de todas las operaciones de IA en el kernel RLM.';
