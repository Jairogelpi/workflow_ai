import React from 'react';

export default function Loading() {
    return (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-[9999]">
            <video
                autoPlay
                muted
                loop
                playsInline
                className="w-64 md:w-80 lg:w-[450px] h-auto object-contain animate-in fade-in duration-500"
            >
                <source src="/axiom_animation.mp4" type="video/mp4" />
            </video>
        </div>
    );
}
