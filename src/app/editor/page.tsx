import GraphCanvas from '../../components/graph/GraphCanvas';
import NodeEditor from '../../components/editor/NodeEditor';
import Sidebar from '../../components/layout/Sidebar';

export default function EditorPage() {
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
