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
        <div className="fixed inset-0 z-[10000] bg-white overflow-hidden">
            {/* Soft background aura - Cinematic Bloom */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-tr from-blue-50/30 via-white to-yellow-50/30 rounded-full blur-[150px] pointer-events-none opacity-80 animate-pulse-slow" />

            {/* Axiom Logo - The Protagonist */}
            <div className="relative z-10 flex flex-col items-center justify-start min-h-screen pt-40 md:pt-60">
                <div className="relative"
                    style={{
                        animation: 'axiom-epic-reveal 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        opacity: 0,
                    }}>
                    <div className="w-[600px] md:w-[800px] lg:w-[950px] h-auto">
                        <img src="/logo.png" alt="Axiom Logo" className="w-full h-auto drop-shadow-[0_40px_100px_rgba(0,0,0,0.12)]" />
                    </div>

                    {/* Fluid Gloss Sweep */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-[100%] animate-[shimmer_4s_infinite_ease-in-out] pointer-events-none mix-blend-overlay" />
                </div>

                {/* Subtle Progress HUD - Positioned Lower */}
                <div className="mt-20 w-64 space-y-6 animate-fade-in" style={{ animationDelay: '1.5s', opacity: 0, animationFillMode: 'forwards' }}>
                    <div className="space-y-4 text-center">
                        <h1 className="text-[10px] tracking-[0.6em] font-extrabold opacity-30 uppercase leading-none text-slate-400">
                            {status}
                        </h1>

                        <div className="w-full h-[1.5px] bg-slate-100 rounded-full overflow-hidden relative">
                            <div
                                className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
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
            </div>

            <style jsx global>{`
                @keyframes axiom-epic-reveal {
                    0% { 
                        opacity: 0; 
                        transform: scale(0.6) translateY(50px); 
                        filter: blur(40px) brightness(1.5);
                    }
                    60% {
                        opacity: 1;
                        transform: scale(1.05) translateY(-10px);
                        filter: blur(0px) brightness(1);
                    }
                    100% { 
                        opacity: 1; 
                        transform: scale(1) translateY(0); 
                        filter: blur(0);
                    }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-15deg); }
                    100% { transform: translateX(250%) skewX(-15deg); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 6s ease-in-out infinite;
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
                    50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.1); }
                }
                .animate-fade-in {
                    animation: fade-in 1.5s ease-out forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Subtle Texture Grid - Pure App Feel */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.015]">
                <div className="w-full h-full dot-grid" />
            </div>
        </div>
    );
}
