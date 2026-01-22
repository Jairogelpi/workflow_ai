import { z } from 'zod';
import { createClient } from '../lib/supabase';
import { traceSpan } from './observability';
import { WorkNode, WorkEdge } from '../canon/schema/ir';

// --- Configuration ---

const DIGEST_SYSTEM_PROMPT = `
ROLE:
You are the "Digest Compiler" for WorkGraph OS. Your job is to compress a complex graph of thoughts into a generic "Branch Digest" that serves as the Source of Truth.

INPUT DATA:
You will receive a JSON object with:
1. "nodes": A list of entities (Claims, Decisions, Evidence, etc.).
2. "structure": A list of edges defining logical dependencies.

STRICT COMPILATION RULES (The Gate 7 Protocol):

1. HIERARCHY OF TRUTH (Canon Compliance):
   - Nodes marked "PIN/INVARIANT" are absolute laws. The digest MUST explicitly state them first.
   - Nodes marked "VALIDATED" are settled decisions.
   - If a Claim/Decision contradicts a PIN, you MUST flag it as a "contradiction" warning immediately.

2. SYNTHESIS OVER LISTING (Cost Optimization):
   - Do NOT just list the nodes. Weave them into a coherent narrative.
   - Synthesize the logical flow: "Goal -> Plan -> Decision -> Evidence".

3. REFERENCE INTEGRITY (Traceability):
   - Every time you mention a specific concept, fact, or decision, you MUST append its ID in this exact format: [ref:UUID].
   - This enables "Raw-on-demand" drill-down.

4. AUDIT SYSTEM:
   - If a Validated Decision depends on Low Confidence Evidence (< 0.8), generate a "low_confidence" warning.
   - If a Claim has status 'pending' and no supporting evidence, generate a "staleness" warning.

OUTPUT FORMAT (JSON ONLY):
{
  "digest_text": "Markdown summary with [ref:UUID] links.",
  "key_invariants": ["List of PIN rules found"],
  "warnings": [
    { "code": "contradiction" | "staleness" | "low_confidence", "node_ids": ["uuid"], "message": "explanation" }
  ],
  "stats": { "node_count": number }
}
`;

// --- Interfaces ---

interface RetrievalContext {
    text: string;
    strategy: 'RAW' | 'DIGEST';
    sourceCount: number;
    warnings?: any[];
}

interface DigestResult {
    digest_text: string;
    key_invariants: string[];
    warnings: Array<{ code: string; node_ids: string[]; message: string }>;
    stats: { node_count: number };
}

// --- Public API ---

/**
 * Recovers context for a query, automatically prioritizing Digest (low cost) 
 * unless high precision is forced or the digest is stale.
 */
export async function retrieveContext(
    query: string,
    branchId: string,
    forceHighPrecision: boolean = false
): Promise<RetrievalContext> {
    return traceSpan('retrieve_context', { query_length: query.length, branchId }, async () => {
        const supabase = await createClient();

        // 1. Try to fetch a valid Standard Digest
        const { data: digest } = await supabase
            .from('digests')
            .select('*')
            .eq('entity_id', branchId)
            .eq('entity_type', 'branch')
            .eq('digest_flavor', 'standard')
            .eq('is_stale', false)
            .maybeSingle();

        // LOGIC: Use Digest if available AND not forced AND query is general
        const isGeneralQuery = query.length < 60 || /resumen|estado|summary|status/i.test(query);

        if (digest && (isGeneralQuery && !forceHighPrecision)) {
            return {
                text: digest.summary_text,
                strategy: 'DIGEST',
                sourceCount: 1,
                warnings: digest.warnings // Include cached warnings for UI
            };
        }

        // MISS: Fetch Raw Nodes (Costly fallback)
        const { data: nodesRaw } = await supabase
            .from('work_nodes')
            .select('*')
            .eq('project_id', branchId)
            .eq('is_validated', true)
            .limit(50); // Hard limit to prevent context overflow

        // Basic Raw Serialization
        const rawText = (nodesRaw || []).map(n => {
            const content = (n.content as any).statement || (n.content as any).rationale || JSON.stringify(n.content);
            return `- [${n.type.toUpperCase()}] ${content} (${n.id})`;
        }).join('\n');

        return {
            text: rawText,
            strategy: 'RAW',
            sourceCount: nodesRaw?.length || 0
        };
    });
}

/**
 * THE WORKER FUNCTION: 
 * Compiles the graph into a digest using the LLM.
 * This should be called by your Queue Worker (BullMQ) or Cron.
 */
export async function regenerateBranchDigest(branchId: string): Promise<void> {
    return traceSpan('generate_digest', { branchId }, async () => {
        const supabase = await createClient();

        // 1. Fetch the full graph for this branch
        const { data: nodesRaw } = await supabase.from('work_nodes').select('*').eq('project_id', branchId);
        const { data: edgesRaw } = await supabase.from('work_edges').select('*').eq('project_id', branchId);

        if (!nodesRaw || nodesRaw.length === 0) return;

        // HYDRATION: Map Raw DB Rows to Domain WorkNodes
        // This is crucial because DB stores content in JSONB but WorkNode expects flattened properties
        const nodes = nodesRaw.map((row: any) => ({
            id: row.id,
            type: row.type,
            metadata: {
                pin: row.is_pinned,
                validated: row.is_validated,
                confidence: row.confidence,
                // Add defaults for strict IR compliance
                created_at: row.created_at,
                updated_at: row.updated_at,
                version_hash: row.current_version_hash || '0000',
                origin: row.origin || 'human'
            },
            ...row.content // Spread the content (statement, rationale, etc.) to root
        })) as unknown as WorkNode[];

        const edges = (edgesRaw || []).map((row: any) => ({
            id: row.id,
            source: row.source_node_id,
            target: row.target_node_id,
            relation: row.relation,
            metadata: row.metadata
        })) as unknown as WorkEdge[];

        // 2. Serialize for the LLM (Token Optimization)
        const payload = serializeBranchForLLM(nodes, edges);

        // Observability: Track input size
        console.log(`[DigestEngine] Compiling ${nodes.length} nodes for branch ${branchId}`);

        // 3. Call LLM (Stub for now)
        // const result = await ai.generateJSON({ model: 'gpt-4o', system: DIGEST_SYSTEM_PROMPT, input: payload });

        const mockResult: DigestResult = {
            digest_text: `**System Digest (Simulated)**: The branch contains ${nodes.length} nodes. Logic appears consistent. [ref:${nodes[0]?.id || 'unknown'}]`,
            key_invariants: [],
            warnings: [],
            stats: { node_count: nodes.length }
        };
        const result = mockResult;

        // 4. Upsert Digest
        const { error } = await supabase.from('digests').upsert({
            entity_id: branchId,
            entity_type: 'branch',
            digest_flavor: 'standard',
            summary_text: result.digest_text,
            warnings: result.warnings,
            is_stale: false, // Reset staleness
            last_generated_at: new Date().toISOString(),
            // Metrics
            token_cost_input: Math.ceil(payload.length / 4)
        }, { onConflict: 'entity_type, entity_id, digest_flavor' });

        if (error) throw error;
    });
}

/**
 * Mark as stale logic (Triggered by DB hooks or API mutations)
 */
export async function markStale(branchId: string): Promise<void> {
    const supabase = await createClient();
    await supabase
        .from('digests')
        .update({ is_stale: true })
        .eq('entity_id', branchId)
        .eq('entity_type', 'branch');
}

// --- Private Helpers (The Serializer) ---

export function serializeBranchForLLM(nodes: WorkNode[], edges: WorkEdge[]) {
    const serializedNodes = nodes.map(node => {
        let coreText = "";

        // Polymorphic Content Extraction (Matches ir.ts schema)
        switch (node.type) {
            case 'claim':
                coreText = `STATEMENT: ${node.statement} (Status: ${node.verification_status})`;
                break;
            case 'decision':
                coreText = `CHOSEN: ${node.chosen_option}. RATIONALE: ${node.rationale}`;
                if (node.alternatives?.length) coreText += ` [Alternatives: ${node.alternatives.join(', ')}]`;
                break;
            case 'constraint':
                coreText = `RULE: ${node.rule} (${node.enforcement_level})`;
                break;
            case 'assumption':
                coreText = `PREMISE: ${node.premise} (Risk: ${node.risk_level})`;
                break;
            case 'evidence':
                coreText = typeof node.content === 'string' ? node.content : JSON.stringify(node.content).slice(0, 300); // Truncate long evidence
                break;
            case 'idea':
                coreText = `SUMMARY: ${node.summary}`;
                break;
            case 'task':
                coreText = `TASK: ${node.title} (${node.status})`;
                break;
            default:
                // Fallback for Artifacts, Notes, etc.
                coreText = (node as any).content || (node as any).name || JSON.stringify(node.metadata);
        }

        // Critical Flags for the "Verifier"
        const flags = [];
        if (node.metadata.pin) flags.push("PIN_INVARIANT");
        if (node.metadata.validated) flags.push("VALIDATED");
        if ((node.metadata.confidence || 1) < 0.8) flags.push(`LOW_CONFIDENCE(${node.metadata.confidence})`);

        return {
            id: node.id,
            type: node.type.toUpperCase(),
            flags: flags.join(', '),
            content: coreText
        };
    });

    const serializedEdges = edges.map(edge => {
        return `${edge.source} --[${edge.relation.toUpperCase()}]--> ${edge.target}`;
    });

    return JSON.stringify({
        nodes: serializedNodes,
        structure: serializedEdges
    }, null, 2);
}
