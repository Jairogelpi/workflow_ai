'use client';

import React from 'react';
import { useXRayMode } from '../../hooks/useXRayMode';
import { useGraphStore } from '../../store/useGraphStore';
import { ShieldCheck, Cpu, DollarSign, Clock, AlertTriangle, Zap } from 'lucide-react';
import { auditStore } from '../../kernel/observability';

/**
 * FORENSIC AUDIT VIEW v1.0 [2026]
 * Session metrics and reasoning timeline for total transparency.
 */
export function ForensicAuditView() {
    const { rlmThoughts, nodes } = useGraphStore();
    const { isXRayActive } = useXRayMode();

    if (!isXRayActive) return null;

    // Real metrics from AuditStore
    const sessionSpend = auditStore?.getSessionSpend() || 0;
    const burnRate = auditStore?.getBurnRate().toFixed(2) || '0.00';
    // Integrity: Ratio of nodes with 'validated: true' vs total nodes
    const integrityScore = nodes.length > 0
        ? Math.round((nodes.filter(n => n.data.metadata?.validated).length / nodes.length) * 100)
        : 100;

    return (
        <div className="fixed bottom-4 right-4 w-96 max-h-[50vh] bg-slate-950/95 border border-cyan-500/30 rounded-3xl backdrop-blur-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] z-[100] flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="p-4 border-b border-cyan-500/10 bg-cyan-500/5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-cyan-500/10 rounded-xl">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono">FORENSIC_AUDIT</h3>
                        <p className="text-[9px] text-cyan-500/60 uppercase tracking-[0.2em]">X-Ray Mode Active</p>
                    </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                    <div className="flex items-center gap-1.5 p-2 bg-slate-900/50 rounded-lg">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">${sessionSpend.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 bg-slate-900/50 rounded-lg">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-400">${burnRate}/hr</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 bg-slate-900/50 rounded-lg">
                        <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        <span className="text-cyan-400">{integrityScore}%</span>
                    </div>
                </div>
            </div>

            {/* Reasoning Timeline */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {rlmThoughts.slice(-10).reverse().map((thought) => (
                    <div
                        key={thought.id}
                        className="p-3 bg-slate-900/50 border border-white/5 rounded-xl hover:border-cyan-500/30 transition-colors group"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${thought.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                thought.type === 'error' ? 'bg-red-500/10 text-red-400' :
                                    thought.type === 'reasoning' ? 'bg-cyan-500/10 text-cyan-400' :
                                        'bg-slate-500/10 text-slate-400'
                                }`}>
                                {thought.type}
                            </span>
                            <span className="text-[8px] text-slate-600 font-mono">
                                {thought.timestamp.split('T')[1]?.split('.')[0]}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                            {thought.message}
                        </p>
                    </div>
                ))}

                {rlmThoughts.length === 0 && (
                    <div className="text-center py-8 text-slate-600">
                        <Zap className="w-6 h-6 mx-auto mb-2 opacity-30" />
                        <p className="text-[10px] font-mono">No reasoning activity yet</p>
                    </div>
                )}
            </div>

            {/* Circuit Breaker */}
            <div className="p-3 border-t border-cyan-500/10 bg-slate-900/50">
                <button className="w-full py-2 px-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    CIRCUIT_BREAKER
                </button>
            </div>
        </div>
    );
}
