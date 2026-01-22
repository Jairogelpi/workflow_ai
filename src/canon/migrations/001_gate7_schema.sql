-- Solo creamos la tabla que falta: digests (Gate 7)
-- No tocamos nodes ni edges existentes (public.work_nodes, public.work_edges)

CREATE TABLE IF NOT EXISTS digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Scope: ¿Qué estamos resumiendo?
    entity_type TEXT NOT NULL CHECK (entity_type IN ('branch', 'project')),
    entity_id UUID NOT NULL, 
    
    -- Flavor: ¿Qué perspectiva? 
    -- 'standard': Resumen general de trabajo.
    -- 'canon': Solo PINs + Validated + Constraints (La verdad oficial).
    digest_flavor TEXT NOT NULL CHECK (digest_flavor IN ('standard', 'canon')),
    
    -- El Payload (Lo que lee el LLM)
    summary_text TEXT NOT NULL,
    
    -- Control de Staleness (Caducidad)
    -- Hash combinado de todos los nodos que compusieron este digest.
    -- Si el hash de la rama cambia, este digest se marca como stale.
    dependency_hash TEXT NOT NULL, 
    is_stale BOOLEAN DEFAULT FALSE,
    
    -- Observabilidad persistida (Opcional, pero útil para auditoría rápida)
    token_cost_input INTEGER,
    last_generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para asegurar 1 digest activo por tipo/entidad
CREATE INDEX IF NOT EXISTS idx_unique_active_digest 
ON digests (entity_type, entity_id, digest_flavor);
