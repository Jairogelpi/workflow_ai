'use client';
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useGraphStore } from '../../store/useGraphStore';

export default function NodeEditor() {
    const { selectedNodeId, nodes, updateNodeContent } = useGraphStore();

    // Find the current selected node data
    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        onUpdate: ({ editor }) => {
            if (selectedNodeId) {
                updateNodeContent(selectedNodeId, editor.getHTML());
            }
        },
    });

    // Load node content when selection changes
    useEffect(() => {
        if (editor && selectedNode) {
            const data = selectedNode.data;
            let content = '';

            const d = data as any;
            if ('content' in d) content = d.content;
            else if ('statement' in d) content = d.statement;
            else if ('rationale' in d) content = d.rationale;
            else if ('summary' in d) content = d.summary;
            else if ('description' in d) content = d.description || '';
            else if ('details' in d) content = d.details || '';
            else if ('premise' in d) content = d.premise;
            else if ('rule' in d) content = d.rule;
            else if ('name' in d) content = d.name;

            // Only update if content is actually different
            if (editor.getHTML() !== content) {
                editor.commands.setContent(content || '');
            }
        } else if (editor && !selectedNode) {
            editor.commands.setContent('<p>Select a node to edit...</p>');
        }
    }, [selectedNodeId, selectedNode, editor]);

    if (!editor) return null;

    return (
        <div className="prose dark:prose-invert max-w-none h-full p-4 overflow-auto">
            {!selectedNodeId && (
                <div className="text-slate-500 italic">No node selected</div>
            )}
            <EditorContent editor={editor} className="h-full outline-none" />
        </div>
    );
}
