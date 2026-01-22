'use client';
import React, { useState, useEffect } from 'react';

export function BootSequence({ onComplete }: { onComplete: () => void }) {
    const [status, setStatus] = useState('WORKGRAPH OS v2026.1');
    const [progress, setProgress] = useState(0);

    const steps = [
        "INITIALIZING NEURAL KERNEL...",
        "VERIFYING FORENSIC INTEGRITY...",
        "SYNCHRONIZING SWARM CONSCIOUSNESS...",
        "MAPPING SYMBOLIC SPACE...",
        "SYSTEMS NOMINAL. READY."
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
                setTimeout(onComplete, 500);
            }
        }, 600);
        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[10000] bg-zinc-950 flex flex-col items-center justify-center text-zinc-100 font-mono">
            {/* Minimalist Logo Animation */}
            <div className="relative mb-12">
                <div className="w-24 h-24 rounded-3xl bg-primary animate-pulse flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                    <span className="text-white text-4xl font-black">W</span>
                </div>
                <div className="absolute inset-x-0 -bottom-8 flex justify-center">
                    <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
                </div>
            </div>

            <div className="text-center space-y-4">
                <h1 className="text-sm tracking-[0.3em] font-medium opacity-80 uppercase leading-none">
                    {status}
                </h1>

                <div className="w-64 h-px bg-white/10 overflow-hidden relative">
                    <div
                        className="absolute inset-y-0 left-0 bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <p className="text-[10px] text-white/30 tracking-widest uppercase">
                    Authority Signed By: 0xFD...2A
                </p>
            </div>

            {/* Ambient Pulse Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="w-full h-full dot-grid" />
            </div>
        </div>
    );
}
