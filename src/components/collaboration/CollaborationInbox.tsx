import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { MediatorCard, AnalysisReport } from './MediatorCard';
import { Users, Send, CheckCircle2, XCircle, Info, Inbox } from 'lucide-react';

export const CollaborationInbox = ({ projectId }: { projectId: string }) => {
    const [crs, setCrs] = useState<any[]>([]);
    const [selectedCr, setSelectedCr] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 1. Cargar Solicitudes
    useEffect(() => {
        const fetchCRs = async () => {
            const supabase = await createClient();
            const { data } = await supabase
                .from('change_requests')
                .select('*, author:author_id(email)')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            setCrs(data || []);
            setLoading(false);
        };

        fetchCRs();
    }, [projectId]);

    const handleMerge = async () => {
        if (!selectedCr) return;
        alert("Ejecutando MergeEngine en el Kernel...");
        // Producción: llamar a endpoint de API que invoque MergeEngine.ts
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed">
            <p className="text-gray-400 animate-pulse font-medium">Sincronizando Mesa de Decisiones...</p>
        </div>
    );

    return (
        <div className="flex h-[700px] border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xl">

            {/* SIDEBAR: Lista de Propuestas */}
            <div className="w-80 border-r bg-gray-50/50 flex flex-col">
                <div className="p-5 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Inbox className="w-4 h-4 text-blue-500" />
                            Inbox de Cambios
                        </h2>
                        <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {crs.length}
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-500">Propuestas de evolución del grafo</p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {crs.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-xs text-gray-400 italic">No hay cambios pendientes por ahora.</p>
                        </div>
                    ) : (
                        crs.map(cr => (
                            <div
                                key={cr.id}
                                onClick={() => setSelectedCr(cr)}
                                className={`p-5 border-b cursor-pointer transition-all duration-200
                  ${selectedCr?.id === cr.id ?
                                        'bg-white border-l-4 border-l-blue-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]' :
                                        'hover:bg-white/80'}`}
                            >
                                <h4 className={`font-bold text-sm mb-2 truncate ${selectedCr?.id === cr.id ? 'text-blue-600' : 'text-gray-800'}`}>
                                    {cr.title}
                                </h4>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                                            {cr.author?.email?.[0].toUpperCase()}
                                        </div>
                                        <span className="text-[11px] text-gray-500 font-medium">
                                            {cr.author?.email?.split('@')[0]}
                                        </span>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter
                    ${cr.semantic_check_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {cr.semantic_check_passed ? '✓ Safe' : '⚠ Risk'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MAIN: Detalle y Mediación */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedCr ? (
                    <>
                        <div className="p-8 border-b bg-gray-50/30">
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                                    {selectedCr.title}
                                </h1>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors">
                                        <Info className="w-3.5 h-3.5" /> Detalles
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm max-w-2xl leading-relaxed">
                                {selectedCr.description || "Sin descripción proporcionada."}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-transparent to-gray-50/50">
                            <div className="max-w-3xl mx-auto">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="h-[1px] flex-1 bg-gray-100"></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Veredicto de Consenso IA</span>
                                    <div className="h-[1px] flex-1 bg-gray-100"></div>
                                </div>

                                <MediatorCard report={selectedCr.analysis_report} />

                                <div className="mt-8 p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <h5 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Flujo de Discusión</h5>
                                    <div className="text-center py-6">
                                        <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2 mx-auto transition-all transform hover:scale-105">
                                            <Send className="w-4 h-4" /> Iniciar Hilo Contextual
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="p-6 border-t bg-white flex justify-end gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                            <button className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-200">
                                Rechazar
                            </button>

                            <button
                                onClick={handleMerge}
                                disabled={!selectedCr.semantic_check_passed}
                                className={`px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all transform active:scale-95 flex items-center gap-2
                    ${selectedCr.semantic_check_passed ?
                                        'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 cursor-pointer' :
                                        'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'}`}
                            >
                                {selectedCr.semantic_check_passed ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Aprobar Fusión</>
                                ) : (
                                    <><XCircle className="w-4 h-4" /> Bloqueado por Invariantes</>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-12">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Mesa de Decisiones Activa</h3>
                        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                            Selecciona una propuesta en el panel izquierdo para recibir el análisis del Agente Mediador.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
