import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { MediatorCard, AnalysisReport } from './MediatorCard';
import { VisualDiffView } from './VisualDiffView';
import { Users, Send, CheckCircle2, XCircle, Info, Inbox, Layers, GitBranch } from 'lucide-react';

export const CollaborationInbox = ({ projectId }: { projectId: string }) => {
    const [crs, setCrs] = useState<any[]>([]);
    const [selectedCr, setSelectedCr] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [diffData, setDiffData] = useState<{ sourceNodes: any[], targetNodes: any[] }>({ sourceNodes: [], targetNodes: [] });
    const [fetchingDiff, setFetchingDiff] = useState(false);

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

    // 2. Cargar Nodos para Diff cuando se selecciona una CR
    useEffect(() => {
        if (!selectedCr) {
            setDiffData({ sourceNodes: [], targetNodes: [] });
            return;
        }

        const fetchDiffNodes = async () => {
            setFetchingDiff(true);
            const supabase = await createClient();
            const [src, tgt] = await Promise.all([
                supabase.from('work_nodes').select('*').eq('project_id', selectedCr.source_branch_id),
                supabase.from('work_nodes').select('*').eq('project_id', selectedCr.target_branch_id)
            ]);

            setDiffData({
                sourceNodes: src.data || [],
                targetNodes: tgt.data || []
            });
            setFetchingDiff(false);
        };

        fetchDiffNodes();
    }, [selectedCr]);

    const handleMerge = async () => {
        if (!selectedCr) return;
        alert("Integrando Cambios en la Rama Principal...");
    };

    // Helper: Encontrar nodos conflictivos/editados
    const getEditedNodes = () => {
        const edits: any[] = [];
        diffData.sourceNodes.forEach(sn => {
            const tn = diffData.targetNodes.find(n => n.id === sn.id);
            if (tn) {
                const sC = JSON.stringify(sn.content);
                const tC = JSON.stringify(tn.content);
                if (sC !== tC) {
                    edits.push({
                        id: sn.id,
                        type: sn.type,
                        oldVal: tC,
                        newVal: sC
                    });
                }
            }
        });
        return edits;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
            <Inbox className="w-10 h-10 text-blue-100 mb-4" />
            <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Sincronizando Mesa de Decisiones</p>
        </div>
    );

    const editedNodes = getEditedNodes();

    return (
        <div className="flex h-[800px] border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-2xl relative">

            {/* SIDEBAR: Lista de Propuestas */}
            <div className="w-80 border-r border-gray-100 bg-gray-50/30 flex flex-col">
                <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-black text-gray-900 flex items-center gap-2 text-lg">
                            <GitBranch className="w-5 h-5 text-blue-500" />
                            Propuestas
                        </h2>
                        <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                            {crs.length}
                        </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Flujo de Evolución</p>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {crs.length === 0 ? (
                        <div className="p-10 text-center text-gray-300 italic text-xs">No hay cambios pendientes.</div>
                    ) : (
                        crs.map(cr => (
                            <div
                                key={cr.id}
                                onClick={() => setSelectedCr(cr)}
                                className={`p-5 rounded-2xl mb-2 cursor-pointer transition-all duration-300 group
                                ${selectedCr?.id === cr.id ?
                                        'bg-white shadow-lg border-l-4 border-l-blue-500 ring-1 ring-gray-100' :
                                        'hover:bg-white hover:shadow-md border-l-4 border-l-transparent'}`}
                            >
                                <h4 className={`font-bold text-sm mb-3 truncate transition-colors ${selectedCr?.id === cr.id ? 'text-blue-600' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                    {cr.title}
                                </h4>
                                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                                    <span className="text-gray-400">{cr.author?.email?.split('@')[0]}</span>
                                    <span className={`px-2 py-0.5 rounded-full
                                        ${cr.semantic_check_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {cr.semantic_check_passed ? '✓ Segura' : '⚠ Riesgo'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MAIN: Detalle y Mediación */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {selectedCr ? (
                    <>
                        <div className="p-10 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">Change Request #{selectedCr.id.slice(0, 4)}</span>
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-4 leading-none">{selectedCr.title}</h1>
                            <p className="text-gray-500 text-base max-w-2xl leading-relaxed font-medium">{selectedCr.description || "Esta propuesta busca mejorar la coherencia del grafo mediante una actualización semántica supervisada."}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
                            <div className="max-w-4xl mx-auto">
                                <div className="mb-12">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Veredicto del Agente Mediador</span>
                                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                                    </div>
                                    <MediatorCard report={selectedCr.analysis_report} />
                                </div>

                                {fetchingDiff ? (
                                    <div className="space-y-4 animate-pulse">
                                        <div className="h-4 w-48 bg-gray-100 rounded"></div>
                                        <div className="h-32 bg-gray-50 rounded-2xl"></div>
                                    </div>
                                ) : editedNodes.length > 0 ? (
                                    <div className="mt-12">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="bg-gray-900 p-2 rounded-lg">
                                                <Layers className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Diferencial Semántico</h3>
                                                <p className="text-[10px] text-gray-400 font-medium">Comparación Forense: Rama Propuesta vs. Rama Principal</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {editedNodes.map(node => (
                                                <VisualDiffView
                                                    key={node.id}
                                                    nodeTitle={`${node.type.toUpperCase()}`}
                                                    oldText={node.oldVal}
                                                    newText={node.newVal}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-12 p-10 border-2 border-dashed border-gray-50 rounded-3xl text-center">
                                        <p className="text-gray-300 text-sm font-medium italic">No se detectaron cambios estructurales en los nodos existentes.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Botonera Premium */}
                        <div className="p-8 border-t border-gray-50 bg-white flex justify-end items-center gap-6">
                            <button className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest">Cerrar sin cambios</button>
                            <div className="h-8 w-[1px] bg-gray-100"></div>
                            <button className="px-8 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all uppercase tracking-widest">Rechazar</button>

                            <button
                                onClick={handleMerge}
                                disabled={!selectedCr.semantic_check_passed}
                                className={`px-10 py-4 rounded-2xl font-black text-sm shadow-2xl transition-all transform active:scale-95 uppercase tracking-widest
                                    ${selectedCr.semantic_check_passed ?
                                        'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1' :
                                        'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100'}`}
                            >
                                {selectedCr.semantic_check_passed ? "Aprobar Fusión" : "Bloqueado por Invariantes"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-20">
                        <div className="relative mb-10">
                            <div className="absolute inset-0 bg-blue-100 blur-3xl rounded-full opacity-20 animate-pulse"></div>
                            <Users className="w-24 h-24 text-gray-100 relative z-10" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter mb-4">Centro de Consenso</h3>
                        <p className="text-gray-400 text-sm max-w-sm leading-relaxed font-medium">
                            Selecciona una propuesta para activar el motor de comparación semántica y el Agente Mediador.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
