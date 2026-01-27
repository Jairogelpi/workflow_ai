import React from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { ShieldAlert, AlertTriangle, RefreshCcw, Lock } from 'lucide-react';

export const CircuitBreakerOverlay = () => {
    const { logicError, resolveCircuitBreaker, currentUser } = useGraphStore();

    if (!logicError) return null;

    const isCritical = logicError.severity === 'critical';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">

            {/* Backdrop: Red Glassmorphism Light */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl animate-in fade-in duration-500" />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl bg-white border border-red-100 rounded-3xl p-8 shadow-[0_20px_50px_rgba(239,68,68,0.1)] animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6 text-red-600">
                    <ShieldAlert size={48} className="animate-pulse" />
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-widest text-red-600">
                            Protocolo Detenido
                        </h1>
                        <p className="text-slate-400 font-mono text-sm uppercase">
                            Violación de Lógica Detectada • Código: {logicError.code}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100 mb-8">
                    <h2 className="text-xl font-extrabold text-slate-800 mb-2">{logicError.title}</h2>
                    <p className="text-slate-600 font-medium leading-relaxed">
                        {logicError.message}
                    </p>
                    <div className="mt-4 pt-4 border-t border-red-100 flex items-center justify-between text-xs font-bold text-red-400 uppercase tracking-widest">
                        <span>TIMESTAMP: {logicError.timestamp}</span>
                        <span>SEVERIDAD: {logicError.severity.toUpperCase()}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    {/* Admin Override (Simulation) */}
                    {currentUser.role === 'admin' && (
                        <button
                            onClick={resolveCircuitBreaker}
                            className="flex items-center gap-2 px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95"
                        >
                            <Lock size={18} />
                            <span>Anular Protocolo</span>
                        </button>
                    )}

                    {!isCritical && (
                        <button
                            onClick={resolveCircuitBreaker}
                            className="flex items-center gap-2 px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                        >
                            <RefreshCcw size={18} />
                            <span>Corregir Lógica</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
