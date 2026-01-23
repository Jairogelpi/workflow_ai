'use client';
import React, { useState, useEffect } from 'react';

export function BootSequence({ onComplete }: { onComplete: () => void }) {
    const [status, setStatus] = useState('AXIOM GRAPHOS v2026.1');
    const [progress, setProgress] = useState(0);

    const steps = [
        "INITIALIZING AXIOM KERNEL...",
        "CALIBRATING NEURAL ALIGNMENT...",
        "SYNCHRONIZING SYMBOLIC SPACE...",
        "READYING OS SHELL...",
        "SYSTEMS NOMINAL."
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
        <div className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center text-slate-900 font-sans">
            {/* Axiom Logo */}
            <div className="relative mb-12 animate-fade-in">
                <div className="w-64 h-auto">
                    <img src="/logo.png" alt="Axiom Logo" className="w-full h-auto drop-shadow-2xl" />
                </div>
                <div className="absolute inset-x-0 -bottom-8 flex justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                </div>
            </div>

            <div className="text-center space-y-6 max-w-sm w-full px-8">
                <h1 className="text-[10px] tracking-[0.4em] font-bold opacity-40 uppercase leading-none">
                    {status}
                </h1>

                <div className="w-full h-[3px] bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex justify-center gap-4 opacity-20">
                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                    <div className="w-1 h-1 rounded-full bg-red-500" />
                    <div className="w-1 h-1 rounded-full bg-yellow-500" />
                    <div className="w-1 h-1 rounded-full bg-green-500" />
                </div>
            </div>

            {/* Subtle Texture Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                <div className="w-full h-full dot-grid" />
            </div>
        </div>
    );
}
