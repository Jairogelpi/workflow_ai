'use client';
import React, { useEffect, useCallback } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGraphStore } from '../../store/useGraphStore';
import { backendToFlow } from '../../lib/adapters';
import { NodeId } from '../../canon/schema/primitives';
import { WorkNode } from '../../canon/schema/ir';
import { Plus } from 'lucide-react';

export default function GraphCanvas() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setNodes,
        setSelectedNode,
        addNode
    } = useGraphStore();

    // Initial dummy data if store is empty
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
        // Simple double-click detection using event.detail (standard for browser clicks)
        if (event.detail === 2) {
            const position = {
                x: event.clientX - 100, // Offset to center somewhat
                y: event.clientY - 100,
            };
            addNode('note', position);
        }
    }, [addNode]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, node) => setSelectedNode(node.id)}
                onPaneClick={onPaneClick}
                fitView
            >
                <Controls />
                <MiniMap />
                <Background gap={12} size={1} />
                <Panel position="top-left" className="bg-slate-900 p-2 rounded-lg border border-slate-700 shadow-xl flex gap-2">
                    <button
                        onClick={() => addNode('note')}
                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-md transition-all flex items-center gap-1 text-sm font-medium"
                        title="Add Note"
                    >
                        <Plus size={16} />
                        Node
                    </button>
                </Panel>
            </ReactFlow>
        </div>
    );
}
