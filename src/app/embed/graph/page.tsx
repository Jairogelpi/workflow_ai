'use client';

import dynamic from 'next/dynamic';
import { useGraphStore } from '@/store/useGraphStore';
import { useEffect } from 'react';

// Dynamic import for 3D Engine (Client Side Only)
const ForceGraph3D = dynamic(() => import('@/components/graph/ForceGraph3D'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-screen text-xs uppercase tracking-widest text-slate-400">Loading Universe...</div>
});

export default function EmbedGraphPage() {
    const fetchGraph = useGraphStore(state => state.fetchGraph);

    useEffect(() => {
        // Force refresh on mount (Extension context)
        fetchGraph('550e8400-e29b-41d4-a716-446655440000');
    }, []);

    return (
        <div className="w-full h-screen bg-slate-950 overflow-hidden relative">
            {/* Minimal Header for Context */}
            <div className="absolute top-0 left-0 right-0 z-10 p-2 text-center pointer-events-none">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] bg-slate-900/50 px-2 py-1 rounded-full backdrop-blur-sm">
                    Live Graph Environment
                </span>
            </div>

            <ForceGraph3D />
        </div>
    );
}
