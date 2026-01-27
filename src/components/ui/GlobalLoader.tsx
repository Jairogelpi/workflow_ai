import React from 'react';

interface GlobalLoaderProps {
    message?: string;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ message = 'Loading Axiom OS...' }) => {
    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center h-screen w-screen overflow-hidden p-4 animate-in fade-in duration-500">
            <div className="relative flex flex-col items-center justify-center w-full max-w-4xl">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-auto max-h-[60vh] object-contain opacity-90"
                >
                    <source src="/axiom_animation.mp4" type="video/mp4" />
                    {/* Fallback */}
                    <div className="text-white text-xs">{message}</div>
                </video>
                <div className="mt-8 text-white/50 text-[10px] font-bold uppercase tracking-[0.6em] animate-pulse text-center">
                    {message}
                </div>
            </div>
        </div>
    );
};
