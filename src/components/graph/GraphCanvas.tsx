'use client';
import React, { useEffect } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGraphStore } from '../../store/useGraphStore';
import { backendToFlow } from '../../lib/adapters';
import { NodeId } from '../../canon/schema/primitives';
import { WorkNode } from '../../canon/schema/ir';

export default function GraphCanvas() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        setNodes,
        setSelectedNode
    } = useGraphStore();

    // Initial dummy data if store is empty
    useEffect(() => {
        if (nodes.length === 0) {
            const dummyNode: WorkNode = {
                id: '550e8400-e29b-41d4-a716-446655440000' as NodeId,
                type: 'note',
                content: 'Welcome to WorkGraph. Hito 2.1 strictly typed store is operational.',
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
            setNodes([backendToFlow(dummyNode)]);
        }
    }, [nodes.length, setNodes]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, node) => setSelectedNode(node.id)}
                onPaneClick={() => setSelectedNode(null)}
                fitView
            >
                <Controls />
                <MiniMap />
                <Background gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}
