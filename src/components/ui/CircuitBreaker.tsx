import React from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { ShieldAlert, AlertTriangle, RefreshCcw, Lock } from 'lucide-react';

export const CircuitBreakerOverlay = () => {
    const { logicError, resolveCircuitBreaker, currentUser } = useGraphStore();

    if (!logicError) return null;

    const isCritical = logicError.severity === 'critical';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">

            {/* Backdrop: Red Glassmorphism */}
            <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xl animate-in fade-in duration-500" />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl bg-black/40 border border-red-500/50 rounded-2xl p-8 shadow-[0_0_100px_rgba(239,68,68,0.4)] animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6 text-red-500">
                    <ShieldAlert size={48} className="animate-pulse" />
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-widest text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                            System Halt
                        </h1>
                        <p className="text-red-400/80 font-mono text-sm uppercase">
                            Logic Violation Detected • Code: {logicError.code}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="bg-red-950/30 rounded-xl p-6 border border-red-900/50 mb-8">
                    <h2 className="text-xl font-bold text-white mb-2">{logicError.title}</h2>
                    <p className="text-red-200 leading-relaxed">
                        {logicError.message}
                    </p>
                    <div className="mt-4 pt-4 border-t border-red-900/50 flex items-center justify-between text-xs font-mono text-red-400">
                        <span>TIMESTAMP: {logicError.timestamp}</span>
                        <span>SEVERITY: {logicError.severity.toUpperCase()}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    {/* Admin Override (Simulation) */}
                    {currentUser.role === 'admin' && (
                        <button
                            onClick={resolveCircuitBreaker}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider rounded-lg transition-all shadow-[0_0_20px_rgba(220,38,38,0.6)] hover:shadow-[0_0_40px_rgba(220,38,38,0.8)]"
                        >
                            <Lock size={18} />
                            <span>Override Protocol</span>
                        </button>
                    )}

                    {!isCritical && (
                        <button
                            onClick={resolveCircuitBreaker}
                            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider rounded-lg transition-all"
                        >
                            <RefreshCcw size={18} />
                            <span>Correct Logic</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
