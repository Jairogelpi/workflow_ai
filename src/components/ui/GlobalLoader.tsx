import React from 'react';

interface GlobalLoaderProps {
    message?: string;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ message = 'Loading Axiom OS...' }) => {
    return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
            <video
                autoPlay
                muted
                loop
                playsInline
                className="w-64 md:w-80 lg:w-[450px] h-auto object-contain"
            >
                <source src="/axiom_animation.mp4" type="video/mp4" />
                {/* Fallback */}
                <div className="text-slate-400 text-xs">{message}</div>
            </video>
            <div className="mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">
                {message}
            </div>
        </div>
    );
};
