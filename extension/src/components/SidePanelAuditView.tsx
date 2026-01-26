/**
 * SISTEMA DE AUDITORÍA FORENSE v1.0
 * 
 * "Black Box" console for real-time architectural transparency.
 * Exposes data flows, latencies, and costs directly to the user.
 */
import { useAuditStream } from '../hooks/useAuditStream';
import { Activity, Cpu, DollarSign, Clock } from 'lucide-react';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Brain, ExternalLink, Lightbulb } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface RecallNode {
    id: string;
    content: string;
    similarity: number;
    type: string;
}

export function SidePanelAuditView() {
    const { user } = useAuth();
    const [nodes, setNodes] = useState<RecallNode[]>([]);
    const [loading, setLoading] = useState(false);

    // Auto-Recall on Mount
    useEffect(() => {
        const fetchRecall = async () => {
            setLoading(true);
            try {
                // Get current tab content again or use a prop (for now, just using Title as proxy query)
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab?.title) return;

                const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
                const { data: { session } } = await supabase.auth.getSession();

                const response = await fetch(`${serverUrl}/api/recall`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify({
                        query: tab.title, // Simple Recall by Title
                        projectId: '550e8400-e29b-41d4-a716-446655440000' // Default or grab from store
                    })
                });

                const res = await response.json();
                if (res.success) setNodes(res.nodes);

            } catch (e) {
                console.error('Recall failed', e);
            } finally {
                setLoading(false);
            }
        };
        fetchRecall();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-cyan-800/50 h-full bg-slate-900 font-mono">
                <Brain className="w-8 h-8 mb-4 animate-pulse text-purple-500" />
                <p className="text-xs uppercase tracking-widest text-center">
                    Connecting Neurons...<br />
                    [Active Recall]
                </p>
            </div>
        );
    }

    if (nodes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-slate-500 h-full bg-slate-900">
                <Lightbulb className="w-8 h-8 mb-4 opacity-50" />
                <p className="text-xs text-center">No connections found yet.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 border-t border-purple-900/30">
            {/* Header */}
            <div className="p-3 bg-slate-950/50 border-b border-purple-900/30 flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center">
                    <Brain className="w-3 h-3 mr-2" /> Neural Context
                </h3>
                <span className="text-[9px] text-slate-500">{nodes.length} Matches</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {nodes.map((node) => (
                    <div key={node.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[9px] font-bold uppercase text-purple-300 bg-purple-900/20 px-1.5 py-0.5 rounded">
                                {node.type}
                            </span>
                            <span className="text-[9px] text-green-400 font-mono">
                                {(node.similarity * 100).toFixed(0)}% Match
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                            {typeof node.content === 'string' ? node.content : JSON.stringify(node.content)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
