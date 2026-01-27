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
        <div className="fixed sm:bottom-4 sm:right-4 bottom-0 right-0 w-full sm:w-96 max-h-[80vh] sm:max-h-[60vh] flex flex-col bg-white/80 border-t sm:border border-slate-200/60 rounded-t-3xl sm:rounded-3xl backdrop-blur-xl shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)] sm:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] z-[100] animate-in slide-in-from-bottom-4 duration-500 overflow-hidden resize-y min-h-[300px]">
            {/* Resizer Handle (Mobile) */}
            <div className="w-full h-1.5 bg-slate-100 sm:hidden flex items-center justify-center cursor-row-resize">
                <div className="w-12 h-1 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-white/50 shrink-0">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                        <Cpu className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-sans">FORENSIC_AUDIT</h3>
                        <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em]">X-Ray Mode Active</p>
                    </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                    <div className="flex items-center gap-1.5 p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 font-bold">${sessionSpend.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className="text-amber-600 font-bold">${burnRate}/hr</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-blue-500" />
                        <span className="text-blue-600 font-bold">{integrityScore}%</span>
                    </div>
                </div>
            </div>

            {/* Reasoning Timeline */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0 bg-slate-50/50">
                {rlmThoughts.slice(-20).reverse().map((thought) => (
                    <div
                        key={thought.id}
                        className="p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all group"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${thought.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                thought.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
                                    thought.type === 'reasoning' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                        'bg-slate-50 text-slate-500 border border-slate-100'
                                }`}>
                                {thought.type}
                            </span>
                            <span className="text-[8px] text-slate-400 font-mono">
                                {thought.timestamp.split('T')[1]?.split('.')[0]}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-mono break-words">
                            {thought.message}
                        </p>
                    </div>
                ))}

                {rlmThoughts.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        <Zap className="w-6 h-6 mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] font-mono">No reasoning activity yet</p>
                    </div>
                )}
            </div>

            {/* Circuit Breaker */}
            <div className="p-3 border-t border-slate-100 bg-white/50 shrink-0">
                <button className="w-full py-2 px-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center justify-center gap-2 active:scale-95 duration-75">
                    <AlertTriangle className="w-3 h-3" />
                    CIRCUIT_BREAKER
                </button>
            </div>
        </div>
    );
}
