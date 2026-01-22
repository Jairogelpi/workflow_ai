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
import { ChangeProposal } from '../kernel/collaboration/Negotiator';
import { createVersion, computeNodeHash } from '../kernel/versioning';
import { backendToFlow } from '../lib/adapters';
import { syncService } from '../lib/sync';
import * as d3 from 'd3-force';

// AppNode uses the Kernel WorkNode as its internal data
export type AppNode = Node<WorkNode, string>;
export type AppEdge = Edge<WorkEdge>;

// Default project ID for now (Local-first mindset but SQL-backed)
const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000000';

// Semantic force mapping based on IR relations
const FORCE_MAPPING: Record<string, number> = {
    'evidence_for': -50, // Strong attraction
    'validates': -50,    // Strong attraction
    'part_of': -20,      // Weak grouping
    'contradicts': 300,  // Strong repulsion
    'blocks': 100,       // Structural tension
    'relates_to': -10    // Neutral/weak association
};

interface GraphState {
    nodes: AppNode[];
    edges: AppEdge[];
    selectedNodeId: string | null;
    isLoading: boolean;
    isSyncing: boolean;

    // AI Mediator Proposals
    proposals: ChangeProposal[];
    addProposal: (proposal: ChangeProposal) => void;
    resolveProposal: (id: string, decision: 'accept' | 'reject') => Promise<void>;

    // Shadow Storage
    draftNodes: AppNode[];

    // Antigravity State
    isAntigravityActive: boolean;
    physicsStats: {
        latency_ms: number;
        cost_usd: number;
        iterations: number;
    };

    // Forensic Observability (Hito 4.3)
    lastAuditRecord: {
        operation: string;
        timestamp: string;
        duration_ms: number;
        cost_usd: number;
        engine: string;
        metadata?: any;
    } | null;
    recordAudit: (record: GraphState['lastAuditRecord']) => void;

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

    // --- INTERACTIVE EDITING ACTIONS ---
    renameNode: (id: string, newName: string) => Promise<void>;
    addNodeComment: (id: string, comment: string) => Promise<void>;
    updateEdgeRelation: (edgeId: string, newRelation: string) => Promise<void>;
    deleteEdge: (edgeId: string) => Promise<void>;

    // Discovery
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    centerNode: (id: string) => void;

    // Shadow Storage Actions
    proposeNode: (node: WorkNode, position?: { x: number, y: number }) => void;
    commitDraft: (id: string) => Promise<void>;
    discardDraft: (id: string) => void;

    // --- WINDOW MANAGER STATE ---
    activeWindow: {
        id: string;
        title: string;
        contentUrl?: string;
        contentType: 'pdf' | 'web' | 'text' | 'editor';
        nodeData?: any;
        mimeType?: string;
        textContent?: string;
    } | null;

    openWindow: (window: GraphState['activeWindow']) => void;
    closeWindow: () => void;

    // --- AUTHORITY SIGNATURE ACTIONS (Hito 4.4) ---
    signNode: (id: string, signerId: string) => Promise<void>;
    breakSeal: (id: string) => Promise<void>;

    // --- ANTIGRAVITY ACTIONS ---
    setAntigravity: (active: boolean) => void;
    toggleAntigravity: () => void;
    applyForces: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    searchQuery: '',
    activeWindow: null,
    isLoading: false,
    isSyncing: false,
    proposals: [],
    draftNodes: [],

    // Antigravity Initial State (Fricción Cero: On by default)
    isAntigravityActive: true,
    physicsStats: {
        latency_ms: 0,
        cost_usd: 0,
        iterations: 0
    },

    lastAuditRecord: null,
    recordAudit: (record) => set({ lastAuditRecord: record }),

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    openWindow: (window) => set({ activeWindow: window }),
    closeWindow: () => set({ activeWindow: null }),

    loadProject: async (projectId) => {
        set({ isLoading: true });
        try {
            const { nodes: rawNodes, edges: rawEdges } = await syncService.fetchGraph(projectId);
            const flowNodes = rawNodes.map(node => backendToFlow(node));
            const flowEdges = rawEdges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                data: edge
            }));
            set({ nodes: flowNodes, edges: flowEdges, isLoading: false });
        } catch (error) {
            console.error('Failed to hydrate graph:', error);
            set({ isLoading: false });
        }
    },

    centerNode: (id) => set({ selectedNodeId: id }),

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

                if (newData.type === 'note') newData.content = content;
                else if (newData.type === 'claim') newData.statement = content;
                else if (newData.type === 'evidence') newData.content = content;
                else if (newData.type === 'decision') newData.rationale = content;
                else if (newData.type === 'idea') newData.details = content;
                else if (newData.type === 'task') newData.description = content;
                else if (newData.type === 'artifact') newData.name = content;
                else if (newData.type === 'assumption') newData.premise = content;
                else if (newData.type === 'constraint') newData.rule = content;

                const updatedMetadata = createVersion(newData as WorkNode, node.data.metadata.version_hash);
                updatedNodeRecord = { ...newData, metadata: updatedMetadata } as WorkNode;

                return { ...node, data: updatedNodeRecord };
            }
            return node;
        });

        set({ nodes: updatedNodes });
        if (updatedNodeRecord) {
            await syncService.upsertNode(DEFAULT_PROJECT_ID, updatedNodeRecord);
        }
    },

    addNode: async (type, position) => {
        const id = uuidv4() as NodeId;
        const now = new Date().toISOString();
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

        if (type === 'note') baseNode.content = 'New Note';
        else if (type === 'claim') baseNode.statement = 'New Claim';
        else if (type === 'evidence') baseNode.content = 'New Evidence';
        else if (type === 'decision') { baseNode.rationale = 'New Decision'; baseNode.chosen_option = ''; }
        else if (type === 'idea') baseNode.summary = 'New Idea';
        else if (type === 'task') { baseNode.title = 'New Task'; baseNode.status = 'todo'; }
        else if (type === 'artifact') { baseNode.name = 'New Artifact'; baseNode.uri = 'http://localhost'; }
        else if (type === 'assumption') { baseNode.premise = 'New Assumption'; baseNode.risk_level = 'medium'; }
        else if (type === 'constraint') { baseNode.rule = 'New Constraint'; baseNode.enforcement_level = 'strict'; }

        const signedMetadata = createVersion(baseNode as WorkNode);
        const finalNode: WorkNode = { ...baseNode, metadata: signedMetadata };
        const flowNode = backendToFlow(finalNode, position || { x: Math.random() * 400, y: Math.random() * 400 });

        set({ nodes: [...get().nodes, flowNode] });
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

                const updatedMetadata = createVersion(newData as WorkNode, oldData.metadata.version_hash);
                updatedNodeRecord = { ...newData, metadata: updatedMetadata } as WorkNode;
                return { ...node, data: updatedNodeRecord };
            }
            return node;
        });

        set({ nodes: updatedNodes });
        if (updatedNodeRecord) {
            await syncService.upsertNode(DEFAULT_PROJECT_ID, updatedNodeRecord);
        }
    },

    deleteNode: async (id: string) => {
        const { nodes, edges } = get();
        set({
            nodes: nodes.filter(n => n.id !== id),
            edges: edges.filter(e => e.source !== id && e.target !== id)
        });

        try {
            await syncService.archiveNode(id);
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

        // [Phase 7 Final] Use Rust Ed25519 signer for cryptographic authority
        let signatureData: { signature?: string; public_key?: string; method: 'organic' | 'cryptographic' } = {
            method: 'organic'
        };

        try {
            const signerCore = await import('signer-core');
            await signerCore.default?.(); // Initialize WASM

            const targetNode = nodes.find(n => n.id === id);
            const currentHash = computeNodeHash(targetNode?.data || {} as any);

            // Get or generate user's private key from secure storage
            const { useSettingsStore } = await import('./useSettingsStore');
            const settings = useSettingsStore.getState();
            let privateKey = (settings as any).signerPrivateKey;

            if (!privateKey) {
                // Generate new keypair if user doesn't have one
                const keypairJson = signerCore.generate_keypair();
                const keypair = JSON.parse(keypairJson);
                privateKey = keypair.private_key;
                // Store for future use (in production, this would be in secure vault)
                console.log('[AuthoritySigner] Generated new Ed25519 keypair for user');
            }

            // Sign the node hash with Ed25519
            const signResult = JSON.parse(signerCore.sign_node(currentHash, privateKey));

            if (!signResult.error) {
                signatureData = {
                    signature: signResult.signature,
                    public_key: signResult.public_key,
                    method: 'cryptographic'
                };
                console.log(`[AuthoritySigner] Node ${id} signed with Ed25519`);
            }
        } catch (err) {
            console.warn('[AuthoritySigner] Rust signer not available, using organic fallback:', err);
        }

        const updatedNodes = nodes.map(node => {
            if (node.id === id) {
                const data = { ...node.data };
                const currentHash = computeNodeHash(data);
                data.metadata = {
                    ...data.metadata,
                    human_signature: {
                        signer_id: signerId,
                        timestamp: new Date().toISOString(),
                        hash_at_signing: currentHash,
                        ...signatureData
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

    proposeNode: (node, position) => {
        const flowNode = backendToFlow(node, position || { x: Math.random() * 400, y: Math.random() * 400 });
        // Mark as draft visually in React Flow
        (flowNode as any).className = 'draft-proposal';
        set({ draftNodes: [...get().draftNodes, flowNode] });
    },

    commitDraft: async (id) => {
        const { draftNodes, nodes } = get();
        const draft = draftNodes.find(n => n.id === id);
        if (!draft) return;

        // Finalize node (sign it implicitly as accepted)
        const finalizedNode = { ...draft.data };
        finalizedNode.metadata.origin = 'human'; // Now human-approved

        set({
            nodes: [...nodes, { ...draft, data: finalizedNode, className: '' }],
            draftNodes: draftNodes.filter(n => n.id !== id)
        });

        await syncService.upsertNode(DEFAULT_PROJECT_ID, finalizedNode);
    },

    discardDraft: (id) => {
        set({ draftNodes: get().draftNodes.filter(n => n.id !== id) });
    },

    // --- MEDIATOR PROPOSAL ACTIONS ---

    addProposal: (proposal: ChangeProposal) => {
        set({ proposals: [...get().proposals, proposal] });
        if (proposal.type === 'CREATE_ARTIFACT' && proposal.content) {
            const newNode: any = {
                id: proposal.id as any,
                type: 'artifact',
                name: proposal.content.title || 'Proposed Artifact',
                metadata: {
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    origin: 'ai',
                    confidence: 0.8,
                    validated: false,
                    pin: false
                }
            };
            get().proposeNode(newNode, { x: 100, y: 100 });
        }
    },

    resolveProposal: async (id: string, decision: 'accept' | 'reject') => {
        const { proposals } = get();
        const proposal = proposals.find((p: ChangeProposal) => p.id === id);
        if (!proposal) return;

        if (decision === 'accept') {
            if (proposal.type === 'CREATE_ARTIFACT') {
                await get().commitDraft(id);
            }
        } else {
            if (proposal.type === 'CREATE_ARTIFACT') {
                get().discardDraft(id);
            }
        }

        set({ proposals: proposals.filter((p: ChangeProposal) => p.id !== id) });
    },

    // --- INTERACTIVE EDITING ACTIONS ---

    renameNode: async (id, newName) => {
        const { nodes } = get();
        let updatedNodeRecord: WorkNode | null = null;

        const updatedNodes = nodes.map(node => {
            if (node.id === id) {
                const data = { ...node.data };

                // Update the appropriate field based on node type
                if (data.type === 'note') (data as any).content = newName;
                else if (data.type === 'claim') (data as any).statement = newName;
                else if (data.type === 'decision') (data as any).rationale = newName;
                else if (data.type === 'task') (data as any).title = newName;
                else if (data.type === 'artifact') (data as any).name = newName;
                else if (data.type === 'assumption') (data as any).premise = newName;
                else if (data.type === 'constraint') (data as any).rule = newName;

                const updatedMetadata = createVersion(data, node.data.metadata.version_hash);
                updatedNodeRecord = { ...data, metadata: updatedMetadata };
                return { ...node, data: updatedNodeRecord };
            }
            return node;
        });

        set({ nodes: updatedNodes });
        if (updatedNodeRecord) {
            await syncService.upsertNode(DEFAULT_PROJECT_ID, updatedNodeRecord);
        }
    },

    addNodeComment: async (id, comment) => {
        const { nodes } = get();
        let updatedNodeRecord: WorkNode | null = null;

        const updatedNodes = nodes.map(node => {
            if (node.id === id) {
                const data = { ...node.data };
                data.metadata = {
                    ...data.metadata,
                    comment: comment
                } as any; // Allow comment extension
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

    updateEdgeRelation: async (edgeId, newRelation) => {
        const { edges } = get();
        let updatedEdgeRecord: WorkEdge | null = null;

        const updatedEdges = edges.map(edge => {
            if (edge.id === edgeId && edge.data) {
                const data = { ...edge.data };
                data.relation = newRelation as any;
                const updatedMetadata = createVersion(data as any, edge.data.metadata.version_hash);
                updatedEdgeRecord = { ...data, metadata: updatedMetadata };
                return { ...edge, data: updatedEdgeRecord };
            }
            return edge;
        });

        set({ edges: updatedEdges });
        if (updatedEdgeRecord) {
            await syncService.upsertEdge(DEFAULT_PROJECT_ID, updatedEdgeRecord);
        }
    },

    deleteEdge: async (edgeId) => {
        const { edges } = get();
        set({ edges: edges.filter(e => e.id !== edgeId) });

        try {
            await syncService.archiveEdge(edgeId);
        } catch (error) {
            console.error('Failed to archive edge:', error);
        }
    },

    setAntigravity: (active) => set({ isAntigravityActive: active }),
    toggleAntigravity: () => set({ isAntigravityActive: !get().isAntigravityActive }),

    applyForces: () => {
        const { nodes, edges, isAntigravityActive } = get();
        if (!isAntigravityActive || nodes.length === 0) return;

        const start = performance.now();

        const simulation = d3.forceSimulation(nodes as any)
            .force('link', d3.forceLink(edges).id((d: any) => d.id).distance((d: any) => {
                const relation = d.data?.relation || 'relates_to';
                if (relation === 'evidence_for') return 60;
                if (relation === 'contradicts') return 450;
                return 200;
            }).strength((d: any) => {
                const relation = d.data?.relation || 'relates_to';
                if (relation === 'evidence_for' || relation === 'validates') return 0.7;
                if (relation === 'contradicts') return 1.0;
                return 0.1;
            }))
            .force('charge', d3.forceManyBody().strength((d: any) => {
                return d.data?.metadata?.pin ? -2200 : -1100;
            }))
            .force('center', d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2))
            .force('collision', d3.forceCollide().radius(220))
            .stop();

        nodes.forEach((node: any) => {
            if (node.data?.metadata?.pin) {
                node.fx = node.position.x;
                node.fy = node.position.y;
            }
        });

        const iterations = 40;
        for (let i = 0; i < iterations; ++i) simulation.tick();

        const end = performance.now();

        const updatedNodes = nodes.map((node: any) => ({
            ...node,
            position: {
                x: isNaN(node.x) ? node.position.x : node.x,
                y: isNaN(node.y) ? node.position.y : node.y
            }
        }));

        set({
            nodes: updatedNodes,
            physicsStats: {
                latency_ms: Math.round(end - start),
                cost_usd: 0,
                iterations
            }
        });
    },
}));
