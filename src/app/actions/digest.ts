'use server';

import { regenerateBranchDigest } from '../../kernel/digest_engine';

/**
 * Manually triggers the "Hierarchical Memory" compression process.
 * Used by the UI (IngestionHUD) to force a summary update.
 */
export async function triggerMemoryConsolidation(projectId: string) {
    console.log(`[SERVER ACTION] Triggering Memory Consolidation for project: ${projectId}`);

    try {
        await regenerateBranchDigest(projectId);
        return { success: true };
    } catch (error: any) {
        console.error('[SERVER ACTION] Memory Consolidation Failed:', error);
        return { success: false, error: error.message };
    }
}
