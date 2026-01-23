'use client';

import React from 'react';
import { useXRayMode } from '../../hooks/useXRayMode';
import { ShieldCheck, Zap, DollarSign } from 'lucide-react';

/**
 * X-RAY OVERLAY v1.0 [2026]
 * Translates forensic metadata into visual explanations for the user.
 */
interface XRayOverlayProps {
    nodeId: string;
    nodeName: string;
    position: { x: number; y: number };
}

export function XRayOverlay({ nodeId, nodeName, position }: XRayOverlayProps) {
    const { isXRayActive, hoveredNodeId } = useXRayMode();

    if (!isXRayActive || hoveredNodeId !== nodeId) return null;

    // Mock reasoning (would come from auditStore in production)
    const reasoning = "Este nodo asegura la consistencia entre tus objetivos de infraestructura y finanzas.";
    const confidence = 98.4;
    const cost = 0.00012;

    return (
        <div
            className="absolute z-[200] p-4 bg-slate-950/95 border border-cyan-500/40 rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.2)] animate-in zoom-in-95 fade-in duration-200 max-w-xs"
            style={{
                left: position.x + 20,
                top: position.y - 20,
                pointerEvents: 'none'
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Zap className="w-3 h-3 text-cyan-400 fill-current" />
                <h4 className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em] font-mono">
                    RAZONAMIENTO_SWARM
                </h4>
            </div>

            {/* Reasoning Text */}
            <p className="text-sm text-white leading-relaxed mb-3">
                {reasoning}
            </p>

            {/* Metrics Footer */}
            <div className="pt-3 border-t border-cyan-500/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span className="text-[9px] text-emerald-400 font-mono font-bold">
                        Confianza: {confidence}%
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] text-amber-400 font-mono">
                        ${cost.toFixed(5)}
                    </span>
                </div>
            </div>

            {/* Authority Badge */}
            <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse" />
                <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">
                    SAT_VERIFIED | Ed25519_SIGNED
                </span>
            </div>
        </div>
    );
}
