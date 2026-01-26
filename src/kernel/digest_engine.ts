import { z } from 'zod';
import { createClient } from '../lib/supabase';
import { traceSpan } from './observability';
import { SmartRouter } from './llm/gateway';
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
  "summary_text": "Markdown summary with [ref:UUID] links covering the general narrative.",
  "invariants": ["List of PIN rules found (Absolute truths)"],
  "decisions": ["List of VALIDATED decisions made"],
  "open_questions": ["List of PENDING claims or tasks"],
  "technical_details": ["List of specific implementation details/constraints"],
  "warnings": [
    { "code": "contradiction" | "staleness" | "low_confidence", "node_ids": ["uuid"], "message": "explanation" }
  ],
  "stats": { "node_count": number }
}
`;

// --- Interfaces ---

interface RetrievalContext {
    text: string;
    strategy: 'RAW' | 'DIGEST' | 'SELECTIVE';
    sourceCount: number;
    warnings?: any[];
}

interface DigestResult {
    summary_text: string;
    invariants: string[];
    decisions: string[];
    open_questions: string[];
    technical_details: string[];
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
    forceHighPrecision: boolean = false,
    focus: 'general' | 'planning' | 'coding' = 'general' // [NEW] Selective Focus
): Promise<RetrievalContext> {
    return traceSpan('retrieve_context', { query_length: query.length, branchId }, async () => {
        const supabase = await createClient();

        // 1. Try to fetch a valid Standard Digest (Even if stale - Phase 3 Self-Healing)
        const { data: digest } = await supabase
            .from('digests')
            .select('*')
            .eq('entity_id', branchId)
            .eq('entity_type', 'branch')
            .eq('digest_flavor', 'standard')
            // .eq('is_stale', false) // REMOVED: We accept stale reads for availability
            .maybeSingle();

        // LOGIC: Use Digest if available AND not forced AND query is general
        const isGeneralQuery = query.length < 60 || /resumen|estado|summary|status/i.test(query);

        if (digest && (isGeneralQuery && !forceHighPrecision)) {

            // [PHASE 3] SELF-HEALING MECHANISM
            // If the memory is stale, we use it (Degraded Mode) triggers a refresh in background.
            if (digest.is_stale) {
                console.log(`[DigestEngine] 🩹 Self-Healing: Triggering background regeneration for ${branchId}`);
                // Fire & Forget: Do not await this, let it run in background
                regenerateBranchDigest(branchId).catch(e =>
                    console.error('[DigestEngine] Background regeneration failed:', e)
                );
            }

            let finalText = digest.summary_text;

            // [SELECTIVE RETRIEVAL]
            // We parse the stored Summary JSON from the Supabase JSONB column (metadata).
            if (focus === 'coding') {
                const data = digest.metadata || {};
                finalText = `[CODING FOCUS]\n\nDecisions:\n${(data.decisions || []).join('\n')}\n\nTechnical:\n${(data.technical_details || []).join('\n')}`;
            } else if (focus === 'planning') {
                const data = digest.metadata || {};
                finalText = `[PLANNING FOCUS]\n\nInvariants:\n${(data.invariants || []).join('\n')}\n\nQuestions:\n${(data.open_questions || []).join('\n')}`;
            }

            return {
                text: finalText,
                strategy: 'SELECTIVE',
                sourceCount: 1,
                warnings: digest.warnings || (digest.is_stale ? [{ code: 'stale_memory', message: 'Digest is being regenerated' }] : [])
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

        // 3. Call LLM
        // STRICT: We dynamically import the gateway. If it fails, we throw.
        const { generateText } = await import('./llm/gateway');

        // Pass branchId (Project ID) for Cost Attribution
        const resultRaw = await generateText(DIGEST_SYSTEM_PROMPT, payload, 'REASONING', undefined, undefined, branchId);
        const cleanJson = resultRaw.content.replace(/```json/g, '').replace(/```/g, '').trim();
        const result: DigestResult = JSON.parse(cleanJson);

        // 4. Upsert Digest
        const { error } = await supabase.from('digests').upsert({
            entity_id: branchId,
            entity_type: 'branch',
            digest_flavor: 'standard',
            summary_text: result.summary_text,
            warnings: result.warnings,
            is_stale: false,
            last_generated_at: new Date().toISOString(),
            // Store rich structure for selective retrieval
            metadata: {
                invariants: result.invariants,
                decisions: result.decisions,
                open_questions: result.open_questions,
                technical_details: result.technical_details
            },
            token_cost_input: Math.ceil(payload.length / 4)
        }, { onConflict: 'entity_type, entity_id, digest_flavor' });

        if (error) throw error;
    });
}

/**
 * HIERARCHICAL ABSTRACTION (Gate 9)
 * Compiles a specific cluster of nodes into a parent Artifact node.
 */
export async function createHierarchicalDigest(nodes: WorkNode[], projectId: string = 'global-system'): Promise<{ summary: string; artifactId: string }> {
    return traceSpan('hierarchical_digest', { node_count: nodes.length }, async () => {
        // 1. Serialize cluster
        const payload = serializeBranchForLLM(nodes, []); // No structure simplified for now

        // 2. Request AI synthesis (Real Mode)
        // STRICT: We dynamically import the gateway. If it fails, we throw.
        const { generateText } = await import('./llm/gateway');
        console.log(`[DigestEngine] Abstracting cluster of ${nodes.length} nodes...`);

        const ABSTRACT_SYSTEM = `
            ROLE: Knowledge Synthesizer.
            GOAL: Create a high-level abstract summary of the provided nodes.
            OUTPUT: Standard Markdown text. One paragraph.
        `;

        const res = await generateText(ABSTRACT_SYSTEM, `Context:\n${payload}`, 'REASONING', undefined, undefined, projectId);
        const summary = res.content;

        return {
            summary,
            artifactId: `artifact-${Date.now()}`
        };
    });
}

/**
 * Trigger a new hierarchical digest job (Async Queue)
 */
export async function triggerBranchDigest(rootNodeId: string): Promise<void> {
    return traceSpan('trigger_branch_digest', { rootNodeId }, async () => {
        const supabase = await createClient();

        // 1. Get project_id for this node
        const { data: node } = await supabase
            .from('work_nodes')
            .select('project_id')
            .eq('id', rootNodeId)
            .single();

        if (!node) throw new Error("Root node not found");

        // 2. Queue the Job
        const { error } = await supabase
            .from('ingestion_jobs')
            .insert({
                project_id: node.project_id,
                node_id: rootNodeId,
                type: 'digest_branch',
                status: 'pending',
                payload: { root_node_id: rootNodeId }
            });

        if (error) throw error;
        console.log(`[DigestEngine] Digest job queued for node: ${rootNodeId}`);
    });
}

/**
 * THE RLM ARCHITECT: Process Hierarchical Digest Job
 * Fractal Recursive Map-Reduce Algorithm
 */
export async function processHierarchicalDigest(jobId: string, rootNodeId: string, projectId: string): Promise<void> {
    return traceSpan('process_hierarchical_digest', { jobId, rootNodeId }, async () => {
        const supabase = await createClient();

        // 1. Get all descendants (Recursive check)
        // For Hito 3.1, we use a flattened tree check based on 'part_of' or parent relations
        const { data: edges } = await supabase.from('work_edges').select('*').eq('project_id', projectId);
        const { data: nodesRaw } = await supabase.from('work_nodes').select('*').eq('project_id', projectId);

        if (!nodesRaw) return;

        // BFS to find all children of rootNodeId
        const descendants: string[] = [];
        const queue = [rootNodeId];
        const visited = new Set([rootNodeId]);

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const children = (edges || [])
                .filter(e => e.target_node_id === currentId && e.relation === 'part_of')
                .map(e => e.source_node_id);

            for (const childId of children) {
                if (!visited.has(childId)) {
                    visited.add(childId);
                    descendants.push(childId);
                    queue.push(childId);
                }
            }
        }

        const clusterNodes = nodesRaw.filter(n => descendants.includes(n.id));

        if (clusterNodes.length === 0) {
            console.warn(`[DigestEngine] No children found for node ${rootNodeId}. Nothing to digest.`);
            await supabase.from('ingestion_jobs').update({ status: 'completed', progress: 1.0 }).eq('id', jobId);
            return;
        }

        // 2. Recursive Abstraction Check
        // If > 20 nodes, we should do Map-Reduce. For now, we do single-pass with "Architect" prompt.
        const serialized = serializeBranchForLLM(clusterNodes as any, (edges || []) as any);

        const { generateText } = await import('./llm/gateway');

        const ARCHITECT_PROMPT = `
        ROLE: Senior System Architect & Strategic Thinker.
        GOAL: Synthesize this graph branch into a high-level executive digest.
        
        INSTRUCTIONS:
        1. Identify the Core Objective of this branch.
        2. Detect logical gaps or contradictions (Dissonance).
        3. Extract clear Action Items.
        4. Be concise but technically precise.
        
        OUTPUT FORMAT (JSON):
        {
            "summary": "Full text summary",
            "insights": ["Point 1", "Point 2"],
            "actions": ["Action 1"],
            "conflicts": [{"message": "conflict description", "nodes": ["id1", "id2"]}]
        }
        `;

        const res = await generateText(ARCHITECT_PROMPT, serialized, 'REASONING', undefined, undefined, projectId);

        try {
            const result = JSON.parse(res.content.replace(/```json/g, '').replace(/```/g, '').trim());

            // 3. Persist Crystallized Intelligence
            await supabase.from('node_digests').upsert({
                node_id: rootNodeId,
                summary: result.summary,
                key_insights: result.insights,
                action_items: result.actions,
                conflicts_detected: result.conflicts,
                model_used: SmartRouter.getOptimalModel('REASONING'),
                updated_at: new Date().toISOString()
            });

            // 4. Finalize Job
            await supabase.from('ingestion_jobs').update({ status: 'completed', progress: 1.0 }).eq('id', jobId);

            console.log(`[DigestEngine] Hierarchical digest completed for ${rootNodeId}`);
        } catch (e) {
            console.error("[DigestEngine] Failed to parse Architect output:", e);
            throw e;
        }
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
