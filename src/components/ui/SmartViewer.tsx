
import React from 'react';
import { useXRayMode } from '../../hooks/useXRayMode';
import { XRayOverlay } from './XRayOverlay';
import { CompilationReceipt } from '../../canon/schema/receipt';

interface SmartViewerProps {
    content: string;
    receipt?: CompilationReceipt;
}

export const SmartViewer: React.FC<SmartViewerProps> = ({ content, receipt }) => {
    const isXRay = useXRayMode();

    return (
        <div className="relative min-h-[500px] bg-white border rounded-xl shadow-lg overflow-hidden">

            {/* El Overlay vive encima */}
            <XRayOverlay receipt={receipt || undefined} isActive={isXRay} />

            {/* El Contenido Real */}
            <div className={`prose prose-slate max-w-4xl mx-auto p-12 transition-all duration-500 ease-in-out ${isXRay ? 'opacity-20 blur-[2px] scale-[0.98]' : 'opacity-100'}`}>
                <div className="whitespace-pre-wrap font-sans leading-relaxed text-gray-800">
                    {content}
                </div>
            </div>

            {/* Hint for X-Ray */}
            {!isXRay && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-100 text-gray-400 text-[10px] rounded-full border opacity-50 hover:opacity-100 transition-opacity">
                    Mantén pulsado <span className="font-bold">ALT</span> para ver modo rayos X
                </div>
            )}
        </div>
    );
};
