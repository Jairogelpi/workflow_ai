'use client';
import React, { useEffect, useCallback } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    Panel,
    useReactFlow,
    ReactFlowProvider,
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
    const nodes = useGraphStore(state => state.nodes);
    const edges = useGraphStore(state => state.edges);
    const onNodesChange = useGraphStore(state => state.onNodesChange);
    const onEdgesChange = useGraphStore(state => state.onEdgesChange);
    const onConnect = useGraphStore(state => state.onConnect);
    const openManifest = useGraphStore(state => state.openManifest);

    useEffect(() => {
        openManifest();
    }, [openManifest]);
    const setNodes = useGraphStore(state => state.setNodes);
    const setSelectedNode = useGraphStore(state => state.setSelectedNode);
    const addNode = useGraphStore(state => state.addNode);
    const toggleWindow = useGraphStore(state => state.toggleWindow);
    const isAntigravityActive = useGraphStore(state => state.isAntigravityActive);
    const toggleAntigravity = useGraphStore(state => state.toggleAntigravity);
    const draftNodes = useGraphStore(state => state.draftNodes);
    const ghostNodes = useGraphStore(state => state.ghostNodes);
    const isXRayActive = useGraphStore(state => state.isXRayActive);
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
            edges.forEach(edge => {
                if (edge.source === node.id || edge.target === node.id) {
                    contextNodeIds.add(edge.source);
                    contextNodeIds.add(edge.target);
                }
            });
        }

        // Cinematic Flight Mode: Voyage to context group
        fitView({
            nodes: nodes.filter(n => contextNodeIds.has(n.id)),
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
        return [...nodes, ...draftNodes, ...ghostNodes];
    }, [nodes, draftNodes, ghostNodes]);

    const flowEdges: Edge[] = edges.map(e => {
        const isContradiction = e.data?.relation === 'contradicts';
        const isEvidence = e.data?.relation === 'evidence_for';

        const style: React.CSSProperties = isContradiction
            ? { stroke: '#ef4444', strokeWidth: 3, filter: 'drop-shadow(0 0 5px #ef4444)' }
            : isEvidence
                ? { stroke: '#10b981', strokeWidth: 2 }
                : {};

        return {
            ...e,
            animated: isContradiction,
            style
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
