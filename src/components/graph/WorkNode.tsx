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
        label: 'Nota',
        icon: MessageSquare,
        light: { bg: '#F8F9FA', text: '#3C4043', border: '#DADCE0' },
        dark: { bg: '#4A4458', text: '#E8DEF8', border: '#938F99' }
    },
    claim: {
        label: 'Afirmación',
        icon: ShieldAlert,
        light: { bg: '#E8F0FE', text: '#1967D2', border: '#4285F4' }, // Axiom Blue
        dark: { bg: '#004A77', text: '#C2E7FF', border: '#0077B6' }
    },
    evidence: {
        label: 'Evidencia',
        icon: CheckCircle2,
        light: { bg: '#E6F4EA', text: '#137333', border: '#34A853' }, // Axiom Green
        dark: { bg: '#0D5D2C', text: '#C4EED0', border: '#1B8A45' }
    },
    decision: {
        label: 'Decisión',
        icon: Brain,
        light: { bg: '#FEF7E0', text: '#B06000', border: '#FBBC04' }, // Axiom Yellow
        dark: { bg: '#594F05', text: '#FEF7C3', border: '#8D7E0A' }
    },
    idea: {
        label: 'Idea',
        icon: Lightbulb,
        light: { bg: '#E6F4EA', text: '#137333', border: '#34A853' },
        dark: { bg: '#0D5D2C', text: '#E7F8ED', border: '#2E7D32' }
    },
    task: {
        label: 'Tarea',
        icon: CheckSquare,
        light: { bg: '#FAFAFA', text: '#3C4043', border: '#DADCE0' },
        dark: { bg: '#4A4458', text: '#E8DEF8', border: '#7E57C2' }
    },
    artifact: {
        label: 'Entregable',
        icon: FileText,
        light: { bg: '#FFF7E0', text: '#B06000', border: '#FBBC04' },
        dark: { bg: '#5D4037', text: '#FFE0B2', border: '#8D6E63' }
    },
    assumption: {
        label: 'Supuesto',
        icon: HelpCircle,
        light: { bg: '#FCE8E6', text: '#C5221F', border: '#EA4335' }, // Axiom Red
        dark: { bg: '#880E4F', text: '#FCE4EC', border: '#AD1457' }
    },
    constraint: {
        label: 'Restricción',
        icon: Lock,
        light: { bg: '#F1F3F4', text: '#3C4043', border: '#DADCE0' },
        dark: { bg: '#4E342E', text: '#EFEBE9', border: '#795548' }
    },
    source: {
        label: 'Fuente',
        icon: Link,
        light: { bg: '#E8F0FE', text: '#1967D2', border: '#4285F4' },
        dark: { bg: '#0D47A1', text: '#E3F2FD', border: '#1976D2' }
    },
};


export const WorkNodeComponent = React.memo((props: any) => {
    const { data, selected, id, className } = props;

    // Selectors optimized for performance (Primitive return values avoid re-renders)
    const mutateNodeType = useGraphStore(state => state.mutateNodeType);
    const isAntigravityActive = useGraphStore(state => state.isAntigravityActive);
    const isXRayActive = useGraphStore(state => state.isXRayActive);

    // Combined Tension Selector: Only triggers re-render if the numeric value changes
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

    // [Phase 12] Ghost Node Detection
    const isGhost = className?.includes('ghost-predicted');
    const isSigned = !!data?.metadata?.human_signature;

    // Antigravity Semantic Physics Logic: Calculate Depth (Z-Axis)

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

    // Neuro-Symbolic Interception Detection
    const isNeuroIntercepted = content.includes('⚠️ INTERVENCIÓN LÓGICA:');

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
                    min-w-[200px] max-w-[280px] rounded-[32px] 
                    transition-all duration-300 ease-out
                    ${isGhost ? 'opacity-40 grayscale' : ''}
                    ${selected ? 'scale-105 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] ring-2 ring-blue-500/20' : 'shadow-[0_8px_30px_rgba(0,0,0,0.04)]'}
                    ${data.metadata.origin === 'ai' && !isGhost ? 'opacity-80 border-dashed border-slate-200' : ''}
                    ${hasHiddenConflict && !isXRayActive ? 'animate-heartbeat ring-2 ring-amber-500/50' : ''}
                    ${hasHiddenConflict && isXRayActive ? 'ring-4 ring-red-600 shadow-[0_0_30px_rgba(220,38,38,0.6)]' : ''}
                    ${isNeuroIntercepted ? 'ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}
                `}
                style={{
                    backgroundColor: colors.bg,
                    border: `1.5px solid ${selected ? colors.text : colors.border}`,
                    transform: isAntigravityActive ? `scale(${zDepth})` : undefined,
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

                {/* Simplified Tension Overlay */}
                {tensionLevel > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-400 text-white rounded-full p-1.5 shadow-md z-10 animate-bounce">
                        <Zap size={10} fill="currentColor" />
                    </div>
                )}

                {isNeuroIntercepted && (
                    <div className="absolute -top-10 left-0 flex items-center gap-2 bg-red-900/90 text-red-100 px-3 py-1.5 rounded-full border border-red-500/40 backdrop-blur-xl shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-300">
                        <BrainCircuit size={14} className="animate-pulse text-red-400" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Intervención Lógica Activa</span>
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

                {/* [AGREGAR] Capa de Revelación de Verdad (Solo en Rayos X) */}
                {isXRayActive && hasHiddenConflict && audit && (
                    <div className="absolute top-full mt-4 left-0 w-[280px] z-50 animate-in fade-in slide-in-from-top-4">
                        <div className="glass-panel p-4 border-l-4 border-red-500 bg-neutral-900/95 text-white shadow-2xl rounded-r-2xl overflow-hidden">
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
