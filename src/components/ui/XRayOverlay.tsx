
import React from 'react';
import { CompilationReceipt } from '../../canon/schema/receipt';
import { useGraphStore } from '../../store/useGraphStore';
import { auditStore } from '../../kernel/observability';

interface XRayOverlayProps {
    receipt?: CompilationReceipt;
    isActive: boolean;
}

export const XRayOverlay: React.FC<XRayOverlayProps> = ({ receipt, isActive }) => {
    const { nodes } = useGraphStore();

    if (!isActive || !receipt) return null;

    const jobMetrics = auditStore.getJobMetrics(receipt.job_id);

    return (
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
            {/* 1. Capa de Atenuación (Dimmer) */}
            <div className="absolute inset-0 bg-slate-900/10 backdrop-grayscale-[0.5]" />

            {/* 2. Visualización de Estructura (Wireframe) */}
            <div className="relative w-full h-full max-w-4xl mx-auto mt-10">
                {Object.entries(receipt.assertion_map || {}).map(([claimId, evidenceId], index) => {
                    const evidenceNode = nodes.find(n => n.id === evidenceId);
                    if (!evidenceNode || !evidenceNode.data) return null;

                    const data = evidenceNode.data as any; // Cast to avoid discriminated union property access issues
                    const topPos = 15 + (index * 12);

                    return (
                        <div key={claimId} className="absolute w-full flex items-center group" style={{ top: `${topPos}%` }}>

                            {/* La "Caja Verde" (Evidence Node) flotando a la izquierda */}
                            <div className="w-64 -ml-72 bg-emerald-950/90 border border-emerald-500/50 p-3 rounded text-xs font-mono text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] transform transition-transform group-hover:scale-105">
                                <div className="font-bold border-b border-emerald-800 mb-1 pb-1">
                                    SOURCE: {data.type?.toUpperCase() || 'UNKNOWN'}
                                </div>
                                <div className="truncate opacity-80">
                                    {data.id.slice(0, 8)}...
                                </div>
                                <div className="mt-1 text-[10px] text-emerald-600">
                                    CONFIDENCE: {Math.round((data.metadata?.confidence || 0) * 100)}%
                                </div>
                            </div>

                            {/* El "Cable" (Wire) conectando al texto */}
                            <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-transparent mx-4 relative">
                                <div className="absolute left-0 -top-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            </div>

                            {/* El Highlight sobre el texto (simulado) */}
                            <div className="w-2/3 h-24 border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 rounded" />
                        </div>
                    );
                })}
            </div>

            {/* 3. HUD de Ingeniero (Esquina inferior) */}
            <div className="absolute bottom-4 right-4 bg-black/80 text-emerald-500 font-mono text-[10px] p-3 rounded border border-emerald-500/30 space-y-1 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <p className="border-b border-emerald-500/30 pb-1 mb-1 font-bold">ENGINEER HUD: ACTIVE</p>
                <div className="grid grid-cols-2 gap-x-4">
                    <span className="opacity-60">JOB_ID:</span> <span>{receipt.job_id.slice(0, 8)}</span>
                    <span className="opacity-60">ASSERTIONS:</span> <span>{Object.keys(receipt.assertion_map || {}).length}</span>
                    <span className="opacity-60">AUDIT_COST:</span> <span>${jobMetrics.reduce((acc: number, m: any) => acc + m.cost_usd, 0).toFixed(4)}</span>
                    <span className="opacity-60">AVG_LATENCY:</span> <span>{Math.round(jobMetrics.reduce((acc: number, m: any) => acc + m.latency_ms, 0) / (jobMetrics.length || 1))}ms</span>
                </div>
                <p className="pt-1 mt-1 border-t border-emerald-500/30 text-emerald-600">HASH: {receipt.input_hash.slice(0, 10)}</p>
            </div>
        </div>
    );
};
