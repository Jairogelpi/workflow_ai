import React from 'react';
import { AlertTriangle, CheckCircle, BrainCircuit, ShieldAlert, ArrowRight } from 'lucide-react';

export interface AnalysisReport {
    summary: string;
    category: 'logic_violation' | 'content_conflict' | 'clean_merge';
    severity: 'high' | 'medium' | 'low';
    suggestions: string[];
    ai_confidence: number;
}

export const MediatorCard = ({ report }: { report: AnalysisReport | null }) => {
    if (!report) return (
        <div className="p-4 border rounded-lg bg-gray-50 flex items-center gap-3 animate-pulse">
            <BrainCircuit className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500 font-medium">El Mediador está analizando el impacto lógico...</span>
        </div>
    );

    const isViolation = report.category === 'logic_violation';
    const isClean = report.category === 'clean_merge';

    return (
        <div className={`p-5 rounded-xl border-l-4 shadow-sm mb-4 transition-all duration-300 transform hover:scale-[1.01]
      ${isViolation ? 'bg-red-50 border-red-500 shadow-red-100' :
                isClean ? 'bg-green-50 border-green-500 shadow-green-100' : 'bg-amber-50 border-amber-500 shadow-amber-100'}`}>

            {/* Header del Agente */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-full ${isViolation ? 'bg-red-100' : isClean ? 'bg-green-100' : 'bg-amber-100'}`}>
                    {isViolation ? <ShieldAlert className="w-6 h-6 text-red-600" /> :
                        isClean ? <CheckCircle className="w-6 h-6 text-green-600" /> :
                            <AlertTriangle className="w-6 h-6 text-amber-600" />}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                        {isViolation ? 'Bloqueo de Integridad (Invariante)' :
                            isClean ? 'Luz Verde Semántica' : 'Conflicto de Contenido Detectado'}
                    </h3>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 font-mono uppercase tracking-wider">
                        <BrainCircuit className="w-3 h-3" /> IA Mediadora • Confianza: {Math.round(report.ai_confidence * 100)}%
                    </p>
                </div>
            </div>

            {/* El Veredicto Humano */}
            <p className="text-gray-800 text-sm leading-relaxed mb-5 font-medium">
                {report.summary}
            </p>

            {/* Sugerencias Tácticas */}
            {!isClean && (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">Sugerencias del Mediador</p>
                    <ul className="space-y-3">
                        {report.suggestions.map((sug, i) => (
                            <li key={i} className="text-sm flex items-start gap-2.5 text-gray-700">
                                <ArrowRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span>{sug}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
