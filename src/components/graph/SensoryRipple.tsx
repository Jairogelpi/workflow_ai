import React from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { ShieldAlert, Zap, CheckCircle } from 'lucide-react';

/**
 * SensoryRipple (Hito 7.9)
 * Full-screen sensorial feedback for synchronization and logic breaches.
 */
export const SensoryRipple: React.FC = () => {
    const { currentRipple } = useGraphStore();

    if (!currentRipple) return null;

    const { type, message, intensity } = currentRipple;

    const config = {
        error: {
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            icon: ShieldAlert,
            label: 'LOGIC_BREACH_DETECTED'
        },
        success: {
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/30',
            icon: CheckCircle,
            label: 'SYNC_TRANSACTION_OK'
        },
        warn: {
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
            icon: Zap,
            label: 'SYNCHRONICITY_DRIFT'
        },
        info: {
            color: 'text-slate-400',
            bg: 'bg-slate-500/10',
            border: 'border-slate-500/30',
            icon: Zap,
            label: 'KERNEL_ACTIVITY'
        }
    };

    const current = config[type || 'info'];
    const Icon = current.icon;

    return (
        <div className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center anime-in fade-in duration-300">
            {/* The Ripple Wave */}
            <div className={`absolute inset-0 ${current.bg} animate-pulse`} />
            <div className={`absolute inset-[10%] border-4 ${current.border} rounded-[100px] animate-ripple-expand-slow`} />
            <div className={`absolute inset-[20%] border-2 ${current.border} rounded-[100px] animate-ripple-expand-fast`} />

            {/* Notification HUD */}
            <div className={`bg-slate-900/80 backdrop-blur-2xl border ${current.border} rounded-[32px] p-8 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200 pointer-events-auto`}>
                <div className={`p-4 rounded-2xl ${current.bg}`}>
                    <Icon className={`w-8 h-8 ${current.color}`} />
                </div>
                <div className="text-center">
                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] font-mono ${current.color} mb-1`}>{current.label}</p>
                    <h3 className="text-xl font-bold text-white max-w-xs">{message}</h3>
                </div>
                <div className="mt-4 flex gap-4">
                    <div className="px-3 py-1 bg-white/5 rounded-md border border-white/5 text-[8px] font-mono text-slate-500">
                        LATENCY: 42ms
                    </div>
                    <div className="px-3 py-1 bg-white/5 rounded-md border border-white/5 text-[8px] font-mono text-slate-500">
                        SAT_STABLE: OK
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes ripple-expand {
                    0% { transform: scale(0.8); opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                .animate-ripple-expand-slow {
                    animation: ripple-expand 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                .animate-ripple-expand-fast {
                    animation: ripple-expand 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                    animation-delay: 0.5s;
                }
            `}</style>
        </div>
    );
};
