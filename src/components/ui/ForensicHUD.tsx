'use client';
import React from 'react';
import { Activity, Clock, DollarSign, Fingerprint, Network } from 'lucide-react';

interface ForensicHUDProps {
    jobId: string;
    metrics: {
        latency_ms: number;
        cost_usd: number;
        assertionCount: number;
        nodeLinks: number;
    };
    isAntigravityActive: boolean;
    physicsLatency: number;
}

/**
 * Forensic HUD
 * 
 * Provides "X-Ray" vision into the system's operational guts.
 * Part of the "Forensic Transparency" initiative.
 */
export const ForensicHUD: React.FC<ForensicHUDProps> = ({
    jobId,
    metrics,
    isAntigravityActive,
    physicsLatency
}) => {
    return (
        <div className="bg-black/90 backdrop-blur-2xl text-emerald-500 font-mono text-[10px] p-4 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col gap-3 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2 mb-1">
                <div className="flex items-center gap-2">
                    <Fingerprint size={14} className="animate-pulse" />
                    <span className="font-bold tracking-widest uppercase">Forensic Trace: Active</span>
                </div>
                <span className="opacity-40">#{jobId.slice(0, 8).toUpperCase()}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 opacity-60">
                        <Clock size={12} />
                        <span>COMPILER_LATENCY</span>
                    </div>
                    <div className="text-lg font-bold">{metrics.latency_ms}<span className="text-[10px] ml-0.5 opacity-50">ms</span></div>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 opacity-60">
                        <DollarSign size={12} />
                        <span>BYOK_COST_EST</span>
                    </div>
                    <div className="text-lg font-bold text-sky-400">${metrics.cost_usd.toFixed(4)}</div>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 opacity-60">
                        <Network size={12} />
                        <span>ASSERTION_MAP</span>
                    </div>
                    <div className="text-lg font-bold">{metrics.assertionCount}<span className="text-[10px] ml-0.5 opacity-50">traces</span></div>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 opacity-60">
                        <Activity size={12} />
                        <span>PHYSICS_ENGINE</span>
                    </div>
                    <div className="text-lg font-bold">
                        {physicsLatency}<span className="text-[10px] ml-0.5 opacity-50">ms</span>
                        <span className={`ml-2 text-[8px] px-1.5 py-0.5 rounded ${isAntigravityActive ? 'bg-sky-500/20 text-sky-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {isAntigravityActive ? 'FLIGHT' : 'STATIC'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-2 pt-2 border-t border-emerald-500/30 flex items-center justify-between opacity-50 text-[8px] uppercase tracking-tighter">
                <span>Kernel: RLM v3.0</span>
                <span>Audit: SHA-256 Validated</span>
            </div>
        </div>
    );
};
