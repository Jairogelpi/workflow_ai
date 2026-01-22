import React from 'react';
import { diff_match_patch } from 'diff-match-patch';

export const VisualDiffView = ({ oldText, newText, nodeTitle }: { oldText: string, newText: string, nodeTitle?: string }) => {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(diffs);
    const html = dmp.diff_prettyHtml(diffs);

    return (
        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm mb-4 transition-all hover:border-blue-100 group">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    Evidencia Forense del Cambio {nodeTitle ? `— ${nodeTitle}` : ''}
                </h4>
                <span className="text-[9px] font-bold text-gray-300 group-hover:text-blue-300 transition-colors uppercase italic">
                    Visual Diff 2026 Engine
                </span>
            </div>

            <div
                className="diff-content font-mono text-sm leading-relaxed p-4 bg-gray-50/50 rounded-lg overflow-x-auto whitespace-pre-wrap selection:bg-blue-100"
                dangerouslySetInnerHTML={{ __html: html }}
            />

            <style>{`
        .diff-content ins { 
            background: #d1fae5; 
            text-decoration: none; 
            color: #065f46; 
            padding: 1px 2px;
            border-radius: 2px;
            font-weight: 600;
        } 
        .diff-content del { 
            background: #fee2e2; 
            color: #991b1b; 
            text-decoration: line-through;
            padding: 1px 2px;
            border-radius: 2px;
            opacity: 0.8;
        } 
      `}</style>
        </div>
    );
};
