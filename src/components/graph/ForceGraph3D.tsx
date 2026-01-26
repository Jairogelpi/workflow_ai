'use client';

import React, { useRef, useEffect } from 'react';
// @ts-ignore
import ForceGraph3D_R from 'react-force-graph-3d';
import { useGraphStore } from '@/store/useGraphStore';

/**
 * 3D Force Graph Component
 * Wraps react-force-graph-3d with our zustand store.
 */
const ForceGraph3D = () => {
    const fgRef = useRef<any>();
    const nodes = useGraphStore((state: any) => state.nodes);
    const edges = useGraphStore((state: any) => state.edges);

    // Transform to graph format expected by library
    const graphData = {
        nodes: nodes.map(n => ({
            id: n.id,
            name: (n as any).statement || n.id,
            val: 1,
            x: n.position.x,
            y: n.position.y
        })),
        links: edges.map(e => ({
            source: e.source,
            target: e.target
        }))
    };

    return (
        <ForceGraph3D_R
            ref={fgRef}
            graphData={graphData}
            backgroundColor="#020617" // slate-950
            nodeLabel="name"
            nodeColor={() => '#3b82f6'} // blue-500
            linkColor={() => '#1e293b'} // slate-800
            linkOpacity={0.5}
        />
    );
};

export default ForceGraph3D;
