'use client';
import React, { useMemo } from 'react';
import { Handle, Position, NodeProps, NodeToolbar } from 'reactflow';
import { WorkNode as WorkNodeIR } from '../../canon/schema/ir';
import { useGraphStore } from '../../store/useGraphStore';
import {
    MessageSquare,
    CheckCircle2,
    ShieldAlert,
    HelpCircle,
    Lightbulb,
    CheckSquare,
    FileText,
    Brain,
    Lock,
    Link,
    Zap
} from 'lucide-react';
import { AppNode, AppEdge } from '../../store/useGraphStore';

const NODE_TYPE_CONFIG: Record<string, {
    label: string;
    icon: any;
    light: { bg: string; text: string; border: string };
    dark: { bg: string; text: string; border: string };
}> = {
    note: {
        label: 'Note',
        icon: MessageSquare,
        light: { bg: '#F3EDF7', text: '#4A4458', border: '#CAC4D0' },
        dark: { bg: '#4A4458', text: '#E8DEF8', border: '#938F99' }
    },
    claim: {
        label: 'Claim',
        icon: ShieldAlert,
        light: { bg: '#D3E3FD', text: '#041E49', border: '#A8C7FA' },
        dark: { bg: '#004A77', text: '#C2E7FF', border: '#0077B6' }
    },
    evidence: {
        label: 'Evidence',
        icon: CheckCircle2,
        light: { bg: '#C4EED0', text: '#0D5D2C', border: '#6DD58C' },
        dark: { bg: '#0D5D2C', text: '#C4EED0', border: '#1B8A45' }
    },
    decision: {
        label: 'Decision',
        icon: Brain,
        light: { bg: '#FEF7C3', text: '#594F05', border: '#FDD663' },
        dark: { bg: '#594F05', text: '#FEF7C3', border: '#8D7E0A' }
    },
    idea: {
        label: 'Idea',
        icon: Lightbulb,
        light: { bg: '#E7F8ED', text: '#0D5D2C', border: '#A8DAB5' },
        dark: { bg: '#0D5D2C', text: '#E7F8ED', border: '#2E7D32' }
    },
    task: {
        label: 'Task',
        icon: CheckSquare,
        light: { bg: '#E8DEF8', text: '#4A4458', border: '#CAC4D0' },
        dark: { bg: '#4A4458', text: '#E8DEF8', border: '#7E57C2' }
    },
    artifact: {
        label: 'Artifact',
        icon: FileText,
        light: { bg: '#FFE0B2', text: '#5D4037', border: '#FFCC80' },
        dark: { bg: '#5D4037', text: '#FFE0B2', border: '#8D6E63' }
    },
    assumption: {
        label: 'Assumption',
        icon: HelpCircle,
        light: { bg: '#FCE4EC', text: '#880E4F', border: '#F48FB1' },
        dark: { bg: '#880E4F', text: '#FCE4EC', border: '#AD1457' }
    },
    constraint: {
        label: 'Constraint',
        icon: Lock,
        light: { bg: '#F9DEDC', text: '#8C1D18', border: '#F2B8B5' },
        dark: { bg: '#8C1D18', text: '#F9DEDC', border: '#C62828' }
    },
    source: {
        label: 'Source',
        icon: Link,
        light: { bg: '#E3F2FD', text: '#0D47A1', border: '#90CAF9' },
        dark: { bg: '#0D47A1', text: '#E3F2FD', border: '#1976D2' }
    },
};

export function WorkNodeComponent(props: any) {
    const { data, selected, id, className } = props;
    const { mutateNodeType, edges, isAntigravityActive, logicalTension, isXRayActive } = useGraphStore();

    // [Phase 12] Ghost Node Detection
    const isGhost = className?.includes('ghost-predicted');
    const isSigned = !!data?.metadata?.human_signature;

    // Combined Tension: Physical (edges) + Logical (SAT Solver)
    const tensionLevel = useMemo(() => {
        const physicalTension = edges.filter(e =>
            (e.target === id || e.source === id) &&
            e.data?.relation === 'contradicts'
        ).length;

        const logicalTensionValue = logicalTension[id] ?? 0;
        return physicalTension + (logicalTensionValue * 5); // Scale logical tension
    }, [edges, id, logicalTension]);

    // Antigravity Semantic Physics Logic: Calculate Depth (Z-Axis)
    const zDepth = useMemo(() => {
        const confidence = data.metadata?.confidence ?? 1.0;
        const isCanon = data.metadata?.pin ?? false;
        return isCanon ? 1.2 : 0.8 + (confidence * 0.2);
    }, [data.metadata]);

    const config = NODE_TYPE_CONFIG[data.type] ?? NODE_TYPE_CONFIG.note!;
    const Icon = config!.icon;
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const colors = isDark ? config.dark : config.light;

    const rawContent = (data as any).content || (data as any).statement || (data as any).rationale || (data as any).summary || (data as any).description || (data as any).name || (data as any).rule || '';
    const content = typeof rawContent === 'object' ? (rawContent.name || rawContent.content || JSON.stringify(rawContent)) : String(rawContent);
    const preview = content.replace(/<[^>]*>?/gm, '').slice(0, 60) + (content.length > 60 ? '...' : '');

    return (
        <>
            <NodeToolbar
                isVisible={selected}
                position={Position.Top}
                className="flex gap-1 p-1.5 glass-panel rounded-2xl shadow-elevation-4 -translate-y-2"
            >
                {Object.entries(NODE_TYPE_CONFIG).slice(0, 6).map(([type, cfg]) => {
                    const TypeIcon = cfg.icon;
                    const isActive = data.type === type;
                    const typeColors = isDark ? cfg.dark : cfg.light;
                    return (
                        <button
                            key={type}
                            onClick={(e) => {
                                e.stopPropagation();
                                mutateNodeType(id, type as any);
                            }}
                            className="p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                            style={{
                                backgroundColor: isActive ? typeColors.bg : 'transparent',
                                color: isActive ? typeColors.text : (isDark ? '#CAC4D0' : '#79747E'),
                            }}
                            title={`Convert to ${cfg.label}`}
                        >
                            <TypeIcon size={16} />
                        </button>
                    );
                })}
            </NodeToolbar>

            <div
                className={`
                    min-w-[200px] max-w-[280px] rounded-3xl 
                    transition-all duration-300 ease-out
                    ${isGhost ? 'opacity-60 grayscale-[0.2] brightness-110' : ''}
                    ${isSigned ? 'shadow-[0_0_20px_rgba(245,158,11,0.25)]' : ''}
                    ${selected ? 'scale-105 shadow-elevation-5' : 'shadow-elevation-3'}
                    ${tensionLevel > 0 ? 'animate-vibration' : ''}
                    ${data.metadata.origin === 'ai' && !isGhost ? 'opacity-70 border-dashed border-gray-400 grayscale-[0.5]' : ''}
                `}
                style={{
                    backgroundColor: colors.bg,
                    border: data.metadata.origin === 'ai' || isGhost
                        ? `2px dashed ${isGhost ? '#f59e0b' : colors.text + '50'}`
                        : `2px solid ${selected ? colors.text : colors.border}`,
                    transform: isAntigravityActive ? `scale(${zDepth})` : undefined,
                    boxShadow: isGhost
                        ? '0 0 20px rgba(245, 158, 11, 0.4)'
                        : (tensionLevel > 0
                            ? `0 0 ${10 + tensionLevel * 5}px rgba(239, 68, 68, ${0.3 + tensionLevel * 0.1})`
                            : (isSigned ? '0 0 15px rgba(245, 158, 11, 0.2)' : undefined)),
                    animation: isGhost
                        ? 'ripple 2s infinite ease-in-out'
                        : (isSigned ? 'heartbeat 2s infinite ease-in-out' : (tensionLevel > 0 ? `vibration ${Math.max(0.1, 0.5 - tensionLevel * 0.05)}s infinite linear` : undefined))
                }}
            >
                <style jsx>{`
                    @keyframes vibration {
                        0% { transform: translate(0,0) rotate(0); }
                        25% { transform: translate(1px, 1px) rotate(0.5deg); }
                        50% { transform: translate(-1px, 2px) rotate(-0.5deg); }
                        75% { transform: translate(-2px, -1px) rotate(0.5deg); }
                        100% { transform: translate(1px, -2px) rotate(-0.5deg); }
                    }
                    @keyframes heartbeat {
                        0% { transform: scale(1); box-shadow: 0 0 15px rgba(245, 158, 11, 0.15); }
                        14% { transform: scale(1.02); box-shadow: 0 0 25px rgba(245, 158, 11, 0.35); }
                        28% { transform: scale(1); box-shadow: 0 0 15px rgba(245, 158, 11, 0.15); }
                        42% { transform: scale(1.02); box-shadow: 0 0 20px rgba(245, 158, 11, 0.25); }
                        70% { transform: scale(1); box-shadow: 0 0 15px rgba(245, 158, 11, 0.15); }
                    }
                    @keyframes ripple {
                        0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); border-color: rgba(245, 158, 11, 0.4); }
                        50% { box-shadow: 0 0 20px 10px rgba(245, 158, 11, 0); border-color: rgba(245, 158, 11, 1); }
                        100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); border-color: rgba(245, 158, 11, 0.4); }
                    }
                    .animate-vibration {
                        animation: vibration 0.2s infinite linear;
                    }
                `}</style>
                {tensionLevel > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg z-10">
                        <Zap size={12} fill="currentColor" />
                    </div>
                )}

                {/* [Phase 12] X-Ray Structural Layer */}
                {isXRayActive && (
                    <div className="absolute inset-0 z-20 bg-slate-950/95 rounded-3xl p-4 flex flex-col justify-between font-mono text-[9px] border-2 border-cyan-500/40 shadow-[inset_0_0_20px_rgba(34,211,238,0.2)] animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between text-cyan-400 font-bold uppercase tracking-tighter">
                            <span>PHY_ADDR: {id.slice(0, 8)}</span>
                            <span>VER: {data.metadata.version_hash?.slice(0, 6) || 'RAW'}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center gap-2">
                            <div className="text-[10px] text-cyan-300 font-black animate-pulse">NEURAL_SCAN_ACTIVE</div>
                            <div className="w-full bg-cyan-900/30 h-10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
                                <span className="text-cyan-500 flex items-center gap-1">
                                    <Zap size={14} className="animate-bounce" />
                                    INTEGRITY_INDEX: {(data.metadata.confidence * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="text-slate-400 border-t border-cyan-950 mt-2 py-1 truncate">
                            {isSigned ? `SIGNATURE_ED25519: ${(data.metadata.human_signature as any)?.public_key?.slice(0, 16)}...` : 'AUTH: AI_INFERRED (NON_CANON)'}
                        </div>
                    </div>
                )}
                <div className="px-4 py-3 flex items-start gap-3">
                    <div
                        className="p-2 rounded-xl shrink-0"
                        style={{
                            backgroundColor: `${colors.text}15`,
                        }}
                    >
                        <Icon size={18} style={{ color: colors.text }} />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                        <span
                            className="text-[10px] font-bold uppercase tracking-widest opacity-70"
                            style={{ color: colors.text }}
                        >
                            {config.label}
                        </span>
                        <p
                            className="text-sm font-medium leading-snug mt-1 line-clamp-2"
                            style={{ color: colors.text }}
                        >
                            {preview || <span className="opacity-50 italic">Empty {data.type}</span>}
                        </p>
                    </div>
                </div>

                <Handle
                    type="target"
                    position={Position.Top}
                    className="!w-3 !h-3 !border-2 !rounded-full !-top-1.5"
                    style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                    }}
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="!w-3 !h-3 !border-2 !rounded-full !-bottom-1.5"
                    style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                    }}
                />
            </div>
        </>
    );
}
