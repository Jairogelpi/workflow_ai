import { supabase } from './supabase';
import { WorkNode, WorkEdge } from '../canon/schema/ir';

/**
 * Sync Bridge: Interfaces with Supabase SQL Tables
 */

export const syncService = {
    /**
     * Fetch all nodes and edges for a specific project
     */
    async fetchGraph(projectId: string) {
        const [nodesRes, edgesRes] = await Promise.all([
            supabase.from('work_nodes').select('*').eq('project_id', projectId),
            supabase.from('work_edges').select('*').eq('project_id', projectId)
        ]);

        if (nodesRes.error) throw nodesRes.error;
        if (edgesRes.error) throw edgesRes.error;

        return {
            nodes: nodesRes.data as any[],
            edges: edgesRes.data as any[]
        };
    },

    /**
     * Atomic Upsert for a WorkNode
     */
    async upsertNode(projectId: string, node: WorkNode) {
        const { error } = await supabase
            .from('work_nodes')
            .upsert({
                id: node.id,
                project_id: projectId,
                type: node.type,
                content: node, // Storing the full node in content for now or decomposing
                confidence: node.metadata.confidence,
                is_pinned: node.metadata.pin,
                is_validated: node.metadata.validated,
                origin: node.metadata.origin,
                metadata: node.metadata,
                current_version_hash: node.metadata.version_hash,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    },

    /**
     * Upsert for a WorkEdge
     */
    async upsertEdge(projectId: string, edge: WorkEdge) {
        const { error } = await supabase
            .from('work_edges')
            .upsert({
                id: edge.id,
                project_id: projectId,
                source_node_id: edge.source,
                target_node_id: edge.target,
                relation: edge.relation,
                metadata: edge.metadata
            });

        if (error) throw error;
    },

    /**
     * Batch upsert for initializing/saving large changes
     */
    async syncAll(projectId: string, nodes: WorkNode[], edges: WorkEdge[]) {
        // Simple sequential or ideally bulk upsert
        for (const node of nodes) await this.upsertNode(projectId, node);
        for (const edge of edges) await this.upsertEdge(projectId, edge);
    }
};
