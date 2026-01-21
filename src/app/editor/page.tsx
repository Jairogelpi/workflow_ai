import NodeEditor from '../../components/editor/NodeEditor';

export default function EditorPage() {
    return (
        <div className="w-full h-full p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Node Editor</h1>
            <div className="border border-slate-200 dark:border-slate-800 rounded min-h-[500px]">
                <NodeEditor />
            </div>
        </div>
    );
}
