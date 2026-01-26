-- Gate 12: Token Economy & Cost Tracking

-- 1. Ledger for tracking real AI usage & costs
CREATE TABLE IF NOT EXISTS token_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    operation TEXT NOT NULL, -- e.g. 'digest_generation', 'vector_search', 'chat_response'
    model TEXT NOT NULL,     -- e.g. 'gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet'
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    cost_usd NUMERIC(10, 6) DEFAULT 0,     -- Real cost incurred
    savings_usd NUMERIC(10, 6) DEFAULT 0,  -- Calculated savings vs. Reference Model (GPT-4o)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Indexes for Analytics
CREATE INDEX idx_ledger_project ON token_ledger(project_id);
CREATE INDEX idx_ledger_created_at ON token_ledger(created_at);

-- 3. RLS Policies
ALTER TABLE token_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert ledger entries for their projects" ON token_ledger
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view ledger for their projects" ON token_ledger
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );
