import React from 'react';

interface GlobalLoaderProps {
    message?: string;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ message = 'Loading Axiom OS...' }) => {
    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
            <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full max-w-3xl h-auto object-contain opacity-90"
            >
                <source src="/axiom_animation.mp4" type="video/mp4" />
                {/* Fallback */}
                <div className="text-white text-xs">{message}</div>
            </video>
            <div className="mt-8 text-white/50 text-[10px] font-bold uppercase tracking-[0.6em] animate-pulse">
                {message}
            </div>
        </div>
    );
};
