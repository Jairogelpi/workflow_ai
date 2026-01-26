import { useState, useEffect } from 'react';

export function BootSequence({ onComplete }: { onComplete: () => void }) {
    const [status, setStatus] = useState('LINK-OS v3.0');
    const [progress, setProgress] = useState(0);

    const steps = [
        "Iniciando Protocolo Neural...",
        "Sincronizando Grafo...",
        "Calibrando Rayos-X...",
        "Conexión Establecida.",
        "Bienvenido, Agente."
    ];

    useEffect(() => {
        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                setStatus(steps[currentStep]);
                setProgress((prev) => Math.min(prev + 25, 100));
                currentStep++;
            } else {
                clearInterval(interval);
                setTimeout(onComplete, 800);
            }
        }, 600);
        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[10000] bg-black overflow-hidden flex items-center justify-center">
            <video
                src={chrome.runtime.getURL('axiom_animation.mp4')}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                onEnded={() => {
                    // Slight delay before dismissing to ensure smooth transition
                    setTimeout(onComplete, 500);
                }}
                onError={(e) => {
                    console.error("Video load error", e);
                    // Fallback if video fails
                    setTimeout(onComplete, 2000);
                }}
            />

            {/* Overlay Text for status */}
            <div className="absolute bottom-10 left-0 right-0 text-center">
                <p className="text-[10px] text-white/50 tracking-[0.5em] font-bold uppercase animate-pulse">
                    {status}
                </p>
            </div>
        </div>
    );
}
