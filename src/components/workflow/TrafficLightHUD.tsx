import React from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { AlertTriangle, Lock, Unlock, CheckCircle, FileText, Activity } from 'lucide-react';
import { DraggableHUD } from '../ui/DraggableHUD';

export const TrafficLightHUD = () => {
    const { projectPhase, setPhase, signBlueprint, currentUser } = useGraphStore();

    // Mapping Phases to Visuals
    const PHASE_CONFIG = {
        'JAM': {
            label: 'Fase 1: JAM',
            color: 'bg-red-500',
            textColor: 'text-red-500',
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: <Activity size={16} />,
            description: 'Ideación libre. IA restringida a notas.'
        },
        'BLUEPRINT': {
            label: 'Fase 2: BLUEPRINT',
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600',
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            icon: <FileText size={16} />,
            description: 'Planificación técnica. Requiere autorización.'
        },
        'BUILD': {
            label: 'Fase 3: BUILD',
            color: 'bg-green-500',
            textColor: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-200',
            icon: <CheckCircle size={16} />,
            description: 'Ejecución activa. Sistema desbloqueado.'
        }
    };

    const currentConfig = PHASE_CONFIG[projectPhase];

    return (
        <DraggableHUD id="traffic-light-hud" title="Fases" defaultPosition={{ x: window.innerWidth / 2 - 150, y: window.innerHeight - 150 }}>
            <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-4 duration-500">
                {/* Main HUD Capsule */}
                <div className={`flex items-center gap-4 px-4 py-2 bg-white rounded-full shadow-2xl border ${currentConfig.border} backdrop-blur-md`}>

                    {/* Traffic Lights */}
                    <div className="flex items-center gap-1.5 px-2 border-r border-slate-100">
                        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${projectPhase === 'JAM' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] scale-110' : 'bg-slate-200'}`} />
                        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${projectPhase === 'BLUEPRINT' ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)] scale-110' : 'bg-slate-200'}`} />
                        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${projectPhase === 'BUILD' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] scale-110' : 'bg-slate-200'}`} />
                    </div>

                    {/* Status Text */}
                    <div className="flex flex-col">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${currentConfig.textColor}`}>
                            {currentConfig.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium hidden md:block">
                            {currentConfig.description}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
                        {projectPhase === 'JAM' && (
                            <button
                                onClick={() => setPhase('BLUEPRINT')}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold uppercase rounded-full transition-colors flex items-center gap-1"
                            >
                                <span>Estructurar</span>
                                <ChevronRightMini />
                            </button>
                        )}

                        {projectPhase === 'BLUEPRINT' && (
                            <button
                                onClick={() => signBlueprint({ timestamp: new Date() })}
                                className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 text-[10px] font-bold uppercase rounded-full transition-all shadow-sm hover:shadow-md flex items-center gap-1 animate-pulse"
                            >
                                <Lock size={10} />
                                <span>Firmar Plan</span>
                            </button>
                        )}

                        {projectPhase === 'BUILD' && (
                            <>
                                <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                                    <Unlock size={10} />
                                    <span className="text-[10px] font-bold">Activo</span>
                                </div>
                                <button
                                    onClick={() => useGraphStore.getState().compilePRD('current-project')}
                                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                                    title="Compilar Documentación (PRD)"
                                >
                                    <FileText size={14} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DraggableHUD>
    );
};

const ChevronRightMini = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
    </svg>
);
