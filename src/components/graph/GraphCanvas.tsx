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
            zoomOnDoubleClick={false}
            fitView
            className={`dot-grid transition-all duration-500 ${isXRayMode ? 'brightness-90 grayscale-[0.3]' : ''}`}
            proOptions={{ hideAttribution: true }}
        >
            <Background color={isXRayMode ? "#33ffff" : "#ccc"} variant={"dots" as any} />

            {/* X-Ray Spatial Wires (Alt key) */}
            {isXRayMode && (
                <Panel position="top-center" className="mt-4">
                    <div className="bg-sky-950/80 border border-sky-400 text-sky-400 px-4 py-2 rounded-full font-mono text-xs animate-pulse">
                        X-RAY SPATIAL MODE: SEMANTIC WIRES VISIBLE
                    </div>
                </Panel>
            )}

            <Controls className="!bg-white/90 dark:!bg-surface-dark-container-high/90 !backdrop-blur-xl !border !border-outline-variant/20 dark:!border-white/10 !rounded-2xl !shadow-elevation-3 !p-1 [&>button]:!bg-transparent [&>button]:!border-0 [&>button]:!rounded-xl [&>button:hover]:!bg-primary/10 [&>button]:!text-outline dark:[&>button]:!text-outline-variant [&>button]:!w-8 [&>button]:!h-8" />
            <MiniMap
                className="!bg-white/80 dark:!bg-surface-dark-container/80 !backdrop-blur-xl !border !border-outline-variant/20 dark:!border-white/10 !rounded-2xl !shadow-elevation-3"
                nodeColor={(node) => {
                    if ((node as any).className === 'draft-proposal') return '#94a3b8';
                    const type = node.type || 'note';
                    const colors: Record<string, string> = {
                        note: '#F3EDF7', claim: '#D3E3FD', evidence: '#C4EED0',
                        decision: '#FEF7C3', idea: '#E7F8ED', task: '#E8DEF8',
                        artifact: '#FFE0B2', source: '#E3F2FD'
                    };
                    return colors[type] || '#F3EDF7';
                }}
                maskColor="rgba(0,0,0,0.05)"
            />

            {/* Floating Toolbar Island */}
            <Panel position="bottom-center" className="!mb-6">
                <div className="floating-island flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border border-outline-variant/20 rounded-full shadow-elevation-3">
                    <button
                        onClick={() => addNode('note')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-medium text-sm transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-elevation-2"
                    >
                        <Plus size={18} />
                        <span>New Node</span>
                    </button>

                    <div className="w-px h-6 bg-outline-variant/30 dark:bg-white/10" />

                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors text-outline dark:text-outline-variant" title="Search">
                        <Search size={20} />
                    </button>

                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors text-outline dark:text-outline-variant" title="Filter">
                        <Filter size={20} />
                    </button>

                    <div className="w-px h-6 bg-outline-variant/30 dark:bg-white/10" />

                    <button
                        onClick={toggleAntigravity}
                        className={`p-2 rounded-full transition-all duration-300 ${isAntigravityActive ? 'bg-primary text-white shadow-elevation-2' : 'hover:bg-primary/10 text-outline dark:text-outline-variant'}`}
                        title={isAntigravityActive ? "Switch to Stationary (Freeze)" : "Enable Antigravity (Physics)"}
                    >
                        <Wind size={20} className={isAntigravityActive ? 'animate-pulse' : ''} />
                    </button>

                    <div className="w-px h-6 bg-outline-variant/30 dark:bg-white/10" />

                    <button
                        onClick={() => {
                            // Using dummy IDs for now, in a real scenario these would be active branch IDs
                            const { performAlignmentCheck } = useGraphStore.getState();
                            performAlignmentCheck('branch-infra', 'branch-finance');
                        }}
                        className="p-2 rounded-full hover:bg-cyan-500/10 text-cyan-500 transition-colors"
                        title="Audit Semantic Alignment"
                    >
                        <ShieldCheck size={20} />
                    </button>

                    {/* X-Ray Mode Toggle */}
                    <button
                        onClick={() => useXRayMode.getState().toggleXRay()}
                        className={`p-2 rounded-full transition-all ${useXRayMode.getState().isXRayActive ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'hover:bg-cyan-500/10 text-slate-500'}`}
                        title="Toggle X-Ray Mode (Forensic Audit)"
                    >
                        <Eye size={20} />
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
