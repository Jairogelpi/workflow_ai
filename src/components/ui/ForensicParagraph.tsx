/**
 * FORENSIC PARAGRAPH v1.0
 * 
 * Interactive paragraph component with hover-activated evidence tracing.
 * Every sentence links back to its source Evidence nodes and Human Signatures.
 */
'use client';

import { useState, useRef } from 'react';
import { Eye, Shield, Link, FileText } from 'lucide-react';
import { ForensicHUD } from './ForensicHUD';

export interface ForensicMetadata {
    forensic_id: string;
    evidence_refs: string[];
    source_nodes: Array<{
        id: string;
        type: string;
        confidence: number;
        is_signed: boolean;
        signer_id?: string;
    }>;
    generated_at: string;
    model_used?: string;
    cost_usd?: number;
}

interface ForensicParagraphProps {
    content: string;
    forensicData: ForensicMetadata;
    onEvidenceClick?: (nodeId: string) => void;
}

export function ForensicParagraph({ content, forensicData, onEvidenceClick }: ForensicParagraphProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [showHUD, setShowHUD] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        setIsHovered(true);
        timeoutRef.current = setTimeout(() => setShowPopup(true), 300) as unknown as NodeJS.Timeout;
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowPopup(false);
    };

    const hasSignedSources = forensicData.source_nodes.some(n => n.is_signed);
    const avgConfidence = forensicData.source_nodes.length > 0
        ? forensicData.source_nodes.reduce((sum, n) => sum + n.confidence, 0) / forensicData.source_nodes.length
        : 0;

    return (
        <div
            className="relative group cursor-help"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => setShowHUD(true)}
        >
            {/* The Paragraph Content */}
            <p
                className={`transition-all duration-200 ${isHovered
                    ? 'bg-cyan-50/50 border-l-2 border-cyan-400 pl-3 -ml-3'
                    : ''
                    }`}
                data-forensic-id={forensicData.forensic_id}
            >
                {content}

                {/* Inline Indicators */}
                {isHovered && (
                    <span className="inline-flex items-center gap-1 ml-2 text-[10px] text-cyan-600 font-mono">
                        <Eye className="w-3 h-3" />
                        {forensicData.evidence_refs.length} refs
                        {hasSignedSources && (
                            <Shield className="w-3 h-3 text-amber-500" />
                        )}
                    </span>
                )}
            </p>

            {/* Forensic Popup (on hover) */}
            {showPopup && (
                <div className="absolute left-full top-0 ml-4 z-50 w-72 bg-slate-900 text-white rounded-lg shadow-xl border border-cyan-500/30 p-3 text-xs font-mono animate-in fade-in slide-in-from-left-2">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-cyan-900/50">
                        <span className="text-cyan-400 font-bold uppercase tracking-widest text-[10px]">
                            Forensic Trace
                        </span>
                        <span className="text-slate-500 text-[9px]">
                            ID: {forensicData.forensic_id.slice(0, 8)}
                        </span>
                    </div>

                    {/* Confidence Meter */}
                    <div className="mb-3">
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-400">Confidence</span>
                            <span className={avgConfidence > 0.7 ? 'text-green-400' : 'text-yellow-400'}>
                                {(avgConfidence * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${avgConfidence > 0.7 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                style={{ width: `${avgConfidence * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Source Nodes */}
                    <div className="space-y-1.5">
                        <span className="text-slate-400 text-[10px] uppercase">Evidence Chain</span>
                        {forensicData.source_nodes.map((node, i) => (
                            <button
                                key={i}
                                onClick={() => onEvidenceClick?.(node.id)}
                                className="w-full flex items-center gap-2 p-1.5 bg-slate-800/50 rounded hover:bg-slate-800 transition-colors text-left"
                            >
                                <FileText className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                <span className="flex-1 truncate">{node.type}</span>
                                {node.is_signed && (
                                    <span title={`Signed by ${node.signer_id}`}>
                                        <Shield className="w-3 h-3 text-amber-500" />
                                    </span>
                                )}
                                <Link className="w-3 h-3 text-slate-500" />
                            </button>
                        ))}
                    </div>

                    {/* Generation Info */}
                    {forensicData.model_used && (
                        <div className="mt-3 pt-2 border-t border-slate-700 text-[9px] text-slate-500">
                            Generated by {forensicData.model_used}
                            {forensicData.cost_usd && ` ($${forensicData.cost_usd.toFixed(4)})`}
                        </div>
                    )}
                </div>
            )}

            {/* Forensic HUD Overlay */}
            {showHUD && (
                <ForensicHUD
                    forensicId={forensicData.forensic_id}
                    evidenceIds={forensicData.evidence_refs}
                    signedNodeIds={forensicData.source_nodes.filter(n => n.is_signed).map(n => n.id)}
                    onClose={() => setShowHUD(false)}
                />
            )}
        </div>
    );
}

/**
 * Generates a forensic ID for a paragraph based on its content hash.
 */
export function generateForensicId(content: string, sectionId: string): string {
    const hash = Array.from(content)
        .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 0)
        .toString(16);
    return `${sectionId}-${hash}`;
}
