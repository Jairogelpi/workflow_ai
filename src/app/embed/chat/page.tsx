'use client';

import dynamic from 'next/dynamic';

const SwarmChat = dynamic(() => import('@/components/collaboration/SwarmChat').then(m => m.SwarmChat), {
    ssr: false,
    loading: () => <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading Chat...</div>
});

export default function EmbedChatPage() {
    return (
        <div className="w-full h-screen bg-white flex flex-col">
            {/* Minimal Header */}
            <div className="p-2 border-b flex justify-between items-center bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Axiom Swarm Uplink
                </span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            </div>

            <div className="flex-1 overflow-hidden relative">
                <SwarmChat />
            </div>
        </div>
    );
}
