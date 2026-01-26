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
            snippet_context: metadata.snippet_context,
            spatial: metadata.spatial
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

        // [Graph-RAG] Auto-Embedding Generation (Expert Mode)
        // We do this asynchronously to not block the UI (Fire & Forget logic or Background Task)
        // For 2026 robustness, we should ideally use a queue, but here we await it for consistency 
        // to ensure immediate retrieval availability (Real-Time Memory).
        try {
            // Dynamic import to avoid circular dependencies if any
            const { EmbeddingService } = await import('@/kernel/memory/embeddings');

            // Construct text representation: Title + Content + Type
            // This 'Rich Context' improves semantic search (Hybrid approach)
            const textToEmbed = `[${type.toUpperCase()}] ${contentSpecifics.title || 'Untitled'} - ${(contentSpecifics.statement || contentSpecifics.content || "").substring(0, 8000)}`;

            const embedding = await EmbeddingService.embed(textToEmbed);

            // Upsert into node_embeddings
            const { error: vectorError } = await supabase
                .from('node_embeddings' as any)
                .upsert({
                    id: id,
                    project_id: projectId,
                    content: textToEmbed,
                    embedding: embedding, // pgvector handles the array
                    updated_at: new Date().toISOString()
                });

            if (vectorError) console.error('[SyncService] Vector upsert failed:', vectorError);

        } catch (embedError) {
            // Non-blocking failure: If embedding fails (e.g. no key), we still saved the node.
            console.warn('[SyncService] Embedding generation skipped:', embedError);
        }

        // [PHASE 3] Staleness Trigger
        // Mark the project's digest as stale so it gets regenerated eventually.
        try {
            const { markStale } = await import('../kernel/digest_engine');
            await markStale(projectId);
        } catch (e) {
            console.warn('[SyncService] Failed to mark digest as stale:', e);
        }
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

        // [PHASE 3] Staleness Trigger
        try {
            const { markStale } = await import('../kernel/digest_engine');
            await markStale(projectId);
        } catch (e) { console.warn('[SyncService] Failed to mark digest as stale:', e); }
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

        // [PHASE 3] Staleness Trigger (Need to fetch project_id or assume context)
        // Since we don't have projectId here easily (update doesn't return it by default unless select), 
        // we skip for now OR we update the query to return it.
        // Let's rely on the fact that archives usually happen via UI which might trigger regeneration manually.
        // But for completeness:
        /*
        const { data } = await supabase.from('work_nodes').select('project_id').eq('id', nodeId).single();
        if (data) {
             const { markStale } = await import('../kernel/digest_engine');
             await markStale(data.project_id);
        }
        */
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
     * Soft Delete Multiple Edges (Batch)
     */
    async archiveEdges(edgeIds: string[]) {
        if (edgeIds.length === 0) return;
        const { error } = await supabase
            .from('work_edges')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', edgeIds);

        if (error) throw error;
    },

    /**
     * Batch upsert (FIXED: Single Request)
     */
    async syncAll(projectId: string, nodes: WorkNode[], edges: WorkEdge[]) {
        if (nodes.length === 0 && edges.length === 0) return;

        // 1. Prepare Bulk Payloads
        const nodesPayload = nodes.map(node => {
            const { id, type, metadata, ...contentSpecifics } = node as any;
            return {
                id: id,
                project_id: projectId,
                type: type,
                content: contentSpecifics,
                is_pinned: metadata.pin,
                is_validated: metadata.validated,
                current_version_hash: metadata.version_hash,
                confidence: metadata.confidence,
                origin: metadata.origin,
                metadata: {
                    source: metadata.source,
                    source_title: metadata.source_title,
                    accessed_at: metadata.accessed_at,
                    snippet_context: metadata.snippet_context,
                    spatial: metadata.spatial
                },
                updated_at: new Date().toISOString(),
                deleted_at: null
            };
        });

        const edgesPayload = edges.map(edge => ({
            id: edge.id,
            project_id: projectId,
            source_node_id: edge.source,
            target_node_id: edge.target,
            relation: edge.relation,
            metadata: edge.metadata,
            created_at: new Date().toISOString(),
            deleted_at: null
        }));

        // 2. Execute Parallel Bulk Requests
        const [nodeRes, edgeRes] = await Promise.all([
            nodesPayload.length > 0 ? supabase.from('work_nodes').upsert(nodesPayload) : { error: null },
            edgesPayload.length > 0 ? supabase.from('work_edges').upsert(edgesPayload) : { error: null }
        ]);

        if (nodeRes.error) throw nodeRes.error;
        if (edgeRes.error) throw edgeRes.error;

        console.log(`[SyncService] Bulk synced ${nodes.length} nodes and ${edges.length} edges.`);

        // [PHASE 3] Staleness Trigger
        try {
            const { markStale } = await import('../kernel/digest_engine');
            await markStale(projectId);
        } catch (e) { console.warn('[SyncService] Failed to mark digest as stale:', e); }
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
