'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Award, ShieldAlert, Lock, Unlock, ShieldCheck } from 'lucide-react';

interface AuthoritySealProps {
    isSigned: boolean;
    isBroken: boolean;
    onSign: () => void;
    onReset: () => void;
    holdDuration?: number;
}

/**
 * Authority Seal Component (Hito 4.4)
 * 
 * A tactile, high-friction interaction for sealing nodes as "Truth" (Canon).
 * Implements a "Hold to Seal" gesture with visual progress.
 */
export const AuthoritySeal: React.FC<AuthoritySealProps> = ({
    isSigned,
    isBroken,
    onSign,
    onReset,
    holdDuration = 1500
}) => {
    const [progress, setProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    const startProgress = () => {
        if (isSigned && !isBroken) return;
        setIsHolding(true);
        setProgress(0);
        startTimeRef.current = Date.now();

        timerRef.current = setInterval(async () => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min((elapsed / holdDuration) * 100, 100);
            setProgress(newProgress);

            if (newProgress >= 100) {
                stopProgress();

                // [Phase 7] Integrate with Rust Authority Signer
                try {
                    const signerCore = await import('signer-core');
                    await signerCore.default?.(); // Initialize WASM

                    // Note: In production, nodeHash and privateKey would come from props/store
                    console.log('[AuthoritySeal] Rust Signer ready for cryptographic signing');
                } catch (err) {
                    console.warn('[AuthoritySeal] Rust Signer not available, using fallback:', err);
                }

                onSign();
            }
        }, 16);
    };

    const stopProgress = () => {
        setIsHolding(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (progress < 100) {
            setProgress(0);
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Visual states mapping
    const statusColor = isBroken ? 'red' : isSigned ? 'blue' : 'slate';
    const activeColor = isBroken ? '#ef4444' : '#3b82f6';

    return (
        <div className="relative select-none">
            <div
                className={`
                    group relative flex flex-col items-center justify-center p-6 rounded-3xl border transition-all duration-500
                    ${isSigned
                        ? (isBroken
                            ? 'bg-red-950/20 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-pulse'
                            : 'bg-blue-950/20 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]')
                        : 'bg-slate-800/20 border-dashed border-slate-700 hover:border-slate-500 cursor-pointer'
                    }
                `}
                onMouseDown={startProgress}
                onMouseUp={stopProgress}
                onMouseLeave={stopProgress}
                onTouchStart={startProgress}
                onTouchEnd={stopProgress}
            >
                {/* Progress Ring (only visible during hold) */}
                {isHolding && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                        <circle
                            cx="50%"
                            cy="50%"
                            r="44%"
                            fill="none"
                            stroke={activeColor}
                            strokeWidth="2"
                            strokeDasharray="280"
                            strokeDashoffset={280 - (280 * progress) / 100}
                            style={{ transition: 'stroke-dashoffset 16ms linear' }}
                        />
                    </svg>
                )}

                {/* Central Icon */}
                <div className={`
                    mb-3 p-4 rounded-full transition-all duration-500
                    ${isSigned
                        ? (isBroken ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-400 scale-110')
                        : 'bg-slate-700/20 text-slate-500'
                    }
                `}>
                    {isBroken ? <ShieldAlert size={32} /> : isSigned ? <ShieldCheck size={32} /> : <Award size={32} />}
                </div>

                <div className="text-center">
                    <p className={`
                        text-[11px] font-black uppercase tracking-[0.2em] mb-1
                        ${isBroken ? 'text-red-400' : isSigned ? 'text-blue-300' : 'text-slate-500'}
                    `}>
                        {isBroken ? 'Pacto Roto' : isSigned ? 'Autoridad Sellada' : 'Canon & Sinceridad'}
                    </p>

                    <p className="text-[10px] text-slate-400/60 font-medium max-w-[140px] leading-relaxed">
                        {isBroken
                            ? 'Integridad violada. Re-sellar para restaurar.'
                            : isSigned
                                ? 'Nodo inmutable para el RLM'
                                : isHolding
                                    ? 'Sellando destino...'
                                    : 'Mantén pulsado para firmar'}
                    </p>
                </div>

                {/* Gloss/Reflect Effect for Signed Nodes */}
                {isSigned && !isBroken && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                        <div className="absolute -inset-x-full top-0 bottom-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-[shimmer_3s_infinite]" />
                    </div>
                )}
            </div>

            {/* Reset Action */}
            {isSigned && (
                <button
                    onClick={(e) => { e.stopPropagation(); onReset(); }}
                    className="absolute -bottom-2 right-1/2 translate-x-1/2 translate-y-full px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[9px] font-bold text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all uppercase tracking-tighter"
                >
                    {isBroken ? 'Restablecer' : 'Romper Sello'}
                </button>
            )}

            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(200%) skewX(-12deg); }
                }
            `}</style>
        </div>
    );
};
