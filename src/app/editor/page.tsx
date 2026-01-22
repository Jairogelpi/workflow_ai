'use client';

import { useEffect } from 'react';
import GraphCanvas from '../../components/graph/GraphCanvas';
import NodeEditor from '../../components/editor/NodeEditor';
import Sidebar from '../../components/layout/Sidebar';
import { useGraphStore } from '../../store/useGraphStore';

const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000000';

export default function EditorPage() {
    const loadProject = useGraphStore((state) => state.loadProject);

    useEffect(() => {
        loadProject(DEFAULT_PROJECT_ID);
    }, [loadProject]);

    return (
        <main className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-200 font-sans">
            {/* Sidebar - Browser & Discovery */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative min-w-0">
                {/* Graph Area */}
                <div className="flex-1 border-r border-slate-800 relative group">
                    <GraphCanvas />
                </div>
            </div>

            {/* Editor Panel - Knowledge Refinement */}
            <aside className="w-96 border-l border-slate-800 flex flex-col shadow-2xl z-20">
                <NodeEditor />
            </aside>
        </main>
    );
}
