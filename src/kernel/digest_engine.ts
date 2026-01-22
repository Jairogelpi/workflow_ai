/**
 * Digest Engine (Gate 7)
 * 
 * Implements the "Raw-on-demand" logic and Staleness management.
 * Discriminates when to use a compiled digest vs raw nodes.
 */

import { traceSpan } from './observability';
import { createClient } from '../lib/supabase';

interface RetrievalContext {
    text: string;
    strategy: 'RAW' | 'DIGEST';
    sourceCount: number;
}

/**
 * retrieves context for a query, automatically deciding between RAW and DIGEST.
 */
export async function retrieveContext(
    query: string,
    branchId: string,
    forceHighPrecision: boolean = false
): Promise<RetrievalContext> {

    return traceSpan('retrieve_context', { query_length: query.length, branchId }, async () => {
        const supabase = createClient();

        // 1. Try to fetch an active Digest first
        const { data: digest } = await supabase
            .from('digests')
            .select('*')
            .eq('entity_id', branchId)
            .eq('entity_type', 'branch')
            .eq('digest_flavor', 'standard')
            .eq('is_stale', false)
            .maybeSingle();

        // LOGIC: Use Digest if available AND not forced to high precision AND query looks "general"
        // (Simple heuristic: query length < 50 chars usually means "summary of branch?")
        const isGeneralQuery = query.length < 50 || query.toLowerCase().includes('summary') || query.toLowerCase().includes('status');

        if (digest && (isGeneralQuery && !forceHighPrecision)) {
            // HIT: Return Digest
            return {
                text: digest.summary_text,
                strategy: 'DIGEST',
                sourceCount: 1 // Logically 1 unit of context, though it represents many nodes
            };
        }

        // MISS: Fetch Raw Nodes
        // This is the fallback if digest is stale, missing, or precision is required.
        const { data: nodes } = await supabase
            .from('work_nodes')
            .select('content, type')
            .eq('project_id', branchId) // Assuming branchId basically acts as a project/context ID for now since branch_id is not in user schema
            // NOTE: User schema has project_id, but NOT branch_id. 
            // We will map branchId query to project_id or metadata filter. 
            // For now, assume branchId passed IS projectId.
            .eq('is_validated', true); // Only validated nodes for context

        const rawText = nodes?.map(n => JSON.stringify(n.content)).join('\n') || '';

        return {
            text: rawText,
            strategy: 'RAW',
            sourceCount: nodes?.length || 0
        };
    });
}

/**
 * Marks a branch's digests as stale. 
 * Should be called whenever a node in the branch is updated.
 */
export async function markStale(branchId: string): Promise<void> {
    return traceSpan('mark_stale', { branchId }, async () => {
        const supabase = createClient();

        await supabase
            .from('digests')
            .update({ is_stale: true })
            .eq('entity_id', branchId)
            .eq('entity_type', 'branch');

        console.log(`[DigestEngine] Marked branch ${branchId} as STALE.`);
    });
}
