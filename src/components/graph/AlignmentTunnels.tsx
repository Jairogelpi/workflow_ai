import React, { useMemo } from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { useReactFlow } from 'reactflow';

/**
 * AlignmentTunnels (Hito 7.5)
 * Visualizes the "Semantic Field" between branches using SVG arcs.
 */
export const AlignmentTunnels: React.FC = () => {
    const { nodes, alignmentReport } = useGraphStore();
    const { getNodes } = useReactFlow();

    // Calculate arcs between potential branch roots
    const arcs = useMemo(() => {
        if (!alignmentReport || alignmentReport.score === 0) return [];

        const allNodes = getNodes();
        // [Stub] In production, we'd identify "Branch Root" nodes. 
        // For now, we connect the first two nodes for visual demonstration.
        if (allNodes.length < 2) return [];

        const source = allNodes[0];
        const target = allNodes[1];

        if (!source || !target) return [];

        const sourcePos = source.position;
        const targetPos = target.position;

        // Path calculation (Quadratic Bezier for the "Tunnel" feel)
        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = Math.min(sourcePos.y, targetPos.y) - 200; // Arch height

        const d = `M ${sourcePos.x + 100} ${sourcePos.y + 100} Q ${midX} ${midY} ${targetPos.x + 100} ${targetPos.y + 100}`;

        const getColor = (score: number) => {
            if (score > 90) return '#22d3ee'; // Cyan
            if (score > 70) return '#fbbf24'; // Amber
            return '#ef4444'; // Red
        };

        return [{
            id: 'alignment-tunnel-1',
            d,
            color: getColor(alignmentReport.score),
            score: alignmentReport.score
        }];
    }, [nodes, alignmentReport, getNodes]);

    return (
        <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-[-1]">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="tunnel-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="currentColor" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>

            {arcs.map(arc => (
                <g key={arc.id} style={{ color: arc.color }}>
                    {/* The Shadow Path (Neural Ripple) */}
                    <path
                        d={arc.d}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        className="opacity-5 animate-pulse"
                        filter="url(#glow)"
                    />

                    {/* The Main Alignment Beam */}
                    <path
                        d={arc.d}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="10 5"
                        strokeDashoffset="0"
                        className="opacity-40"
                    >
                        <animate
                            attributeName="strokeDashoffset"
                            from="0"
                            to="-100"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                    </path>

                    {/* Score Bubble */}
                    <foreignObject
                        x={(sourceTargetMidpoint(arc.d).x - 40)}
                        y={(sourceTargetMidpoint(arc.d).y - 60)}
                        width="80"
                        height="40"
                    >
                        <div className="flex items-center justify-center h-full">
                            <div className="bg-slate-900/80 border border-white/10 backdrop-blur-md rounded-full px-3 py-1 text-[10px] font-black text-white shadow-xl">
                                {arc.score}% MATCH
                            </div>
                        </div>
                    </foreignObject>
                </g>
            ))}
        </svg>
    );
};

// Helper to find roughly the midpoint of the Bezier Q path for the bubble
function sourceTargetMidpoint(d: string) {
    const coords = d.match(/[\d.]+/g)?.map(Number) || [];
    if (coords.length < 6) return { x: 0, y: 0 };
    return {
        x: (coords[0]! + coords[4]!) / 2,
        y: ((coords[1]! + coords[5]!) / 2) - 50
    };
}
