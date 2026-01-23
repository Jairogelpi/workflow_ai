'use client';
import React, { useState } from 'react';
import {
    LayoutGrid,
    Terminal,
    Cpu,
    Share2,
    Settings,
    Search,
    Wifi,
    Battery,
    Clock
} from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore';

interface DesktopProps {
    children: React.ReactNode;
}

export function Desktop({ children }: DesktopProps) {
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-white text-slate-800 flex flex-col font-sans select-none">
            {/* Clean App Header - Inspired by Google apps */}
            <div className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-10 bg-white/50 backdrop-blur-2xl z-[1001]">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-4 group cursor-pointer hover:opacity-80 transition-opacity">
                        <img src="/logo.png" alt="Axiom" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-medium tracking-tight text-slate-900 border-l border-slate-200 pl-4">GraphOs</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold tracking-widest uppercase">
                        <Cpu size={14} />
                        <span>Agente Activo</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer">
                        <Settings size={20} />
                    </div>
                </div>
            </div>

            {/* Main Application Workspace */}
            <div className="flex-1 relative z-0 pt-16">
                {children}
            </div>

            {/* Simple Navigation Dock - Floating like a Google Search Bar */}
            <div className="absolute bottom-10 inset-x-0 flex justify-center z-[1001] pointer-events-none">
                <div className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] pointer-events-auto">
                    <DockIcon icon={<LayoutGrid size={24} />} label="Tus Ideas" active />
                    <DockIcon icon={<Share2 size={24} />} label="Red" />
                    <DockIcon icon={<Search size={24} />} label="Buscar" highlight />
                </div>
            </div>

            {/* Background Atmosphere - Clean White Space */}
            <div className="absolute inset-0 z-[-1] pointer-events-none bg-white">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-50/20 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-yellow-50/20 blur-[150px] rounded-full" />
            </div>
        </div>
    );
}

function DockIcon({ icon, label, active = false, highlight = false }: any) {
    return (
        <div className="relative group flex flex-col items-center">
            <div className={`p-4 rounded-full transition-all duration-300 hover:bg-slate-100 hover:-translate-y-1 active:scale-90 cursor-pointer ${active ? 'bg-blue-50 text-blue-600' : highlight ? 'bg-yellow-50 text-yellow-600' : 'text-slate-400'} group-hover:text-slate-900`}>
                {icon}
            </div>

            {/* Simple Label on Hover */}
            <div className="absolute -top-12 px-4 py-2 bg-slate-900 text-white text-[10px] font-bold tracking-widest uppercase rounded-xl opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all pointer-events-none shadow-xl">
                {label}
            </div>
        </div>
    );
}
