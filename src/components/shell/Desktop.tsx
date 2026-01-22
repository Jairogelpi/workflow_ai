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

    // Update clock every minute
    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
            {/* System Top Bar */}
            <div className="absolute top-0 inset-x-0 h-8 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md border-b border-white/5 z-[1001]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-4 h-4 rounded bg-primary group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-bold tracking-widest uppercase opacity-80">WorkGraph OS</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-medium opacity-50">
                        <span className="hover:opacity-100 cursor-pointer transition-opacity">File</span>
                        <span className="hover:opacity-100 cursor-pointer transition-opacity">Edit</span>
                        <span className="hover:opacity-100 cursor-pointer transition-opacity">Swarm</span>
                        <span className="hover:opacity-100 cursor-pointer transition-opacity">Network</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs opacity-60">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                        <Cpu size={12} className="text-amber-400" />
                        <span className="text-[10px] font-mono">92.4 Gflops</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Wifi size={14} />
                        <Battery size={14} />
                        <span className="font-medium">{currentTime}</span>
                    </div>
                </div>
            </div>

            {/* Main Application Workspace */}
            <div className="flex-1 relative z-0">
                {children}
            </div>

            {/* Futuristic Dock */}
            <div className="absolute bottom-6 inset-x-0 flex justify-center z-[1001] pointer-events-none">
                <div className="flex items-center gap-2 p-1.5 bg-zinc-900/60 backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-2xl pointer-events-auto ring-1 ring-black/20">
                    <DockIcon icon={<LayoutGrid size={22} />} label="Graph" active />
                    <DockIcon icon={<Terminal size={22} />} label="Terminal" />
                    <DockIcon icon={<Cpu size={22} />} label="Enjambre" />
                    <div className="w-px h-8 bg-white/10 mx-1" />
                    <DockIcon icon={<Share2 size={22} />} label="Network" />
                    <DockIcon icon={<Settings size={22} />} label="Config" />
                    <div className="w-px h-8 bg-white/10 mx-1" />
                    <DockIcon icon={<Search size={22} />} label="Search" highlight />
                </div>
            </div>

            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-500/5 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>
        </div>
    );
}

function DockIcon({ icon, label, active = false, highlight = false }: any) {
    return (
        <div className="relative group p-3 rounded-[20px] transition-all duration-300 hover:bg-white/10 hover:-translate-y-2 active:scale-90 cursor-pointer">
            <div className={`${active ? 'text-primary' : highlight ? 'text-amber-400' : 'text-zinc-400'} group-hover:text-white transition-colors duration-300`}>
                {icon}
            </div>
            {active && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgb(59,130,246)]" />
            )}

            {/* Minimalist Tooltip */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 dark:bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl text-[10px] font-bold tracking-[0.2em] uppercase text-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none shadow-2xl">
                {label}
            </div>
        </div>
    );
}
