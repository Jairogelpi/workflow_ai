'use client';

import React, { useEffect, useState } from 'react';
import { Download, FileStack, ChevronRight, ExternalLink } from 'lucide-react';
import { createClient } from '../../lib/supabase';
import { useGraphStore } from '../../store/useGraphStore';

interface SourceNodeViewProps {
    nodeId: string;
    metadata: any;
}

export default function SourceNodeView({ nodeId, metadata }: SourceNodeViewProps) {
    const [chunks, setChunks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { nodes, setSelectedNode } = useGraphStore();

    useEffect(() => {
        async function fetchChunks() {
            setLoading(true);
            const supabase = createClient();

            // Fetch fragments that are 'part_of' this source
            // We can check work_edges for source_node_id (excerpt) -> target_node_id (this node)
            const { data: edges, error } = await supabase
                .from('work_edges')
                .select('source_node_id')
                .eq('target_node_id', nodeId)
                .eq('relation', 'part_of');

            if (edges && edges.length > 0) {
                const chunkIds = edges.map(e => e.source_node_id);
                // Fetch the actual excerpt nodes
                const { data: excerptNodes } = await supabase
                    .from('work_nodes')
                    .select('*')
                    .in('id', chunkIds)
                    .order('updated_at', { ascending: true }); // Approximate order if index isn't directly in metadata

                setChunks(excerptNodes || []);
            }
            setLoading(false);
        }

        if (nodeId) fetchChunks();
    }, [nodeId]);

    const handleDownload = async () => {
        if (!metadata.storage_path) return;
        const supabase = createClient();
        const { data, error } = await supabase.storage
            .from('artifacts')
            .createSignedUrl(metadata.storage_path, 60); // 60 seconds link

        if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {/* Action Bar */}
            <div className="flex items-center gap-2">
                <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-900/20"
                >
                    <Download size={16} />
                    Download Original
                </button>
            </div>

            {/* Chunks / Fragments List */}
            <div>
                <h3 className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-3 flex items-center gap-2">
                    <FileStack size={12} className="text-blue-500" />
                    Knowledge Fragments ({chunks.length})
                </h3>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                    {loading ? (
                        <div className="p-4 text-center text-xs text-slate-600 italic">Digesting chunks...</div>
                    ) : chunks.length === 0 ? (
                        <div className="p-4 border border-dashed border-slate-800 rounded-lg text-center text-xs text-slate-600 italic">
                            No fragments processed yet.
                        </div>
                    ) : (
                        chunks.map((chunk, idx) => (
                            <div
                                key={chunk.id}
                                onClick={() => setSelectedNode(chunk.id)}
                                className="group p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg hover:border-blue-500/50 hover:bg-slate-900/60 cursor-pointer transition-all flex items-start gap-3"
                            >
                                <div className="flex-shrink-0 w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 group-hover:text-slate-200">
                                        {(chunk.content as any).content}
                                    </p>
                                </div>
                                <ChevronRight size={14} className="text-slate-700 group-hover:text-blue-500 mt-1" />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Technical Metadata */}
            <div className="p-4 bg-slate-950/20 border border-slate-800/40 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-[9px] text-slate-600 block uppercase tracking-tighter">Integrity Hash</span>
                        <code className="text-[9px] text-slate-500 font-mono truncate block" title={metadata.file_hash}>
                            {metadata.file_hash?.slice(0, 12)}...
                        </code>
                    </div>
                    <div>
                        <span className="text-[9px] text-slate-600 block uppercase tracking-tighter">Size (Lossless)</span>
                        <p className="text-[10px] text-slate-400 font-bold">
                            {(metadata.original_size / 1024).toFixed(1)} KB
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
