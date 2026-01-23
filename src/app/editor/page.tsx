'use client';

import { useSearchParams } from 'next/navigation';
import NodeEditor from '../../components/editor/NodeEditor';
import { Suspense } from 'react';

/**
 * Editor Page (Focus Mode)
 * 
 * A distraction-free editing environment that runs in a separate tab.
 * It is triggered via the "Pop Out" button in the FloatingPanel.
 * 
 * It reuses the `NodeEditor` component but renders it full-screen.
 */
function EditorPageContent() {
    const searchParams = useSearchParams();
    const nodeId = searchParams.get('nodeId');

    if (!nodeId) return <div className="p-10 text-slate-500">No node selected</div>;

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col">
            {/* Barra superior simple para indicar que estás en modo Focus */}
            <div className="h-12 border-b border-slate-800 flex items-center px-4 bg-slate-900">
                <span className="font-mono text-xs text-emerald-500">FOCUS MODE // NODE {nodeId}</span>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {/* Reutilizamos el MISMO componente de edición */}
                <NodeEditor />
            </div>
        </div>
    );
}

export default function EditorPage() {
    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <EditorPageContent />
        </Suspense>
    );
}
