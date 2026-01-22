'use client';
import React, { useEffect, useCallback } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    Panel,
    useReactFlow,
    ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGraphStore } from '../../store/useGraphStore';
import { backendToFlow } from '../../lib/adapters';
import { NodeId } from '../../canon/schema/primitives';
import { WorkNode } from '../../canon/schema/ir';
import { Plus } from 'lucide-react';
import { WorkNodeComponent } from './WorkNode';

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
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setNodes,
        setSelectedNode,
        addNode,
        openWindow
    } = useGraphStore();

    const { screenToFlowPosition } = useReactFlow();

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
                    pin: true
                }
            };
            (setNodes as any)([backendToFlow(dummyNode)]);
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

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
                setSelectedNode(node.id);
                openWindow({
                    id: node.id,
                    title: `${(node.data as any).label || (node.data as any).content?.slice(0, 30) || 'Untitled'}`,
                    contentType: 'editor',
                    nodeData: node,
                    contentUrl: `/editor?nodeId=${node.id}`
                });
            }}
            onPaneClick={onPaneClick}
            zoomOnDoubleClick={false}
            fitView
            className="dot-grid"
            proOptions={{ hideAttribution: true }}
        >
            <Controls className="!bg-white/90 dark:!bg-surface-dark-container-high/90 !backdrop-blur-xl !border !border-outline-variant/20 dark:!border-white/10 !rounded-2xl !shadow-elevation-3 !p-1 [&>button]:!bg-transparent [&>button]:!border-0 [&>button]:!rounded-xl [&>button:hover]:!bg-primary/10 [&>button]:!text-outline dark:[&>button]:!text-outline-variant [&>button]:!w-8 [&>button]:!h-8" />
            <MiniMap 
                className="!bg-white/80 dark:!bg-surface-dark-container/80 !backdrop-blur-xl !border !border-outline-variant/20 dark:!border-white/10 !rounded-2xl !shadow-elevation-3" 
                nodeColor={(node) => {
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
                <div className="floating-island flex items-center gap-2 px-4 py-2">
                    <button
                        onClick={() => addNode('note')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-medium text-sm transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-elevation-2"
                    >
                        <Plus size={18} />
                        <span>New Node</span>
                    </button>
                    
                    <div className="w-px h-6 bg-outline-variant/30 dark:bg-white/10" />
                    
                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors text-outline dark:text-outline-variant" title="Search">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                    </button>
                    
                    <button className="p-2 rounded-full hover:bg-primary/10 transition-colors text-outline dark:text-outline-variant" title="Filter">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                    </button>
                </div>
            </Panel>
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
