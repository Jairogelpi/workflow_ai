import { WorkNode } from '../canon/schema/ir';
import { createClient } from '../lib/supabase';
import { traceSpan } from './observability';

/**
 * PRODUCT ENGINE (Universal Compiler)
 * Transforms Graph Chaos into Corporate Order.
 */

export interface CompiledDocument {
    title: string;
    type: 'PRD' | 'STRATEGY' | 'DECISION_LOG';
    markdown: string;
    metadata: {
        node_count: number;
        rice_score?: number;
        generated_at: string;
    };
}

export async function compilePRD(projectId: string, title: string = 'Product Requirement Document'): Promise<CompiledDocument> {
    return traceSpan('compile_prd', { projectId }, async () => {
        const supabase = await createClient();

        // 1. Harvest Context (Validated Truths Only)
        const { data: nodesRaw } = await supabase
            .from('work_nodes')
            .select('*')
            .eq('project_id', projectId);

        if (!nodesRaw) throw new Error("Project not found or empty.");

        // Hydrate
        const nodes = nodesRaw.map((n: any) => ({ ...n, ...n.content })) as WorkNode[];

        // 2. Serialize for the LLM
        // We reuse the Digest Engine's serializer to ensure consistent "Ground Truth"
        const { serializeBranchForLLM } = await import('./digest_engine');
        // We assume 0 edges for now to keep it simple
        const context = serializeBranchForLLM(nodes, []);

        // 3. Neural Synthesis (The Voice)
        // We import generateText dynamically to avoid circular dependencies if any
        // 3. Neural Synthesis (The Voice)
        // STRICT: We dynamically import the gateway. If it fails, we throw.
        const { generateText } = await import('./llm/gateway');

        const PRD_SYSTEM_PROMPT = `
        ROLE: You are the Chief Product Officer (CPO) of a high-growth tech startup.
        GOAL: Write a professional Product Requirement Document (PRD) based STRICTLY on the provided graph context.
        `;

        const prompt = `
        CONTEXT:
        ${context}

        Request: Compile the "${title}".
        `;

        console.log(`[ProductEngine] Generating PRD with ${nodes.length} nodes context...`);
        const llmResult = await generateText(PRD_SYSTEM_PROMPT, prompt);
        const doc = llmResult.content;

        // 4. Calculate RICE (heuristic) based on metadata matches
        // Reach: default 0 (requires manual input), Impact: (High=3, Med=2, Low=1), Confidence: metadata.confidence
        // We look for explicit RICE metadata, otherwise default to 0 to avoid "fake" high scores.
        const riceScore = nodes.reduce((acc, n) => acc + (n.metadata?.rice_score || 0), 0) / (nodes.length || 1);

        return {
            title,
            type: 'PRD',
            markdown: doc.trim(),
            metadata: {
                node_count: nodes.length,
                rice_score: riceScore,
                generated_at: new Date().toISOString()
            }
        };
    });
}
