'use client';
import React, { useEffect, useCallback } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    Panel,
    useReactFlow,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGraphStore } from '../../store/useGraphStore';
import { useAntigravityEngine } from '../../hooks/useAntigravityEngine';
import { backendToFlow } from '../../lib/adapters';
import { NodeId } from '../../canon/schema/primitives';
import { WorkNode } from '../../canon/schema/ir';
import { Plus, Search, Filter, Wind, ShieldCheck, Eye } from 'lucide-react';
import { useXRayMode } from '../../hooks/useXRayMode';
import { WorkNodeComponent } from './WorkNode';
import { AlignmentOverlay } from './AlignmentOverlay';
import { AlignmentTunnels } from './AlignmentTunnels';
import { WindowManager } from '../ui/WindowManager';
import { IngestionHUD } from '../ui/IngestionHUD';
import { SensoryRipple } from './SensoryRipple';
import { BootSequence } from './BootSequence';
import { ForensicAuditView } from './ForensicAuditView';

const nodeTypes = {
    note: WorkNodeComponent,
    claim: WorkNodeComponent,
    evidence: WorkNodeComponent,
    decision: WorkNodeComponent,
    idea: WorkNodeComponent,
    task: WorkNodeComponent,
    artifact: WorkNodeComponent,
    assumption: WorkNodeComponent,
    constraint: WorkNodeComponent,
    source: WorkNodeComponent,
};

function GraphContent() {
    const zustandNodes = useGraphStore(state => state.nodes);
    const isBooting = useGraphStore(state => state.isBooting);
    const subscribeToGraph = useGraphStore(state => state.subscribeToGraph);
    const unsubscribeFromGraph = useGraphStore(state => state.unsubscribeFromGraph);
    const projectManifest = useGraphStore(state => state.projectManifest);
    const projectId = projectManifest?.id;

    // Real-Time (100% Dynamic) Synchronization
    useEffect(() => {
        if (projectId && projectId !== 'pending') {
            subscribeToGraph(projectId);
        }
        return () => unsubscribeFromGraph();
    }, [projectId, subscribeToGraph, unsubscribeFromGraph]);

    const zustandEdges = useGraphStore(state => state.edges);
    const globalOnNodesChange = useGraphStore(state => state.onNodesChange);
    const globalOnEdgesChange = useGraphStore(state => state.onEdgesChange);

    // [Optimization] Use local state for visual changes (positions, selections)
    // to avoid triggering expensive global state re-renders on every mouse move.
    const [nodes, setNodes, onNodesChange] = useNodesState(zustandNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(zustandEdges);

    const onConnect = useGraphStore(state => state.onConnect);
    const openManifest = useGraphStore(state => state.openManifest);

    // [Performance] Smart Merge:
    // We use a Ref to track if we are currently dragging to avoid re-renders impacting interaction.
    // Ideally, we only update nodes that CHANGED in the store, and we DON'T touch nodes that are
    // currently being dragged by the user (local override).

    // ReactFlow nodes have internal 'dragging' state but it's hard to access inside useEffect 
    // without the latest local state.

    useEffect(() => {
        setNodes((localNodes) => {
            // optimized: if lengths differ, or deep content changed. 
            // Simple approach: Map by ID.
            const localMap = new Map(localNodes.map(n => [n.id, n]));

            return zustandNodes.map(zNode => {
                const localNode = localMap.get(zNode.id);

                // If local node exists and is being dragged (or selected), 
                // we might want to preserve its 'position' from local state 
                // to prevent "snap back" during async updates.
                if (localNode && (localNode.dragging || localNode.selected)) {
                    return {
                        ...zNode,
                        position: localNode.position, // Keep local position
                        positionAbsolute: localNode.positionAbsolute,
                        selected: localNode.selected ?? false,
                        dragging: localNode.dragging ?? false
                    };
                }
                return zNode;
            });
        });
    }, [zustandNodes, setNodes]);

    useEffect(() => {
        setEdges(zustandEdges); // Edges are less interactive, safe to sync
    }, [zustandEdges, setEdges]);

    useEffect(() => {
        openManifest();
    }, [openManifest]);

    // Update global store on drag stop to persist final position
    const onNodeDragStop = useCallback((_: any, node: any) => {
        const { syncPositions } = useGraphStore.getState();
        syncPositions([node]); // Sync single node position
    }, []);

    const setSelectedNode = useGraphStore(state => state.setSelectedNode);
    const addNode = useGraphStore(state => state.addNode);
    const toggleWindow = useGraphStore(state => state.toggleWindow);
    const isAntigravityActive = useGraphStore(state => state.isAntigravityActive);
    const toggleAntigravity = useGraphStore(state => state.toggleAntigravity);
    const draftNodes = useGraphStore(state => state.draftNodes);
    const ghostNodes = useGraphStore(state => state.ghostNodes);
    const isXRayActive = useXRayMode((state) => state.isXRayActive);
    const setXRayActive = useGraphStore(state => state.setXRayActive);
    const clearGhosts = useGraphStore(state => state.clearGhosts);

    const { screenToFlowPosition, fitView } = useReactFlow();
    const setCursorPosition = useGraphStore(state => state.setCursorPosition);

    const onPaneMouseMove = useCallback((event: React.MouseEvent) => {
        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });
        setCursorPosition(position);
    }, [setCursorPosition, screenToFlowPosition]);

    const onPaneMouseLeave = useCallback(() => {
        setCursorPosition(null);
    }, [setCursorPosition]);

    // Alt-key X-Ray State
    const [isXRayMode, setIsXRayMode] = React.useState(false);

    // Start the Antigravity Physics Engine Hook
    useAntigravityEngine();

    // Key Listeners for X-Ray mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Alt') setXRayActive(true); };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Alt') setXRayActive(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [setXRayActive]);

    // Initialize with dummy node if empty
    useEffect(() => {
        if (nodes.length === 0) {
            const dummyNode: WorkNode = {
                id: '550e8400-e29b-41d4-a716-446655440000' as NodeId,
                type: 'note',
                content: 'Welcome to WorkGraph. Double click to add nodes or use the + button.',
                metadata: {
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    version_hash: '0000000000000000000000000000000000000000000000000000000000000000',
                    origin: 'human',
                    confidence: 1.0,
                    validated: true,
                    pin: true,
                    access_control: {
                        role_required: 'viewer',
                        owner_id: 'system'
                    }
                }
            };
            setNodes([backendToFlow(dummyNode)]);
        }
    }, [nodes.length, setNodes]);

    const onPaneClick = useCallback((event: React.MouseEvent) => {
        if (event.detail === 2) {
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            addNode('note', { x: position.x - 100, y: position.y - 20 });
        }
    }, [addNode, screenToFlowPosition]);

    const handleNodeClick = useCallback((_: any, node: any) => {
        setSelectedNode(node.id);

        // Find context nodes for cinematic flight (Decisions show supporters/contradictors)
        const contextNodeIds = new Set([node.id]);
        if (node.data?.type === 'decision' || node.data?.type === 'claim') {
            zustandEdges.forEach(edge => {
                if (edge.source === node.id || edge.target === node.id) {
                    contextNodeIds.add(edge.source);
                    contextNodeIds.add(edge.target);
                }
            });
        }

        // Cinematic Flight Mode: Voyage to context group
        fitView({
            nodes: nodes.filter((n: any) => contextNodeIds.has(n.id)),
            duration: 800,
            padding: 0.5
        });

        toggleWindow(node.id, true, {
            id: node.id,
            title: `${(node.data as any).label || (node.data as any).content?.slice(0, 30) || 'Untitled'}`,
            contentType: 'editor',
            nodeData: node,
            contentUrl: `/editor?nodeId=${node.id}`
        });
    }, [setSelectedNode, toggleWindow, fitView, nodes, edges]);

    const allNodesComp = React.useMemo(() => {
        // [X-Ray Mode] Logic
        // If active, we show Ghost Nodes (predicted) and potentially Structure Wrappers
        if (useXRayMode.getState().isXRayActive) {
            return [...nodes, ...draftNodes, ...ghostNodes];
        }
        // Default: Only real nodes and drafts
        return [...nodes, ...draftNodes];
    }, [nodes, draftNodes, ghostNodes, useXRayMode.getState().isXRayActive]);

    const flowEdges: Edge[] = edges.map(e => {
        const isXRay = useXRayMode.getState().isXRayActive;
        const isContradiction = e.data?.relation === 'contradicts';
        const isEvidence = e.data?.relation === 'evidence_for';

        // [X-Ray Mode] Reveal structural/hidden edges
        const isHidden = !isXRay && (e.data?.relation === 'part_of' || e.data?.relation === 'relates_to');

        const style: React.CSSProperties = isContradiction
            ? { stroke: '#ef4444', strokeWidth: 3, filter: 'drop-shadow(0 0 5px #ef4444)' }
            : isEvidence
                ? { stroke: '#10b981', strokeWidth: 2 }
                : { stroke: isHidden ? '#cbd5e1' : '#94a3b8', strokeWidth: isHidden ? 1 : 1.5, strokeDasharray: isHidden ? '4 4' : '0' };

        return {
            ...e,
            hidden: isHidden && !isXRay,
            animated: isContradiction || (isXRay && e.data?.relation === 'relates_to'), // Animate structural flow in X-Ray
            style,
            opacity: isHidden ? 0.5 : 1
        };
    });

    return (
        <ReactFlow
            nodes={allNodesComp}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={onPaneClick}
            onPaneMouseMove={onPaneMouseMove}
            onPaneMouseLeave={onPaneMouseLeave}
            onMove={(_, viewport) => {
                // Serious Engineering: Auto-LOD (Level of Detail)
                if (viewport.zoom < 0.6) {
                    document.body.classList.add('low-power-mode');
                } else {
                    document.body.classList.remove('low-power-mode');
                }
            }}
            zoomOnDoubleClick={false}
            fitView
            className="transition-all duration-500 bg-white"
            proOptions={{ hideAttribution: true }}
        >
            {/* Super subtle background - pure white feeling */}
            <Background color="#f8fafc" variant={"dots" as any} gap={40} size={1} />

            {/* Simple Navigation Island */}
            <Panel position="bottom-center" className="!mb-10">
                <div className="flex items-center gap-4 px-6 py-3 bg-white border border-slate-200 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] pointer-events-auto">
                    <button
                        onClick={() => addNode('note')}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-500 text-white font-bold text-sm transition-all hover:bg-blue-600 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        <span>Nueva Idea</span>
                    </button>

                    <div className="w-px h-8 bg-slate-100 mx-2" />

                    <button
                        onClick={toggleAntigravity}
                        className={`p-3 rounded-full transition-all duration-300 ${isAntigravityActive ? 'bg-blue-50 text-blue-500' : 'hover:bg-slate-50 text-slate-400'}`}
                        title="Fuerza Gravitacional"
                    >
                        <Wind size={22} className={isAntigravityActive ? 'animate-pulse' : ''} />
                    </button>

                    <button
                        onClick={() => useXRayMode.getState().toggleXRay()}
                        className={`p-3 rounded-full transition-all ${useXRayMode.getState().isXRayActive ? 'bg-blue-50 text-blue-500' : 'hover:bg-slate-50 text-slate-400'}`}
                        title="Ver Detalles"
                    >
                        <Eye size={22} />
                    </button>
                </div>
            </Panel>

            <AlignmentOverlay />
            <AlignmentTunnels />
            <BootSequence />
            <SensoryRipple />
            <ForensicAuditView />
            <IngestionHUD />
            <WindowManager />
        </ReactFlow>
    );
}

export default function GraphCanvas() {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlowProvider>
                <GraphContent />
            </ReactFlowProvider>
        </div>
    );
}
