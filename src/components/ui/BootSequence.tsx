'use client';
import React, { useState, useEffect } from 'react';

export function BootSequence({ onComplete }: { onComplete: () => void }) {
    const [status, setStatus] = useState('AXIOM GRAPHOS v2026.1');
    const [progress, setProgress] = useState(0);

    const steps = [
        "Preparando tu espacio...",
        "Alineando ideas...",
        "Cargando lo importante...",
        "Casi listo...",
        "¡Todo listo!"
    ];

    useEffect(() => {
        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                const nextStatus = steps[currentStep];
                if (nextStatus) setStatus(nextStatus);
                setProgress((prev) => Math.min(prev + 25, 100));
                currentStep++;
            } else {
                clearInterval(interval);
                setTimeout(onComplete, 800);
            }
        }, 700);
        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center text-slate-900 font-sans overflow-hidden">
            {/* Soft background aura - Apple/Google style */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-50/20 via-white to-yellow-50/20 rounded-full blur-[120px] pointer-events-none opacity-60 animate-pulse-slow" />

            {/* Axiom Logo - Cinematic Entrance */}
            <div className="relative mb-16 z-10 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{
                    animation: 'axiom-reveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    opacity: 0,
                    transform: 'scale(0.85) translateY(20px)'
                }}>
                <div className="w-[420px] h-auto">
                    <img src="/logo.png" alt="Axiom Logo" className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.08)]" />
                </div>

                {/* Subtle light sweep animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[100%] animate-[shimmer_3s_infinite] pointer-events-none mix-blend-overlay" />
            </div>

            <div className="text-center space-y-8 max-w-sm w-full px-8 z-10 animate-fade-in" style={{ animationDelay: '1.2s', opacity: 0, animationFillMode: 'forwards' }}>
                <div className="space-y-3">
                    <h1 className="text-[11px] tracking-[0.5em] font-bold opacity-30 uppercase leading-none text-slate-500">
                        {status}
                    </h1>

                    <div className="w-full h-[2px] bg-slate-100 rounded-full overflow-hidden relative">
                        <div
                            className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-700 ease-out rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex justify-center gap-6 opacity-30">
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-1 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1 h-1 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
            </div>

            <style jsx global>{`
                @keyframes axiom-reveal {
                    0% { opacity: 0; transform: scale(0.8) translateY(30px); filter: blur(20px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-20deg); }
                    100% { transform: translateX(200%) skewX(-20deg); }
                }
            `}</style>

            {/* Subtle Texture Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
                <div className="w-full h-full dot-grid" />
            </div>
        </div>
    );
}
