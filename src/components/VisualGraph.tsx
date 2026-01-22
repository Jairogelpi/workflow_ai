'use client';

import { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    Connection,
    addEdge,
    useNodesState,
    useEdgesState,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface VisualGraphProps {
    initialNodes: Node[];
    initialEdges: Edge[];
    onNodeClick?: (id: string) => void;
}

const nodeTypes = {
    // We can define custom node components here if needed
    // For now, we'll use default nodes with custom classes/styles
};

export const VisualGraph = ({ initialNodes, initialEdges, onNodeClick }: VisualGraphProps) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const handleNodeClick = (_: React.MouseEvent, node: Node) => {
        onNodeClick?.(node.id);
    };

    // Memoized graph configuration
    const defaultEdgeOptions = useMemo(() => ({
        markerEnd: {
            type: MarkerType.ArrowClosed,
        },
        animated: true,
        style: { stroke: '#94a3b8' },
    }), []);

    return (
        <div className="w-full h-[600px] border border-gray-200 rounded-lg bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
            >
                <Background color="#cbd5e1" gap={16} />
                <Controls />
            </ReactFlow>
        </div>
    );
};
