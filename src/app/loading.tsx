import React from 'react';

export default function Loading() {
    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
            <video
                src="/axiom_animation.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-32 h-auto object-contain opacity-80"
            />
        </div>
    );
}
