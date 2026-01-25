import { supabase } from './supabase';
import { WorkNode, WorkEdge } from '../canon/schema/ir';

/**
 * Sync Bridge: Interfaces with Supabase SQL Tables (Existing Schema)
 */

export const syncService = {
    /**
     * Fetch all nodes and edges for a specific project
     */
    async fetchGraph(projectId: string) {
        const [nodesRes, edgesRes] = await Promise.all([
            supabase.from('work_nodes').select('*').eq('project_id', projectId).is('deleted_at', null),
            supabase.from('work_edges').select('*').eq('project_id', projectId).is('deleted_at', null)
        ]);

        if (nodesRes.error) throw nodesRes.error;
        if (edgesRes.error) throw edgesRes.error;

        // Re-hydrate WorkNode
        const nodes: WorkNode[] = (nodesRes.data || []).map((row: any) => {
            // 1. Extract JSON Content
            const coreContent = row.content || {};

            // 2. Reconstruct Metadata
            const metadata = {
                created_at: row.created_at,
                updated_at: row.updated_at,
                version_hash: row.current_version_hash || '0000',
                origin: row.origin || 'human',
                confidence: row.confidence ?? 1.0,
                // Adapting existing columns to IR
                validated: row.is_validated ?? false,
                pin: row.is_pinned ?? false,

                // Metadata extras
                source: row.metadata?.source,
                source_title: row.metadata?.source_title,
                accessed_at: row.metadata?.accessed_at,
                snippet_context: row.metadata?.snippet_context,
            };

            // 3. Assemble Object
            return {
                id: row.id,
                type: row.type,
                metadata,
                ...coreContent // Spread content (statement, rationale, etc.)
            } as WorkNode;
        });

        const edges: WorkEdge[] = (edgesRes.data || []).map((row: any) => ({
            // If ID is UUID (from existing table), use it. 
            // Logic assumes row.id exists in work_edges
            id: row.id,
            source: row.source_node_id,
            target: row.target_node_id,
            relation: row.relation,
            metadata: {
                created_at: row.created_at,
                updated_at: row.created_at,
                version_hash: '0000',
                origin: 'human',
                confidence: 1.0,
                validated: true,
                pin: false,
                ...row.metadata // Spread any additional metadata from the DB
            }
        })) as unknown as WorkEdge[];

        return { nodes, edges };
    },

    /**
     * Atomic Upsert for a WorkNode
     */
    async upsertNode(projectId: string, node: WorkNode) {
        const { id, type, metadata, ...contentSpecifics } = node as any;

        // Payload for 'content' JSONB column
        const contentPayload = {
            ...contentSpecifics
        };

        // Payload for 'metadata' JSONB column (extras only)
        const metadataPayload = {
            source: metadata.source,
            source_title: metadata.source_title,
            accessed_at: metadata.accessed_at,
            snippet_context: metadata.snippet_context
        };

        const { error } = await supabase
            .from('work_nodes') // Using EXISTING table
            .upsert({
                id: id,
                project_id: projectId,
                type: type,
                content: contentPayload,

                // Mapping IR -> DB Columns
                is_pinned: metadata.pin,
                is_validated: metadata.validated,
                current_version_hash: metadata.version_hash,
                confidence: metadata.confidence,
                origin: metadata.origin,

                metadata: metadataPayload,

                updated_at: new Date().toISOString(),
                deleted_at: null
            });

        if (error) throw error;
    },

    /**
     * Upsert for a WorkEdge
     */
    async upsertEdge(projectId: string, edge: WorkEdge) {
        const { error } = await supabase
            .from('work_edges') // Using EXISTING table
            .upsert({
                id: edge.id,
                project_id: projectId,
                source_node_id: edge.source,
                target_node_id: edge.target,
                relation: edge.relation,
                metadata: edge.metadata,
                created_at: new Date().toISOString(),
                deleted_at: null
            });

        if (error) throw error;
    },

    /**
     * Soft Delete (Archive) for a node
     */
    async archiveNode(nodeId: string) {
        const { error } = await supabase
            .from('work_nodes')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', nodeId);

        if (error) throw error;
    },

    /**
     * Soft Delete Edge
     */
    async archiveEdge(edgeId: string) {
        const { error } = await supabase
            .from('work_edges')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', edgeId);

        if (error) throw error;
    },

    /**
     * Batch upsert
     */
    async syncAll(projectId: string, nodes: WorkNode[], edges: WorkEdge[]) {
        for (const node of nodes) await this.upsertNode(projectId, node);
        for (const edge of edges) await this.upsertEdge(projectId, edge);
    },

    /**
     * Create a new Project
     */
    async createProject(name: string, description: string, ownerId: string) {
        const { data, error } = await supabase
            .from('projects')
            .insert({
                name,
                description,
                owner_id: ownerId,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select() // Return the created row
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Fetch Projects for User
     */
    async fetchProjects() {
        // Simplified: Fetch all projects where current user is owner (or has access via RBAC logic later)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('owner_id', user.id)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
