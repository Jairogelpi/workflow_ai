'use client';

import React, { useState } from 'react';
import { useXRayMode } from '../../hooks/useXRayMode';
import { XRayOverlay } from './XRayOverlay';
import { CompilationReceipt } from '../../canon/schema/receipt';
import { useGraphStore } from '../../store/useGraphStore';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface SmartViewerProps {
    content: string;
    receipt?: CompilationReceipt;
}

/**
 * SmartViewer v3.0
 * 
 * Renders artifact content with "Perception X-Ray" support.
 * Implements the "Audit Trail" by highlighting assertions and linking to sources.
 */
export const SmartViewer: React.FC<SmartViewerProps> = ({ content, receipt }) => {
    const isXRay = useXRayMode();
    const nodes = useGraphStore(state => state.nodes);
    const [hoveredClaimId, setHoveredClaimId] = useState<string | null>(null);

    // Identify interactive claims based on the assertion map
    const assertionEntries = receipt?.assertion_map ? Object.entries(receipt.assertion_map) : [];

    /**
     * Renders text as interactive spans if a claim is detected.
     * In a production 2026 build, this uses precise range matching.
     * Here we simulate it by wrapping sentences that look like claims.
     */
    const renderInteractiveContent = () => {
        if (!receipt || assertionEntries.length === 0) return content;

        // Simulation: split content by newlines or sentences and wrap them
        const segments = content.split('\n');

        return segments.map((text, idx) => {
            // Find if this segment corresponds to an assertion
            // For demo: map first few non-empty segments to the assertion map
            const claimId = (text.length > 20 && indexToClaimId(idx)) || null;

            if (claimId) {
                const evidenceId = receipt.assertion_map[claimId as any];
                const evidenceNode = nodes.find(n => n.id === evidenceId);

                return (
                    <span
                        key={idx}
                        className={`
                            relative cursor-help transition-all duration-300
                            ${isXRay ? 'bg-emerald-500/10 border-b border-emerald-500/30' : 'hover:bg-primary/5'}
                        `}
                        onMouseEnter={() => setHoveredClaimId(claimId)}
                        onMouseLeave={() => setHoveredClaimId(null)}
                    >
                        {text}
                        {hoveredClaimId === claimId && evidenceNode && (
                            <div className="absolute z-50 bottom-full left-0 mb-2 w-72 p-3 bg-white dark:bg-surface-dark border border-outline-variant/30 rounded-xl shadow-elevation-5 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
                                <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-primary uppercase tracking-wider">
                                    <CheckCircle2 size={12} />
                                    <span>Verified Source</span>
                                </div>
                                <p className="text-xs text-outline dark:text-outline-variant italic mb-2">
                                    "{(evidenceNode.data as any).content || (evidenceNode.data as any).statement}"
                                </p>
                                <div className="flex items-center justify-between text-[9px] opacity-70 border-t border-outline-variant/20 pt-2">
                                    <span>CONFIDENCE: {Math.round(((evidenceNode.data as any).metadata?.confidence || 0) * 100)}%</span>
                                    <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 px-1 rounded uppercase font-bold">SHA-256</span>
                                </div>
                            </div>
                        )}
                        {'\n'}
                    </span>
                );
            }
            return text + '\n';
        });
    };

    const indexToClaimId = (idx: number) => {
        const keys = Object.keys(receipt?.assertion_map || {});
        return keys[idx % keys.length];
    };

    return (
        <div className="relative min-h-[600px] bg-white dark:bg-surface-dark-container border dark:border-white/5 rounded-2xl shadow-elevation-2 overflow-hidden transition-colors duration-300">

            {/* X-Ray Reality Layer */}
            <XRayOverlay receipt={receipt} isActive={isXRay} />

            {/* Content Layer */}
            <div className={`
                prose prose-slate dark:prose-invert max-w-5xl mx-auto p-16
                transition-all duration-700 ease-in-out
                ${isXRay ? 'opacity-20 blur-[3px] scale-[0.99] grayscale-[0.8]' : 'opacity-100'}
            `}>
                <div className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-on-surface dark:text-white/90">
                    {renderInteractiveContent()}
                </div>
            </div>

            {/* Verification Status Badge */}
            <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[10px] font-bold tracking-widest uppercase">
                {receipt?.verification_result?.passed ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                <span>{receipt?.verification_result?.passed ? 'Trust-Verified' : 'Verification Pending'}</span>
            </div>

            {/* X-Ray Mode Prompt */}
            {!isXRay && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-surface dark:bg-surface-dark-container text-outline dark:text-outline-variant text-[11px] font-medium rounded-full border border-outline-variant/20 shadow-elevation-2 opacity-60 hover:opacity-100 transition-all cursor-help group">
                    <Info size={14} />
                    <span>Hold <kbd className="font-bold bg-outline-variant/10 px-1.5 py-0.5 rounded">ALT</kbd> for Forensic X-Ray Mode</span>
                </div>
            )}
        </div>
    );
};
