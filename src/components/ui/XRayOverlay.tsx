'use client';

import React from 'react';
import { CompilationReceipt } from '../../canon/schema/receipt';
import { useGraphStore } from '../../store/useGraphStore';
import { auditStore } from '../../kernel/observability';
import { ForensicHUD } from './ForensicHUD';

interface XRayOverlayProps {
    receipt: CompilationReceipt | undefined;
    isActive: boolean;
}

/**
 * X-Ray Overlay
 * 
 * Renders the "Architectural Wireframe" over the SmartViewer content.
 * Displays forensic metrics and traces assertions back to the Canon.
 */
export const XRayOverlay: React.FC<XRayOverlayProps> = ({ receipt, isActive }) => {
    const nodes = useGraphStore(state => state.nodes);
    const physicsStats = useGraphStore(state => state.physicsStats);
    const isAntigravityActive = useGraphStore(state => state.isAntigravityActive);

    if (!isActive || !receipt) return null;

    const jobMetrics = auditStore.getJobMetrics(receipt.job_id);
    const totalLatency = jobMetrics.reduce((acc: number, m: any) => acc + m.latency_ms, 0);
    const totalCost = jobMetrics.reduce((acc: number, m: any) => acc + m.cost_usd, 0);
    const assertionCount = Object.keys(receipt.assertion_map || {}).length;

    return (
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
            {/* 1. Reality Attenuation (Dimmer) */}
            <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] backdrop-grayscale-[0.3]" />

            {/* 2. Structural Traces (Assertion Map) */}
            <div className="relative w-full h-full max-w-5xl mx-auto mt-16 px-12">
                {Object.entries(receipt.assertion_map || {}).map(([claimId, evidenceId], index) => {
                    const evidenceNode = nodes.find(n => n.id === evidenceId);
                    if (!evidenceNode) return null;

                    const data = evidenceNode.data as any;
                    const topPos = 15 + (index * 12);

                    return (
                        <div key={claimId} className="absolute w-full flex items-center group" style={{ top: `${topPos}%` }}>
                            {/* Evidence Trace (Floating left) */}
                            <div className="w-64 -ml-72 bg-emerald-950/90 border border-emerald-500/50 p-4 rounded-2xl text-xs font-mono text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] transform transition-transform group-hover:scale-105 pointer-events-auto cursor-help">
                                <div className="font-bold border-b border-emerald-800/50 mb-2 pb-2 flex justify-between items-center">
                                    <span>SOURCE_NODE</span>
                                    <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded italic opacity-70">
                                        {data.type?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="truncate opacity-80 mb-2">
                                    ID: {String(evidenceId).slice(0, 8)}...
                                </div>
                                <div className="text-emerald-300 line-clamp-2 italic mb-2">
                                    "{(data as any).statement || (data as any).content || (data as any).rationale}"
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-emerald-500/70 pt-2 border-t border-emerald-800/10">
                                    <span>CONFIDENCE</span>
                                    <span className="font-bold text-emerald-400">
                                        {Math.round((data.metadata?.confidence || 0) * 100)}%
                                    </span>
                                </div>
                            </div>

                            {/* Nerve (Wire Connection) */}
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-emerald-500/40 to-transparent mx-6 relative">
                                <div className="absolute left-0 -top-[3px] w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                            </div>

                            {/* Text Highlight (Simulated position for now) */}
                            <div className="w-2/3 h-1 bg-emerald-500/10 border-b border-emerald-500/20 rounded-full blur-[1px]" />
                        </div>
                    );
                })}
            </div>

            {/* 3. Forensic HUD (Operative Brain) */}
            <div className="absolute bottom-6 right-6 w-80">
                <ForensicHUD
                    jobId={receipt.job_id}
                    metrics={{
                        latency_ms: totalLatency,
                        cost_usd: totalCost,
                        assertionCount: assertionCount,
                        nodeLinks: nodes.length
                    }}
                    isAntigravityActive={isAntigravityActive}
                    physicsLatency={physicsStats.latency_ms}
                />
            </div>
        </div>
    );
};
