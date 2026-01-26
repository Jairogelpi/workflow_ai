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
    const fgRef = useRef<any>(null);
    const nodes = useGraphStore((state) => state.nodes);
    const edges = useGraphStore((state) => state.edges);

    // [V4.1.0] Scalable Clustering Logic
    const MAX_NODES = 500;
    const isLargeGraph = nodes.length > MAX_NODES;

    const data = React.useMemo(() => {
        if (!isLargeGraph) {
            return {
                nodes: nodes.map((n: any) => ({
                    id: n.id,
                    name: n.statement || n.id,
                    val: 1,
                    type: n.type
                })),
                links: edges.map((e: any) => ({
                    source: e.source,
                    target: e.target
                }))
            };
        }

        // Clustering: Group by Type for performance
        const clusters: Record<string, any> = {};
        nodes.forEach((n: any) => {
            if (!clusters[n.type]) {
                clusters[n.type] = {
                    id: `cluster-${n.type}`,
                    name: `Cluster: ${n.type}`,
                    val: 0,
                    type: n.type,
                    count: 0
                };
            }
            clusters[n.type].val += 1;
            clusters[n.type].count += 1;
        });

        return {
            nodes: Object.values(clusters),
            links: []
        };
    }, [nodes, edges, isLargeGraph]);

    useEffect(() => {
        if (fgRef.current) {
            fgRef.current.d3Force('link')?.distance(50);
            fgRef.current.d3Force('charge')?.strength(-150);
        }
    }, [data]);

    return (
        <ForceGraph3D_R
            ref={fgRef}
            graphData={data}
            backgroundColor="#020617"
            nodeLabel={(node: any) => `${node.name} ${node.count ? `(${node.count} nodes)` : ''}`}
            nodeAutoColorBy="type"
            nodeRelSize={6}
            linkOpacity={0.2}
            linkWidth={0.5}
            linkDirectionalParticles={1}
            linkDirectionalParticleSpeed={0.01}
            showNavInfo={false}
        />
    );
};

export default ForceGraph3D;
