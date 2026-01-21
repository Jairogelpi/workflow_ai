'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function NodeEditor() {
    const editor = useEditor({
        extensions: [StarterKit],
        content: '<h2>Write your Claim here...</h2><p>Supports markdown-like shortcuts.</p>',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
            },
        },
    });

    return (
        <div className="border border-gray-300 rounded-md p-4 h-full bg-white text-black overflow-auto">
            <EditorContent editor={editor} />
        </div>
    );
}
