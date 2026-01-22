'use client';
import React, { useState, useEffect } from 'react';
import { useGraphStore } from '../../store/useGraphStore';

export function NeuralRipple() {
    const rlmThoughts = useGraphStore(state => state.rlmThoughts);
    const [ripples, setRipples] = useState<any[]>([]);

    // Trigger ripple on AI actions
    useEffect(() => {
        const lastThought = rlmThoughts[rlmThoughts.length - 1];
        if (lastThought && (lastThought.type === 'success' || lastThought.type === 'info') && lastThought.message.includes('[ACTION]')) {
            const newRipple = {
                id: Date.now(),
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 500, // Randomish origin for now
                y: window.innerHeight / 2 + (Math.random() - 0.5) * 500,
            };
            setRipples(prev => [...prev, newRipple]);
            setTimeout(() => {
                setRipples(prev => prev.filter(r => r.id !== newRipple.id));
            }, 2000);
        }
    }, [rlmThoughts]);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {ripples.map(r => (
                <div
                    key={r.id}
                    className="absolute rounded-full border border-primary/20 bg-primary/5 animate-ripple"
                    style={{
                        left: r.x,
                        top: r.y,
                        width: '10px',
                        height: '10px',
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes ripple-out {
                    0% {
                        width: 0;
                        height: 0;
                        opacity: 0.8;
                        border-width: 4px;
                    }
                    100% {
                        width: 200vw;
                        height: 200vw;
                        opacity: 0;
                        border-width: 1px;
                    }
                }
                .animate-ripple {
                    animation: ripple-out 2s cubic-bezier(0, 0, 0.2, 1) forwards;
                }
            `}</style>
        </div>
    );
}
