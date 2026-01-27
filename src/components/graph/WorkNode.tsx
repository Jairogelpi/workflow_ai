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
    BrainCircuit,
    Lock,
    Link,
    Zap,
    AlertTriangle,
    ShieldCheck
} from 'lucide-react';
import { AppNode, AppEdge } from '../../store/useGraphStore';

const NODE_TYPE_CONFIG: Record<string, {
    label: string;
    icon: any;
    gradient: string;
    glow: string;
    border: string;
}> = {
    note: {
        label: 'Nota',
        icon: MessageSquare,
        gradient: 'from-slate-700 to-slate-500',
        glow: 'rgba(148, 163, 184, 0.5)',
        border: '#94a3b8'
    },
    claim: {
        label: 'Afirmación',
        icon: ShieldAlert,
        gradient: 'from-blue-600 to-cyan-400',
        glow: 'rgba(56, 189, 248, 0.6)',
        border: '#38bdf8'
    },
    evidence: {
        label: 'Evidencia',
        icon: CheckCircle2,
        gradient: 'from-emerald-600 to-green-400',
        glow: 'rgba(74, 222, 128, 0.6)',
        border: '#4ade80'
    },
    decision: {
        label: 'Decisión',
        icon: Brain,
        gradient: 'from-amber-600 to-yellow-400',
        glow: 'rgba(251, 191, 36, 0.6)',
        border: '#f59e0b'
    },
    idea: {
        label: 'Idea',
        icon: Lightbulb,
        gradient: 'from-violet-600 to-purple-400',
        glow: 'rgba(167, 139, 250, 0.6)',
        border: '#a78bfa'
    },
    task: {
        label: 'Tarea',
        icon: CheckSquare,
        gradient: 'from-indigo-600 to-blue-500',
        glow: 'rgba(129, 140, 248, 0.6)',
        border: '#818cf8'
    },
    artifact: {
        label: 'Entregable',
        icon: FileText,
        gradient: 'from-orange-600 to-red-400',
        glow: 'rgba(251, 146, 60, 0.6)',
        border: '#fb923c'
    },
    assumption: {
        label: 'Supuesto',
        icon: HelpCircle,
        gradient: 'from-rose-600 to-pink-500',
        glow: 'rgba(244, 63, 94, 0.6)',
        border: '#f43f5e'
    },
    constraint: {
        label: 'Restricción',
        icon: Lock,
        gradient: 'from-gray-700 to-gray-500',
        glow: 'rgba(156, 163, 175, 0.5)',
        border: '#9ca3af'
    },
    source: {
        label: 'Fuente',
        icon: Link,
        gradient: 'from-sky-600 to-blue-400',
        glow: 'rgba(56, 189, 248, 0.6)',
        border: '#38bdf8'
    },
};

export const WorkNodeComponent = React.memo((props: any) => {
    const { data, selected, id, className } = props;

    // Selectors optimized for performance
    const mutateNodeType = useGraphStore(state => state.mutateNodeType);
    const isAntigravityActive = useGraphStore(state => state.isAntigravityActive);
    const isXRayActive = useGraphStore(state => state.isXRayActive);

    // Combined Tension Selector
    const audit = data.metadata?.audit;
    const hasHiddenConflict = (audit?.sycophancy_score || 0) > 0.5;

    const tensionLevel = useGraphStore(state => {
        const physicalTension = state.edges.filter(e =>
            (e.target === id || e.source === id) &&
            e.data?.relation === 'contradicts'
        ).length;
        const logicalTensionValue = state.logicalTension[id] ?? 0;
        const auditWeight = hasHiddenConflict ? 10 : 0;
        return physicalTension + (logicalTensionValue * 5) + auditWeight;
    });

    // Ghost/Signatures
    const isGhost = className?.includes('ghost-predicted');
    const isSigned = !!data?.metadata?.human_signature;

    // Antigravity Semantic Physics Logic: Calculate Depth (Z-Axis)
    const zDepth = useMemo(() => {
        const confidence = data.metadata?.confidence ?? 1.0;
        const isCanon = data.metadata?.pin ?? false;
        return isCanon ? 1.2 : 0.8 + (confidence * 0.2);
    }, [data.metadata]);

    const config = NODE_TYPE_CONFIG[data.type] ?? NODE_TYPE_CONFIG.note!;
    const Icon = config!.icon;

    const rawContent = (data as any).content || (data as any).statement || (data as any).rationale || (data as any).summary || (data as any).description || (data as any).name || (data as any).rule || '';
    const content = typeof rawContent === 'object' ? (rawContent.name || rawContent.content || JSON.stringify(rawContent)) : String(rawContent);

    // Neuro-Symbolic Speculative Truth Detection
    const isUncertain = content.includes('⚠️');
    const isCorrected = content.includes('🛡️ [AUTO-CORRECCIÓN:');
    const isInterrupted = content.includes('[INTERRUPT:');

    // Clean content for display
    const cleanContent = content
        .replace('⚠️', '')
        .replace(/🛡️ \[AUTO-CORRECCIÓN:.*?\]/, '🛡️ [Corregido por Integridad Semántica]')
        .replace(/\[INTERRUPT:.*?\]/, '🛑 [Inferencia Interrumpida por Seguridad]');

    const preview = cleanContent.replace(/<[^>]*>?/gm, '').slice(0, 60) + (cleanContent.length > 60 ? '...' : '');

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
                    return (
                        <button
                            key={type}
                            onClick={(e) => {
                                e.stopPropagation();
                                mutateNodeType(id, type as any);
                            }}
                            className="p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                            style={{
                                backgroundColor: isActive ? '#ffffff' : 'transparent',
                                color: isActive ? '#000000' : '#79747E',
                            }}
                            title={`Convert to ${cfg.label}`}
                        >
                            <TypeIcon size={16} />
                        </button>
                    );
                })}
            </NodeToolbar>

            {/* --- NEW SPHERICAL DESIGN --- */}
            <div
                className={`
                    group relative flex items-center justify-center
                    w-24 h-24 rounded-full 
                    transition-all duration-500 ease-out
                    bg-gradient-to-br ${config.gradient}
                    ${selected ? 'scale-125 z-50' : 'scale-100 hover:scale-110 z-0'}
                    ${isGhost ? 'opacity-40 grayscale blur-[1px]' : 'opacity-100 shadow-2xl'}
                    ${hasHiddenConflict ? 'animate-pulse' : ''}
                `}
                style={{
                    boxShadow: selected
                        ? `0 0 50px ${config.glow}, inset 0 0 20px rgba(255,255,255,0.4)`
                        : `0 10px 30px -10px ${config.glow}, inset 0 0 10px rgba(255,255,255,0.2)`,
                    border: `2px solid ${selected ? '#ffffff' : 'rgba(255,255,255,0.1)'}`,
                    transform: isAntigravityActive ? `scale(${zDepth})` : undefined,
                }}
            >
                {/* 3D Highlight (Top shine) */}
                <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

                {/* Main Icon - Centered & Large */}
                <div className="relative z-10 text-white drop-shadow-md transition-transform duration-300 group-hover:scale-110">
                    <Icon size={32} strokeWidth={2.5} />
                </div>

                {/* Floating Badge (Type Indicator) if selected */}
                {selected && (
                    <div className="absolute -top-4 bg-black/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/20 whitespace-nowrap">
                        {config.label.toUpperCase()}
                    </div>
                )}

                {/* Status Indicators (Satellites) */}
                {tensionLevel > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg z-20 animate-bounce">
                        <Zap size={12} fill="currentColor" />
                    </div>
                )}

                {/* Content Label - Below the Sphere (Cinematic Style) */}
                <div className={`
                    absolute top-full mt-3 left-1/2 -translate-x-1/2 
                    w-[200px] text-center
                    pointer-events-none
                    transition-all duration-300
                    ${selected || isAntigravityActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}
                 `}>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {config.label}
                        </span>
                        <p className="text-sm font-bold text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2">
                            {preview || "Untitled"}
                        </p>
                    </div>
                </div>

                <Handle
                    type="target"
                    position={Position.Top}
                    className="!w-3 !h-3 !border-2 !border-white/50 !rounded-full !bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="!w-3 !h-3 !border-2 !border-white/50 !rounded-full !bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                />

                {isXRayActive && hasHiddenConflict && audit && (
                    <div className="absolute top-full mt-4 left-0 w-[280px] z-50 animate-in fade-in slide-in-from-top-4">
                        <div className="glass-panel p-4 border-l-4 border-red-500 bg-neutral-900/95 text-white shadow-2xl rounded-r-2xl overflow-hidden text-left">
                            <div className="flex items-center gap-2 mb-2 text-red-400">
                                <ShieldAlert size={14} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Protocolo Abogado del Diablo</span>
                            </div>

                            <div className="mb-3">
                                <p className="text-[9px] uppercase text-gray-500 font-bold">Tesis (Complacencia):</p>
                                <p className="text-[11px] leading-relaxed italic text-gray-400 line-clamp-2">"{audit.thesis}"</p>
                            </div>

                            <div>
                                <p className="text-[9px] uppercase text-red-400 font-bold">Antítesis (Verdad Oculta):</p>
                                <p className="text-xs font-semibold text-white leading-normal">"{audit.antithesis}"</p>
                            </div>

                            <div className="mt-3 flex justify-between items-center text-[9px] text-gray-500 border-t border-white/10 pt-2">
                                <span>{audit.model_auditor} 🛡️</span>
                                <span className="font-mono">{Math.round(audit.sycophancy_score * 100)}% Match</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
});
