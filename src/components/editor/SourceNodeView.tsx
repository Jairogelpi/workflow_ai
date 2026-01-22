'use client';
import { useGraphStore } from '../../store/useGraphStore';
import { Eye, FileText } from 'lucide-react';

/**
 * SourceNodeView
 * 
 * Renders a 'resource' node (PDF, Text, etc.) within the NodeEditor.
 * It provides a preview card and an "OPEN IN OS" button that triggers the Floating Window.
 */
export default function SourceNodeView({ node }: { node: any }) {
    const openWindow = useGraphStore(s => s.openWindow);

    // Construir URL del archivo en Supabase Storage
    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/artifacts/${node.metadata?.storage_path}`;

    return (
        <div className="p-4 border border-slate-800 rounded-lg bg-slate-900/50">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-500/20 rounded-md text-indigo-400">
                    <FileText size={18} />
                </div>
                <div className="overflow-hidden">
                    <h4 className="text-sm font-medium text-slate-200 truncate">{node.metadata?.file_name}</h4>
                    <p className="text-xs text-slate-500">{(node.metadata?.original_size / 1024).toFixed(1)} KB</p>
                </div>
            </div>

            {/* BOTÓN FUTURISTA */}
            <button
                onClick={() => openWindow({
                    id: node.id,
                    title: `SOURCE // ${node.metadata?.file_name.toUpperCase()}`,
                    contentUrl: fileUrl,
                    contentType: node.metadata?.mime_type === 'application/pdf' ? 'pdf' : 'text',
                    mimeType: node.metadata?.mime_type,
                    textContent: node.metadata?.text_content || node.content // Fallback to main content if metadata missing
                })}
                className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
                <Eye size={14} />
                OPEN IN OS
            </button>
        </div>
    );
}
