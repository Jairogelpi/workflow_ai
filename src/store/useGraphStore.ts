import { create } from 'zustand';
import {
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    applyNodeChanges,
    applyEdgeChanges,
    Connection,
    addEdge
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { WorkNode, WorkEdge } from '../canon/schema/ir';
import { NodeId, EdgeId } from '../canon/schema/primitives';
import { createVersion } from '../kernel/versioning';
import { backendToFlow } from '../lib/adapters';
import { syncService } from '../lib/sync';

// AppNode uses the Kernel WorkNode as its internal data
export type AppNode = Node<WorkNode, string>;
export type AppEdge = Edge<WorkEdge>;

// Default project ID for now (Local-first mindset but SQL-backed)
const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000000';

interface GraphState {
    nodes: AppNode[];
    edges: AppEdge[];
    selectedNodeId: string | null;
    isLoading: boolean;
    isSyncing: boolean;

    // Core Actions
    setNodes: (nodes: AppNode[]) => void;
    setEdges: (edges: AppEdge[]) => void;
    loadProject: (projectId: string) => Promise<void>;

    // React Flow Handlers
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;

    // Interaction
    setSelectedNode: (id: string | null) => void;
    updateNodeContent: (id: string, content: string) => void;
    addNode: (type: WorkNode['type'], position?: { x: number, y: number }) => void;
    mutateNodeType: (id: string, newType: WorkNode['type']) => void;
    deleteNode: (id: string) => Promise<void>;

    // Discovery
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    centerNode: (id: string) => void;

    // --- WINDOW MANAGER STATE ---
    /** The currently active floating window (if any) */
    activeWindow: {
        id: string;
        title: string;
        contentUrl?: string;
        /** The type of content to render inside the window */
        contentType: 'pdf' | 'web' | 'text' | 'editor';
        /** Optional data passed to the editor component */
        nodeData?: any;
        /** MIME type of the file, used for SmartViewer */
        mimeType?: string;
        /** Extracted text content for fallback viewing */
        textContent?: string;
    } | null;

    /** Opens a floating window with the specified configuration */
    openWindow: (window: GraphState['activeWindow']) => void;
    /** Closes the currently active floating window */
    closeWindow: () => void;

    // --- AUTHORITY SIGNATURE ACTIONS (Hito 4.4) ---
    signNode: (id: string, signerId: string) => Promise<void>;
    breakSeal: (id: string) => Promise<void>;
}

export const useGraphStore = create<GraphState>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,

    searchQuery: '',
    activeWindow: null,
    isLoading: false,
    isSyncing: false,

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    openWindow: (window) => set({ activeWindow: window }),
    closeWindow: () => set({ activeWindow: null }),

    signNode: async () => { }, // Defined later
    breakSeal: async () => { }, // Defined later

    loadProject: async (projectId) => {
        set({ isLoading: true });
        try {
            const { nodes: rawNodes, edges: rawEdges } = await syncService.fetchGraph(projectId);

            // Map Domain Nodes (WorkNode) to React Flow Nodes (AppNode)
            const flowNodes = rawNodes.map(node => backendToFlow(node));

            const flowEdges = rawEdges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                data: edge // WorkEdge is the data
            }));

            set({ nodes: flowNodes, edges: flowEdges, isLoading: false });
        } catch (error) {
            console.error('Failed to hydrate graph:', error);
            set({ isLoading: false });
        }
    },

    centerNode: (id) => {
        set({ selectedNodeId: id });
    },

    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes) as AppNode[],
        });
    },

    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges) as AppEdge[],
        });
    },

    onConnect: async (params) => {
        const { source, target } = params;
        if (!source || !target) return;

        const newWorkEdge: WorkEdge = {
            id: uuidv4() as EdgeId,
            source: source as NodeId,
            target: target as NodeId,
            relation: 'relates_to',
            metadata: {
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version_hash: '0000000000000000000000000000000000000000000000000000000000000000',
                origin: 'human',
                confidence: 1.0,
                validated: false,
                pin: false
            }
        };

        const newEdge: AppEdge = {
            id: newWorkEdge.id,
            source: newWorkEdge.source,
            target: newWorkEdge.target,
            data: newWorkEdge,
        };

        set({
            edges: addEdge(newEdge, get().edges) as AppEdge[],
        });

        // Background Sync
        await syncService.upsertEdge(DEFAULT_PROJECT_ID, newWorkEdge);
    },

    setSelectedNode: (id) => set({ selectedNodeId: id }),

    updateNodeContent: async (id, content) => {
        const { nodes } = get();
        let updatedNodeRecord: WorkNode | null = null;

        const updatedNodes = nodes.map((node) => {
            if (node.id === id) {
                const nodeData = node.data;
                const newData = { ...nodeData };

                // Discriminant-aware update
                if (newData.type === 'note') newData.content = content;
                else if (newData.type === 'claim') newData.statement = content;
                else if (newData.type === 'evidence') newData.content = content;
                else if (newData.type === 'decision') newData.rationale = content;
                else if (newData.type === 'idea') newData.details = content;
                else if (newData.type === 'task') newData.description = content;
                else if (newData.type === 'artifact') newData.name = content;
                else if (newData.type === 'assumption') newData.premise = content;
                else if (newData.type === 'constraint') newData.rule = content;

                // Cryptographic update (re-hashes the node)
                const updatedMetadata = createVersion(newData as WorkNode, node.data.metadata.version_hash);
                updatedNodeRecord = { ...newData, metadata: updatedMetadata } as WorkNode;

                return { ...node, data: updatedNodeRecord };
            }
            return node;
        });

        set({ nodes: updatedNodes });

        // Background Sync
        if (updatedNodeRecord) {
            await syncService.upsertNode(DEFAULT_PROJECT_ID, updatedNodeRecord);
        }
    },

    addNode: async (type, position) => {
        const id = uuidv4() as NodeId;
        const now = new Date().toISOString();

        // Base structure for initial state
        const baseNode: any = {
            id,
            type,
            metadata: {
                created_at: now,
                updated_at: now,
                origin: 'human',
                version_hash: '' as any,
                confidence: 1.0,
                validated: false,
                pin: false
            }
        };

        // Populate content placeholders
        if (type === 'note') baseNode.content = 'New Note';
        else if (type === 'claim') baseNode.statement = 'New Claim';
        else if (type === 'evidence') baseNode.content = 'New Evidence';
        else if (type === 'decision') { baseNode.rationale = 'New Decision'; baseNode.chosen_option = ''; }
        else if (type === 'idea') baseNode.summary = 'New Idea';
        else if (type === 'task') { baseNode.title = 'New Task'; baseNode.status = 'todo'; }
        else if (type === 'artifact') { baseNode.name = 'New Artifact'; baseNode.uri = 'http://localhost'; }
        else if (type === 'assumption') { baseNode.premise = 'New Assumption'; baseNode.risk_level = 'medium'; }
        else if (type === 'constraint') { baseNode.rule = 'New Constraint'; baseNode.enforcement_level = 'strict'; }

        // Sign the node
        const signedMetadata = createVersion(baseNode as WorkNode);
        const finalNode: WorkNode = { ...baseNode, metadata: signedMetadata };

        const flowNode = backendToFlow(finalNode, position || { x: Math.random() * 400, y: Math.random() * 400 });

        set({
            nodes: [...get().nodes, flowNode],
        });

        // Background Sync
        await syncService.upsertNode(DEFAULT_PROJECT_ID, finalNode);
    },

    mutateNodeType: async (id, newType) => {
        const { nodes } = get();
        let updatedNodeRecord: WorkNode | null = null;

        const updatedNodes = nodes.map((node) => {
            if (node.id === id) {
                const oldData = node.data;
                const newData: any = {
                    id: oldData.id,
                    type: newType,
                    metadata: oldData.metadata
                };

                // Preserve content if possible or create new placeholder
                const oldContent = (oldData as any).content || (oldData as any).statement || (oldData as any).rationale || (oldData as any).summary || (oldData as any).description || (oldData as any).details || (oldData as any).name || (oldData as any).premise || (oldData as any).rule || '';

                if (newType === 'note') newData.content = oldContent;
                else if (newType === 'claim') { newData.statement = oldContent; newData.verification_status = 'pending'; }
                else if (newType === 'evidence') newData.content = oldContent;
                else if (newType === 'decision') { newData.rationale = oldContent; newData.chosen_option = ''; }
                else if (newType === 'idea') newData.summary = oldContent;
                else if (newType === 'task') { newData.title = 'Mutated Task'; newData.description = oldContent; newData.status = 'todo'; }
                else if (newType === 'artifact') { newData.name = oldContent; newData.uri = 'http://localhost'; }
                else if (newType === 'assumption') { newData.premise = oldContent; newData.risk_level = 'medium'; }
                else if (newType === 'constraint') { newData.rule = oldContent; newData.enforcement_level = 'strict'; }
                else if (newType === 'source') { newData.citation = oldContent; }

                // Re-sign node with new type
                const updatedMetadata = createVersion(newData as WorkNode, oldData.metadata.version_hash);
                updatedNodeRecord = { ...newData, metadata: updatedMetadata } as WorkNode;

                return { ...node, data: updatedNodeRecord };
            }
            return node;
        });

        set({ nodes: updatedNodes });

        // Background Sync
        if (updatedNodeRecord) {
            await syncService.upsertNode(DEFAULT_PROJECT_ID, updatedNodeRecord);
        }
    },

    deleteNode: async (id: string) => {
        const { nodes, edges } = get();

        // Roadmap Perfection: Soft Delete
        set({
            nodes: nodes.filter(n => n.id !== id),
            edges: edges.filter(e => e.source !== id && e.target !== id)
        });

        try {
            await syncService.archiveNode(id);
            // Also archive related edges in DB
            const edgesToArchive = edges.filter(e => e.source === id || e.target === id);
            for (const edge of edgesToArchive) {
                await syncService.archiveEdge(edge.id);
            }
        } catch (error) {
            console.error('Failed to archive node:', error);
        }
    },

    signNode: async (id, signerId) => {
        const { nodes } = get();
        let updatedNodeRecord: WorkNode | null = null;

        const updatedNodes = nodes.map(node => {
            if (node.id === id) {
                const data = { ...node.data };
                // Snap the current hash as the seal
                const currentHash = computeNodeHash(data);

                data.metadata = {
                    ...data.metadata,
                    human_signature: {
                        signer_id: signerId,
                        timestamp: new Date().toISOString(),
                        hash_at_signing: currentHash,
                        method: 'organic'
                    }
                };
                updatedNodeRecord = data;
                return { ...node, data: updatedNodeRecord };
            }
            return node;
        });

        set({ nodes: updatedNodes });
        if (updatedNodeRecord) {
            await syncService.upsertNode(DEFAULT_PROJECT_ID, updatedNodeRecord);
        }
    },

    breakSeal: async (id) => {
        const { nodes } = get();
        let updatedNodeRecord: WorkNode | null = null;

        const updatedNodes = nodes.map(node => {
            if (node.id === id) {
                const data = { ...node.data };
                delete data.metadata.human_signature;
                updatedNodeRecord = data;
                return { ...node, data: updatedNodeRecord };
            }
            return node;
        });

        set({ nodes: updatedNodes });
        if (updatedNodeRecord) {
            await syncService.upsertNode(DEFAULT_PROJECT_ID, updatedNodeRecord);
        }
    },
}));
