import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
import { WorkNode, WorkEdge, UserRole } from '../canon/schema/ir';
import { NodeId, EdgeId } from '../canon/schema/primitives';
import { ChangeProposal } from '../kernel/collaboration/Negotiator';
import { AlignmentReport } from '../kernel/alignment_types';
import { createVersion, computeNodeHash } from '../kernel/versioning';
import { canModifyNode, canDeleteNode } from '../kernel/guards';
import { traceSpan } from '../kernel/observability';
import { backendToFlow } from '../lib/adapters';
import { syncService } from '../lib/sync';
import { markStale } from '../kernel/digest_engine';


// Simple debounce helper to avoid external dependencies for now
const debounce = (fn: Function, ms: number) => {
    let timeoutId: any;
    return function (this: any, ...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
};

// AppNode uses the Kernel WorkNode as its internal data
export type AppNode = Node<WorkNode, string>;
export type AppEdge = Edge<WorkEdge>;

// Default project ID for now (Local-first mindset but SQL-backed)
// Project context handled dynamically

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

    // RBAC: Current User (Hito 4.1)
    currentUser: {
        id: string;
        role: UserRole;
    };

    // AI Mediator Proposals
    proposals: ChangeProposal[];
    addProposal: (proposal: ChangeProposal) => void;
    resolveProposal: (id: string, decision: 'accept' | 'reject') => Promise<void>;

    // Shadow Storage
    draftNodes: AppNode[];
    ghostNodes: AppNode[]; // Predicted nodes (Neural Shadowing)
    healProposals: ChangeProposal[]; // SAT self-healing patches

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

    logicalTension: Record<string, number>; // nodeID -> intensity (0-1)
    setLogicalTension: (tension: Record<string, number>) => void;

    // RLM Terminal (Phase 11)
    rlmThoughts: Array<{
        id: string;
        timestamp: string;
        message: string;
        type: 'info' | 'warn' | 'error' | 'success' | 'reasoning';
        agentId?: string; // Phase 14: Swarm Identity
        agentName?: string;
    }>;
    addRLMThought: (thought: Omit<GraphState['rlmThoughts'][0], 'id' | 'timestamp'>) => void;

    // Phase 15: Swarm Dashboard State
    activeAgents: Record<string, { name: string, status: 'IDLE' | 'THINKING' | 'WORKING', color: string }>;
    setAgentStatus: (agentId: string, status: 'IDLE' | 'THINKING' | 'WORKING') => void;

    // Hito 7.2: Semantic Alignment
    alignmentReport: AlignmentReport | null;
    isAlignmentComputing: boolean; // Neural Ripples status
    setAlignmentReport: (report: AlignmentReport | null) => void;
    performAlignmentCheck: (sourceBranchId: string, targetBranchId: string) => Promise<void>;
    materializeGhost: (gap: any) => Promise<void>;

    // Hito 7.9: Sync Coherence & Sensoriality
    triggerRipple: (ripple: { type: 'info' | 'warn' | 'error' | 'success', message: string, intensity: 'low' | 'medium' | 'high' }) => void;
    currentRipple: { type: 'info' | 'warn' | 'error' | 'success', message: string, intensity: 'low' | 'medium' | 'high' } | null;

    // Traffic Light Workflow State
    projectPhase: 'JAM' | 'BLUEPRINT' | 'BUILD';
    currentBlueprint?: any; // Simple storage for approved plan
    setPhase: (phase: 'JAM' | 'BLUEPRINT' | 'BUILD') => void;
    signBlueprint: (bp: any) => Promise<void>;

    // Circuit Breaker State (Hito 4.4 - Safety)
    logicError: {
        code: 'contradiction' | 'dependency_cycle' | 'security_violation' | 'system_halt';
        title: string;
        message: string;
        severity: 'critical' | 'warning';
        timestamp: string;
    } | null;
    triggerCircuitBreaker: (error: NonNullable<GraphState['logicError']>) => void;
    resolveCircuitBreaker: () => void;

    // Product Engine (Hito 4.5)
    compilePRD: (projectId: string) => Promise<any>;

    // Hito 4.1: Project Initialization
    isBooting: boolean;
    projectManifest: {
        id: string;
        name: string;
        description: string;
        roles: Record<string, UserRole>;
    } | null;
    initProjectSwarm: (name: string, description: string, roles: Record<string, UserRole>) => Promise<string>;
    openManifest: () => void;
    openWindow: (idOrConfig: any, title?: string, contentType?: any) => void;

    // Core Actions
    setNodes: (nodes: AppNode[]) => void;
    setEdges: (edges: AppEdge[]) => void;
    loadProject: (projectId: string) => Promise<void>;
    setCurrentUser: (user: GraphState['currentUser']) => void;
    voteOnNode: (nodeId: string, agentId: string, vote: 'support' | 'skeptic') => void;

    // React Flow Handlers
    // React Flow Handlers
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;
    onNodeDragStop: (event: React.MouseEvent, node: AppNode) => void;

    // Interaction
    setSelectedNode: (id: string | null) => void;
    updateNodeContent: (id: string, content: string) => void;
    addNode: (payload: WorkNode['type'] | WorkNode, position?: { x: number, y: number }) => void;
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

    // Spatial Magnetism (Phase 21)
    cursorPosition: { x: number, y: number } | null;
    setCursorPosition: (pos: { x: number, y: number } | null) => void;

    // Shadow Storage Actions
    proposeNode: (node: WorkNode, position?: { x: number, y: number }) => void;
    addGhostNode: (node: WorkNode, position?: { x: number, y: number }) => void;
    clearGhosts: () => void;
    commitDraft: (id: string) => Promise<void>;
    discardDraft: (id: string) => void;

    // --- WINDOW MANAGER STATE (Phase 22) ---
    windows: Record<string, {
        id: string,
        title: string,
        isOpen: boolean,
        zIndex: number,
        contentUrl?: string;
        contentType: 'pdf' | 'web' | 'text' | 'editor';
        nodeData?: any;
        mimeType?: string;
        textContent?: string;
    }>;
    toggleWindow: (id: string, isOpen: boolean, data?: any) => void;
    focusWindow: (id: string) => void;
    closeWindow: (id: string) => void;

    // --- AUTHORITY SIGNATURE ACTIONS (Hito 4.4) ---
    signNode: (id: string, signerId: string) => Promise<void>;
    breakSeal: (id: string) => Promise<void>;

    // --- ANTIGRAVITY ACTIONS ---
    setAntigravity: (active: boolean) => void;
    toggleAntigravity: () => void;
    applyForces: () => void;

    // Phase 12: Structural X-Ray
    isXRayActive: boolean;
    setXRayActive: (active: boolean) => void;

    // Persistance (Debounced)
    syncPositions: (providedNodes?: AppNode[]) => void;
    debouncedSyncNode: (projectId: string, node: WorkNode) => void;
    debouncedSyncEdge: (projectId: string, edge: WorkEdge) => void;

    // Optimistic UI Helpers
    optimisticUpdate: <T>(action: () => T, rollback: (snapshot: any) => void) => Promise<T>;

    // Real-Time (100% Dynamic)
    subscribeToGraph: (projectId: string) => void;
    unsubscribeFromGraph: () => void;
    currentChannel: any | null;
}

export const useGraphStore = create<GraphState>()(
    persist(
        (set, get) => ({
            nodes: [],
            edges: [],
            selectedNodeId: null,
            searchQuery: '',
            isLoading: false,
            isSyncing: false,
            currentUser: {
                id: '', // Populated by Auth
                role: 'viewer'
            },
            proposals: [],
            draftNodes: [],
            ghostNodes: [],
            healProposals: [],

            // Antigravity Initial State (Fricción Cero: On by default)
            isAntigravityActive: false,
            physicsStats: {
                latency_ms: 0,
                cost_usd: 0,
                iterations: 0
            },

            lastAuditRecord: null,
            recordAudit: (record) => set({ lastAuditRecord: record }),

            logicalTension: {},
            setLogicalTension: (tension) => set({ logicalTension: tension }),
            isXRayActive: false,
            setXRayActive: (active) => set({ isXRayActive: active }),

            cursorPosition: null,
            setCursorPosition: (pos) => set({ cursorPosition: pos }),

            windows: {},
            toggleWindow: (id, isOpen, data) => set((state) => {
                const existing = state.windows[id];
                const now = existing || data || {};
                return {
                    windows: {
                        ...state.windows,
                        [id]: {
                            id,
                            title: now.title || 'System Window',
                            isOpen,
                            zIndex: isOpen ? Math.max(...Object.values(state.windows).map(w => w.zIndex), 0) + 1 : 0,
                            contentType: now.contentType || 'text',
                            contentUrl: now.contentUrl,
                            nodeData: now.nodeData,
                            mimeType: now.mimeType,
                            textContent: now.textContent
                        }
                    }
                };
            }),
            focusWindow: (id) => set((state) => {
                const existing = state.windows[id];
                if (!existing) return state;
                return {
                    windows: {
                        ...state.windows,
                        [id]: { ...existing, zIndex: Math.max(...Object.values(state.windows).map(w => w.zIndex), 0) + 1 }
                    }
                };
            }),
            closeWindow: (id) => set((state) => {
                const { [id]: closed, ...remaining } = state.windows;
                return { windows: remaining };
            }),
            openWindow: (idOrConfig, title, contentType) => {
                const { toggleWindow } = get();
                if (typeof idOrConfig === 'object') {
                    const { id, ...data } = idOrConfig;
                    toggleWindow(id, true, data);
                } else {
                    toggleWindow(idOrConfig, true, { title, contentType });
                }
            },

            rlmThoughts: [],
            addRLMThought: (thought) => set((state) => ({
                rlmThoughts: [
                    ...state.rlmThoughts,
                    {
                        ...thought,
                        id: uuidv4(),
                        timestamp: new Date().toISOString()
                    }
                ].slice(-50) // Keep only last 50 thoughts
            })),

            activeAgents: {
                'harvester': { name: 'Axiom Harvester', status: 'IDLE', color: '#fbbf24' },
                'builder': { name: 'Graph Architect', status: 'IDLE', color: '#22d3ee' },
                'critic': { name: 'Logical Auditor', status: 'IDLE', color: '#f87171' },
                'validator': { name: 'Evidence Sentry', status: 'IDLE', color: '#c084fc' },
                'librarian': { name: 'Canon Librarian', status: 'IDLE', color: '#4ade80' }
            },
            setAgentStatus: (agentId, status) => set((state) => {
                const agent = state.activeAgents[agentId];
                if (!agent) return state;
                return {
                    activeAgents: {
                        ...state.activeAgents,
                        [agentId]: { ...agent, status }
                    }
                };
            }),

            alignmentReport: null,
            isAlignmentComputing: false,
            currentRipple: null,
            isBooting: false,
            projectManifest: null,
            setAlignmentReport: (report) => set({ alignmentReport: report }),

            projectPhase: 'JAM', // Default start
            currentBlueprint: null,
            setPhase: (phase) => set({ projectPhase: phase }),
            signBlueprint: async (bp) => {
                const { addRLMThought, currentUser } = get();

                // 1. Log the Authority Signature
                addRLMThought({
                    message: `AUTHORITY_SIGNATURE: Blueprint aprobado por ${currentUser.id} (Rol: ${currentUser.role}). Desbloqueando modo BUILD.`,
                    type: 'success'
                });

                // 2. Persist State
                // await syncService.updateProjectPhase(projectId, 'BUILD');

                set({
                    projectPhase: 'BUILD',
                    currentBlueprint: bp
                });
            },

            logicError: null,
            triggerCircuitBreaker: (error) => set({ logicError: error }),
            resolveCircuitBreaker: () => set({ logicError: null }),

            compilePRD: async (projectId: string) => {
                // Dynamic import to avoid circular dependencies if any
                const { compilePRD } = await import('../kernel/product_engine');
                const prd = await compilePRD(projectId);

                // Log generation
                get().addRLMThought({
                    message: `PRODUCT_ENGINE: Documento '${prd.title}' compilado con ${prd.metadata.node_count} nodos.`,
                    type: 'success'
                });

                // Open as window (Phase 22)
                get().openWindow({
                    id: `prd-${Date.now()}`,
                    title: prd.title,
                    contentType: 'text',
                    textContent: prd.markdown,
                    mimeType: 'text/markdown'
                });

                return prd;
            },

            triggerRipple: (ripple) => {
                set({ currentRipple: ripple });
                // Auto-clear after duration based on intensity
                const duration = ripple.intensity === 'high' ? 5000 : 3000;
                setTimeout(() => {
                    if (get().currentRipple === ripple) set({ currentRipple: null });
                }, duration);
            },

            // [Hito 4.1] Open Manifest if uninitialized
            openManifest: () => {
                const { openWindow, projectManifest } = get();
                if (!projectManifest) {
                    openWindow('project-manifest', 'Gate 8: Project Manifest', 'manifest');
                }
            },
            performAlignmentCheck: async (sourceBranchId, targetBranchId) => {
                set({ isAlignmentComputing: true });
                try {
                    // Dynamic import to avoid circular dependencies
                    const alignmentEngine = await import('../kernel/alignment_engine');
                    const report = await alignmentEngine.checkCrossBranchAlignment(sourceBranchId, targetBranchId);
                    set({ alignmentReport: report, isAlignmentComputing: false });

                    // [Phase 15 Swarm] Update agents to show they've finished audit
                    set((state) => ({
                        activeAgents: {
                            ...state.activeAgents,
                            'validator-01': { ...state.activeAgents['validator-01']!, status: 'IDLE' }
                        }
                    }));
                } catch (error) {
                    console.error('[GraphStore] Alignment check failed:', error);
                    set({ isAlignmentComputing: false });
                }
            },

            materializeGhost: async (gap) => {
                const { addNode, setAlignmentReport, alignmentReport, addRLMThought } = get();

                addRLMThought({ message: `GHOST_MATERIALIZATION: Firmando y validando nodo inferred: '${gap.missingConcept.slice(0, 30)}...'`, type: 'success' });

                await addNode({
                    type: 'decision', // Default for healing
                    statement: gap.missingConcept,
                    metadata: {
                        origin: 'ai',
                        confidence: 1.0,
                        validated: true, // Auto-validated upon materialization
                        pin: false,
                        tags: ['alignment-v7.8', 'sovereign-materialization'],
                        forensic_id: `trace-${uuidv4().slice(0, 8)}`,
                        human_signature: {
                            signer: 'Sovereign_OS_Auth',
                            timestamp: new Date().toISOString(),
                            public_key: 'PENDING_ON_CHAIN_GENERATION' // Placeholder for future crypto-bridge
                        }
                    }
                } as any);

                if (alignmentReport) {
                    setAlignmentReport({
                        ...alignmentReport,
                        gaps: alignmentReport.gaps.filter((g: any) => g.sourceNodeId !== gap.sourceNodeId)
                    });
                }
            },

            setNodes: (nodes) => {
                set({ nodes });
                get().syncPositions();
            },
            setEdges: (edges) => set({ edges }),
            setSearchQuery: (searchQuery) => set({ searchQuery }),
            setCurrentUser: (currentUser) => set({ currentUser }),

            // Debounced position sync (Hito 7.9)
            // Prevents network saturation during Antigravity physics ticks (16ms)
            syncPositions: debounce(async (providedNodes?: AppNode[]) => {
                const { nodes, projectManifest } = get();
                const nodesToSync = providedNodes || nodes;
                if (nodesToSync.length === 0) return;

                const projectId = projectManifest ? (projectManifest as any).id : null;
                if (!projectId) return;

                // Update WorkNode metadata with current positions
                const workNodes = nodesToSync.map(n => {
                    const data = { ...n.data };
                    data.metadata = {
                        ...data.metadata,
                        spatial: { x: n.position.x, y: n.position.y }
                    };
                    return data;
                });

                try {
                    await syncService.syncAll(projectId, workNodes, []);
                } catch (error) {
                    console.error('[Store] Debounced position sync failed:', error);
                }
            }, 2000),


            // Debounced Node Sync (Hito 7.9)
            debouncedSyncNode: debounce(async (projectId: string, node: WorkNode) => {
                try {
                    await syncService.upsertNode(projectId, node);
                } catch (error) {
                    console.error('[Store] Debounced node sync failed:', error);
                }
            }, 1000),

            // Debounced Edge Sync (Hito 7.9)
            debouncedSyncEdge: debounce(async (projectId: string, edge: WorkEdge) => {
                try {
                    await syncService.upsertEdge(projectId, edge);
                } catch (error) {
                    console.error('[Store] Debounced edge sync failed:', error);
                }
            }, 1000),


            voteOnNode: (nodeId, agentId, vote) => set((state) => {
                const updatedGhostNodes = state.ghostNodes.map(node => {
                    if (node.id === nodeId) {
                        const nodeData = node.data;
                        const metadata = nodeData.metadata;
                        const consensus = metadata.consensus || { support_count: 0, skeptics_count: 0, voters: [] };

                        if (consensus.voters.includes(agentId)) return node;

                        const newConsensus = {
                            ...consensus,
                            voters: [...consensus.voters, agentId],
                            support_count: vote === 'support' ? consensus.support_count + 1 : consensus.support_count,
                            skeptics_count: vote === 'skeptic' ? consensus.skeptics_count + 1 : consensus.skeptics_count,
                        };

                        return { ...node, data: { ...nodeData, metadata: { ...metadata, consensus: newConsensus } } };
                    }
                    return node;
                });

                return { ghostNodes: updatedGhostNodes };
            }),

            loadProject: async (projectId) => {
                return traceSpan('store.load_project', { projectId }, async () => {
                    set({ isLoading: true });
                    try {
                        // [Hito 4.1] Setup context before hydration
                        set({ projectManifest: { id: projectId, name: 'Loading...', description: '', roles: {} } as any });

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
                });
            },

            initProjectSwarm: async (name, description, roles) => {
                return traceSpan('store.init_project_swarm', { name }, async () => {
                    set({ isBooting: true, projectManifest: { id: 'pending', name, description, roles } });
                    const { addRLMThought, currentUser } = get();

                    addRLMThought({ message: `BOOT_SEQUENCE: Iniciando enjambre para '${name}'...`, type: 'info' });

                    try {
                        // [Phase 11] Trigger RLM Scaffolding
                        addRLMThought({ message: "RLM_COMPILER: Analizando intención semántica...", type: 'reasoning' });

                        // [Hito 7.9] Orchestrating RLM Dispatcher and SAT consistency
                        // const { RLMDispatcher } = await import('../kernel/RLMDispatcher'); // Future

                        // PERSISTENCE LAYER: Save to Supabase
                        // Use current user (auth required)
                        const ownerId = currentUser.id;
                        if (!ownerId) throw new Error('AUTHORIZATION_REQUIRED: Debes iniciar sesión.');

                        const project = await syncService.createProject(name, description, ownerId);

                        addRLMThought({ message: `BOOT_COMPLETE: Proyecto '${name}' nacido en el Canon (ID: ${project.id}).`, type: 'success' });
                        set({ isBooting: false, projectManifest: { id: project.id, name, description, roles } });

                        return project.id; // Return for navigation
                    } catch (error) {
                        console.error('[GraphStore] Swarm Boot Error:', error);
                        set({ isBooting: false });
                        throw error;
                    }
                });
            },

            centerNode: (id) => set({ selectedNodeId: id }),

            onNodesChange: (changes) => {
                // [Observability Protection] Removed traceSpan here to avoid Log Spam on drag.
                // We only trace atomic actions like 'addNode' or 'onNodeDragStop'.
                const { nodes } = get();
                const filteredChanges = changes.filter(c => c.type !== 'position');

                if (filteredChanges.length > 0) {
                    const updatedNodes = applyNodeChanges(filteredChanges, nodes) as AppNode[];
                    set({ nodes: updatedNodes });
                }
            },

            onEdgesChange: (changes) => {
                // [Observability Protection] Removed traceSpan here.
                set({
                    edges: applyEdgeChanges(changes, get().edges) as AppEdge[],
                });
            },

            onConnect: async (params) => {
                const { edges } = get();
                const { source, target } = params;
                if (!source || !target) return;

                try {
                    const newWorkEdge: WorkEdge = {
                        id: uuidv4() as EdgeId,
                        source: source as NodeId,
                        target: target as NodeId,
                        relation: 'relates_to',
                        metadata: {
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            version_hash: uuidv4(),
                            origin: 'human',
                            confidence: 1.0,
                            validated: false,
                            pin: false,
                            access_control: {
                                role_required: 'editor',
                                owner_id: get().currentUser.id
                            }
                        }
                    };

                    // React Flow UI update
                    const newEdge: AppEdge = {
                        id: newWorkEdge.id,
                        source: newWorkEdge.source,
                        target: newWorkEdge.target,
                        data: newWorkEdge,
                    };

                    set({
                        edges: addEdge(newEdge, edges) as AppEdge[],
                    });

                    const projectId = get().projectManifest ? (get().projectManifest as any).id : null;
                    if (projectId) {
                        await syncService.upsertEdge(projectId, newWorkEdge);
                    }

                } catch (err) {
                    console.error('[SyncGuardian] Edge creation rejected:', err);
                }
            },

            onNodeDragStop: (_event, node) => {
                traceSpan('store.on_node_drag_stop', { nodeId: node.id, x: node.position.x, y: node.position.y }, async () => {
                    // [Performance] Transient Update Commit
                    // React Flow handles the drag visually (uncontrolled or local state).
                    // We only commit to the global store and DB when the drag ends.
                    const { nodes, syncPositions } = get();

                    // 1. Update Global Store (so other components like minimap reflect new position)
                    const updatedNodes = nodes.map(n =>
                        n.id === node.id ? { ...n, position: node.position } : n
                    );
                    set({ nodes: updatedNodes });

                    // 2. Trigger Sync to DB
                    syncPositions(updatedNodes);
                });
            },

            setSelectedNode: (id) => set({ selectedNodeId: id }),

            updateNodeContent: async (id, content) => {
                return traceSpan('store.update_node_content', { nodeId: id }, async () => {
                    const { nodes, currentUser } = get();
                    let updatedNodeRecord: WorkNode | null = null;

                    const updatedNodes = nodes.map((node) => {
                        if (node.id === id) {
                            // [RBAC] Guard check
                            if (!canModifyNode(node.data, currentUser.role, currentUser.id)) {
                                return node;
                            }

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

                    // [Hito 7.9] SyncGuardian Audit
                    try {
                        const { SyncGuardian } = await import('../kernel/SyncGuardian');
                        await SyncGuardian.handleMutation(id, { statement: content, content: content });

                        set({ nodes: updatedNodes });
                        if (updatedNodeRecord) {
                            const projectId = get().projectManifest ? (get().projectManifest as any).id : null;
                            if (projectId) {
                                get().debouncedSyncNode(projectId, updatedNodeRecord);
                                markStale(projectId).catch(e => console.error("[Store] markStale failed:", e));
                            }
                        }
                    } catch (err) {
                        console.error('[SyncGuardian] Mutation rejected:', err);
                    }
                });
            },

            addNode: async (payload, position) => {
                return traceSpan('store.add_node', { type: typeof payload === 'object' ? payload.type : payload }, async () => {
                    const isFullNode = typeof payload === 'object';
                    const type = isFullNode ? payload.type : payload;

                    const id = isFullNode ? payload.id : uuidv4() as NodeId;
                    const now = new Date().toISOString();
                    const baseNode: any = isFullNode ? { ...payload } : {
                        id,
                        type,
                        metadata: {
                            created_at: now,
                            updated_at: now,
                            origin: 'human',
                            version_hash: '' as any,
                            confidence: 1.0,
                            validated: false,
                            pin: false,
                            access_control: {
                                role_required: 'editor',
                                owner_id: get().currentUser.id
                            }
                        }
                    };

                    if (!isFullNode) {
                        if (type === 'note') baseNode.content = 'New Note';
                        else if (type === 'claim') baseNode.statement = 'New Claim';
                        else if (type === 'evidence') baseNode.content = 'New Evidence';
                        else if (type === 'decision') { baseNode.rationale = 'New Decision'; baseNode.chosen_option = ''; }
                        else if (type === 'idea') baseNode.summary = 'New Idea';
                        else if (type === 'task') { baseNode.title = 'New Task'; baseNode.status = 'todo'; }
                        else if (type === 'artifact') { baseNode.name = 'New Artifact'; baseNode.uri = ''; }
                        else if (type === 'assumption') { baseNode.premise = 'New Assumption'; baseNode.risk_level = 'medium'; }
                        else if (type === 'constraint') { baseNode.rule = 'New Constraint'; baseNode.enforcement_level = 'strict'; }
                    }

                    const signedMetadata = isFullNode ? baseNode.metadata : createVersion(baseNode as WorkNode);
                    const finalNode: WorkNode = { ...baseNode, metadata: signedMetadata };
                    const flowNode = backendToFlow(finalNode, position || { x: Math.random() * 400, y: Math.random() * 400 });

                    set({ nodes: [...get().nodes, flowNode] });
                    const projectId = get().projectManifest ? (get().projectManifest as any).id : null;
                    if (projectId) {
                        await syncService.upsertNode(projectId, finalNode);
                        markStale(projectId).catch(e => console.error("[Store] markStale failed:", e));
                    }
                });
            },

            mutateNodeType: async (id, newType) => {
                const { nodes, projectManifest, triggerRipple } = get();
                const originalNodes = [...nodes];
                let updatedNodeRecord: WorkNode | null = null;

                const updatedNodes = nodes.map((node) => {
                    if (node.id === id) {
                        const oldData = node.data;
                        const newData: any = {
                            id: oldData.id,
                            type: newType,
                            metadata: { ...oldData.metadata }
                        };

                        const oldContent = (oldData as any).content || (oldData as any).statement || (oldData as any).rationale || (oldData as any).summary || (oldData as any).description || (oldData as any).details || (oldData as any).name || (oldData as any).premise || (oldData as any).rule || '';

                        if (newType === 'note') newData.content = oldContent;
                        else if (newType === 'claim') { newData.statement = oldContent; newData.verification_status = 'pending'; }
                        else if (newType === 'evidence') newData.content = oldContent;
                        else if (newType === 'decision') { newData.rationale = oldContent; newData.chosen_option = ''; }
                        else if (newType === 'idea') newData.summary = oldContent;
                        else if (newType === 'task') { newData.title = 'Mutated Task'; newData.description = oldContent; newData.status = 'todo'; }
                        else if (newType === 'artifact') { newData.name = oldContent; newData.uri = ''; }
                        else if (newType === 'assumption') { newData.premise = oldContent; newData.risk_level = 'medium'; }
                        else if (newType === 'constraint') { newData.rule = oldContent; newData.enforcement_level = 'strict'; }
                        else if (newType === 'source') { newData.citation = oldContent; }

                        // Optimistic Versioning (Calculated locally)
                        const updatedMetadata = createVersion(newData as WorkNode, oldData.metadata.version_hash);
                        updatedNodeRecord = { ...newData, metadata: updatedMetadata } as WorkNode;
                        return { ...node, data: updatedNodeRecord };
                    }
                    return node;
                });

                // 1. Optimistic Update
                set({ nodes: updatedNodes });

                // 2. Background Verification & Persistence
                try {
                    const { SyncGuardian } = await import('../kernel/SyncGuardian');
                    await SyncGuardian.handleMutation(id, { type: newType });

                    if (updatedNodeRecord) {
                        const projectId = projectManifest?.id;
                        if (projectId) {
                            get().debouncedSyncNode(projectId, updatedNodeRecord);
                            markStale(projectId).catch(e => console.error("[Store] markStale failed:", e));
                        }
                    }
                } catch (err: any) {
                    console.warn('[Optimistic UI] Rollback:', err.message);
                    set({ nodes: originalNodes });
                    triggerRipple({ type: 'error', message: `Rechazado: ${err.message}`, intensity: 'medium' });
                }
            },

            optimisticUpdate: async (action, rollback) => {
                const snapshot = { nodes: [...get().nodes], edges: [...get().edges] };
                try {
                    return await action();
                } catch (err) {
                    rollback(snapshot);
                    throw err;
                }
            },

            deleteNode: async (id: string) => {
                return traceSpan('store.delete_node', { nodeId: id }, async () => {
                    const { nodes, edges, currentUser } = get();
                    const targetNode = nodes.find(n => n.id === id);

                    if (targetNode && !canDeleteNode(targetNode.data, { nodes: {}, edges: Object.fromEntries(edges.map(e => [e.id, e.data])) } as any, currentUser.role, currentUser.id)) {
                        return;
                    }

                    set({
                        nodes: nodes.filter(n => n.id !== id),
                        edges: edges.filter(e => e.source !== id && e.target !== id)
                    });

                    const projectId = get().projectManifest?.id;
                    if (projectId) {
                        markStale(projectId).catch(e => console.error("[Store] markStale failed:", e));
                    }

                    try {
                        await syncService.archiveNode(id);
                        const edgesToArchive = edges
                            .filter(e => e.source === id || e.target === id)
                            .map(e => e.id);

                        if (edgesToArchive.length > 0) {
                            await syncService.archiveEdges(edgesToArchive);
                        }
                    } catch (error) {
                        console.error('Failed to archive node/edges:', error);
                    }
                });
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
                    const projectId = get().projectManifest?.id;
                    if (projectId) {
                        get().debouncedSyncNode(projectId, updatedNodeRecord);
                    }
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
                    const projectId = get().projectManifest?.id;
                    if (projectId) {
                        get().debouncedSyncNode(projectId, updatedNodeRecord);
                    }
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

                const projectId = get().projectManifest?.id;
                if (projectId) {
                    await syncService.upsertNode(projectId, finalizedNode);
                }
            },

            discardDraft: (id) => {
                set({ draftNodes: get().draftNodes.filter(n => n.id !== id) });
            },

            addGhostNode: (node, position) => {
                const flowNode = backendToFlow(node, position || { x: Math.random() * 400, y: Math.random() * 400 });
                (flowNode as any).className = 'ghost-predicted';
                set({ ghostNodes: [...get().ghostNodes, flowNode] });
            },

            clearGhosts: () => set({ ghostNodes: [] }),

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

                        if (!data.metadata.access_control) {
                            data.metadata.access_control = {
                                role_required: 'editor',
                                owner_id: get().currentUser.id
                            };
                        }

                        const updatedMetadata = createVersion(data, node.data.metadata.version_hash);
                        updatedNodeRecord = { ...data, metadata: updatedMetadata };
                        return { ...node, data: updatedNodeRecord };
                    }
                    return node;
                });

                set({ nodes: updatedNodes });
                if (updatedNodeRecord) {
                    const projectId = get().projectManifest?.id;
                    if (projectId) {
                        get().debouncedSyncNode(projectId, updatedNodeRecord);
                    }
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
                    const projectId = get().projectManifest?.id;
                    if (projectId) {
                        get().debouncedSyncNode(projectId, updatedNodeRecord);
                    }
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
                    const projectId = get().projectManifest?.id;
                    if (projectId) {
                        get().debouncedSyncEdge(projectId, updatedEdgeRecord);
                    }
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

            currentChannel: null,

            subscribeToGraph: (projectId) => {
                const { unsubscribeFromGraph } = get();
                unsubscribeFromGraph(); // Clean up existing

                console.log(`[RealTime] Suscribiendo al proyecto: ${projectId}`);
                const { supabase } = require('../lib/supabase');

                const channel = supabase
                    .channel(`project_graph_${projectId}`)
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'work_nodes',
                        filter: `project_id=eq.${projectId}`
                    }, (payload: any) => {
                        const { nodes, setNodes } = get();

                        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                            const row = payload.new;
                            if (row.deleted_at) {
                                set({ nodes: nodes.filter(n => n.id !== row.id) });
                                return;
                            }

                            // Reconstruct WorkNode (Flatenning content)
                            const node: WorkNode = {
                                id: row.id,
                                type: row.type,
                                metadata: {
                                    created_at: row.created_at,
                                    updated_at: row.updated_at,
                                    version_hash: row.current_version_hash,
                                    origin: row.origin,
                                    confidence: row.confidence,
                                    pin: row.is_pinned,
                                    validated: row.is_validated,
                                    ...row.metadata
                                },
                                ...row.content
                            } as WorkNode;

                            const flowNode = backendToFlow(node);

                            if (payload.eventType === 'INSERT') {
                                // Check if already exists (optimistic update might have added it)
                                if (!nodes.find(n => n.id === flowNode.id)) {
                                    set({ nodes: [...nodes, flowNode] });
                                }
                            } else {
                                set({ nodes: nodes.map(n => n.id === flowNode.id ? { ...flowNode, position: n.position } : n) });
                            }
                        } else if (payload.eventType === 'DELETE') {
                            set({ nodes: nodes.filter(n => n.id !== payload.old.id) });
                        }
                    })
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'work_edges',
                        filter: `project_id=eq.${projectId}`
                    }, (payload: any) => {
                        const { edges } = get();

                        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                            const row = payload.new;
                            if (row.deleted_at) {
                                set({ edges: edges.filter(e => e.id !== row.id) });
                                return;
                            }

                            const edge: AppEdge = {
                                id: row.id,
                                source: row.source_node_id,
                                target: row.target_node_id,
                                data: {
                                    id: row.id,
                                    source: row.source_node_id,
                                    target: row.target_node_id,
                                    relation: row.relation,
                                    metadata: row.metadata
                                } as any
                            };

                            if (payload.eventType === 'INSERT') {
                                if (!edges.find(e => e.id === edge.id)) {
                                    set({ edges: [...edges, edge] });
                                }
                            } else {
                                set({ edges: edges.map(e => e.id === edge.id ? edge : e) });
                            }
                        } else if (payload.eventType === 'DELETE') {
                            set({ edges: edges.filter(e => e.id !== payload.old.id) });
                        }
                    })
                    .subscribe();

                set({ currentChannel: channel });
            },

            unsubscribeFromGraph: () => {
                const { currentChannel } = get();
                if (currentChannel) {
                    const { supabase } = require('../lib/supabase');
                    supabase.removeChannel(currentChannel);
                    set({ currentChannel: null });
                }
            },

            applyForces: () => {
                // [DEPRECATED] Physics moved to Web Worker (physics.worker.ts)
            },
        }),
        {
            name: 'workgraph-storage',
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                projectManifest: state.projectManifest,
                currentUser: state.currentUser,
            }),
        }
    )
);
