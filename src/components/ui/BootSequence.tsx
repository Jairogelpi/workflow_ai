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
        // 6000ms / 5 steps = 1200ms per step for perfect sync with video
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                const nextStatus = steps[currentStep];
                if (nextStatus) setStatus(nextStatus);
                setProgress((prev) => Math.min(prev + 20, 100)); // 5 cycles of 20 = 100%
                currentStep++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    onComplete();
                }, 1000); // Final pause
            }
        }, 1200);
        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[10000] bg-white overflow-hidden flex flex-col items-center justify-center">
            {/* Soft background aura - Cinematic Bloom */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-tr from-blue-50/20 via-white to-yellow-50/20 rounded-full blur-[120px] pointer-events-none opacity-80 animate-pulse-slow" />

            {/* Axiom Video - The Protagonist */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
                <div className="relative flex justify-center"
                    style={{
                        animation: 'axiom-epic-reveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}>
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-64 md:w-80 lg:w-[450px] h-auto object-contain drop-shadow-[0_40px_100px_rgba(0,0,0,0.08)]"
                    >
                        <source src="/axiom_animation.mp4" type="video/mp4" />
                    </video>
                </div>

                {/* Subtle Progress HUD - Positioned Lower */}
                <div className="mt-12 w-64 space-y-4 animate-fade-in" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
                    <div className="space-y-4 text-center">
                        <h1 className="text-[10px] tracking-[0.5em] font-bold opacity-40 uppercase leading-none text-slate-500">
                            {status}
                        </h1>

                        <div className="w-full h-[1px] bg-slate-100 rounded-full overflow-hidden relative">
                            <div
                                className="absolute inset-y-0 left-0 bg-blue-500/80 transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 opacity-20">
                        <div className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-1 h-1 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1 h-1 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
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
