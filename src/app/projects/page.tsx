'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProjectManifest } from '@/components/collaboration/ProjectManifest';
import { Plus, FolderOpen, Clock, ChevronRight, LogOut, Grid, List, Trash } from 'lucide-react';
import { syncService } from '@/lib/sync';

interface Project {
    id: string;
    name: string;
    description: string;
    updated_at: string;
}

export default function ProjectsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [showManifest, setShowManifest] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.replace('/');
                return;
            }
            setUser(session.user);

            // FETCH REAL PROJECTS
            try {
                const realProjects = await syncService.fetchProjects();
                setProjects(realProjects as Project[]);
            } catch (err) {
                console.error('Failed to fetch projects', err);
                setProjects([]); // Ensure empty on error, no mocks
            }
        };
        checkUser();
    }, [router]);

    const handleOpenProject = (id: string) => {
        router.push(`/project/${id}`);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden relative">
            {/* Cinematic Background Bloom (Subtle) */}
            <div className="fixed top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-blue-50/50 via-white/80 to-indigo-50/50 blur-[120px] pointer-events-none opacity-60 z-0" />

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex items-center justify-between transition-all duration-300">
                <div className="flex items-center gap-4">
                    {/* Brand Logo */}
                    <div className="w-8 h-8 md:w-10 md:h-10 relative group cursor-pointer hover:scale-105 transition-transform" onClick={() => router.push('/')}>
                        <img src="/logo.png" alt="Axiom" className="w-full h-full object-contain drop-shadow-sm" />
                    </div>
                    <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden md:block" />
                    <span className="font-bold text-lg tracking-tight text-slate-800 hidden md:block">Workspace</span>
                </div>

                <div className="flex items-center gap-4">
                    {/* User Profile Dropdown */}
                    <div className="relative group/menu">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-full border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold shadow-inner">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-slate-600 hidden md:block">{user.email}</span>
                        </button>

                        {/* Dropdown Content - Hover or Focus driven (Simplified) */}
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all transform origin-top-right z-50">
                            <div className="px-3 py-2 border-b border-slate-50 mb-1">
                                <p className="text-xs font-bold text-slate-800">Mi Cuenta</p>
                                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={14} />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">

                {/* Hero / Action Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="animate-in slide-in-from-left-4 fade-in duration-700">
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Tus Proyectos</h1>
                        <p className="text-slate-500 mt-2 font-medium text-lg">Gestiona tus enjambres de inteligencia.</p>
                    </div>

                    <div className="flex items-center gap-4 animate-in slide-in-from-right-4 fade-in duration-700 delay-100">
                        <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100/80 text-blue-600 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Grid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100/80 text-blue-600 shadow-inner' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List size={20} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowManifest(true)}
                            className="group bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-3 overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span>Nuevo Proyecto</span>
                        </button>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>

                    {/* Create New Card (Ghost) */}
                    <div
                        onClick={() => setShowManifest(true)}
                        className={`group cursor-pointer border-2 border-dashed border-slate-300/60 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/40 transition-all duration-300
                            ${viewMode === 'grid' ? 'h-[240px]' : 'h-28 flex-row gap-6'}
                        `}
                    >
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200/50 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-slate-100">
                            <Plus size={32} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <span className="font-bold text-sm tracking-wide mt-4">Crear nuevo espacio</span>
                    </div>

                    {/* Existing Projects */}
                    {projects.map((project, idx) => (
                        <div
                            key={project.id}
                            onClick={() => handleOpenProject(project.id)}
                            className={`group relative bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-3xl overflow-hidden hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:border-blue-300/30 hover:translate-y-[-2px] transition-all duration-300 cursor-pointer animate-in fade-in zoom-in-50 fill-mode-forwards
                                ${viewMode === 'grid' ? 'p-8 flex flex-col justify-between h-[240px]' : 'p-6 flex items-center justify-between'}
                            `}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            {/* Card Content */}
                            <div className="flex items-start justify-between w-full">
                                <div className="space-y-4 w-full">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform border border-slate-100">
                                            <FolderOpen className="text-slate-400 group-hover:text-blue-500 w-6 h-6 transition-colors" />
                                        </div>
                                        {viewMode === 'grid' && <ChevronRight className="text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />}
                                    </div>

                                    <div>
                                        <h3 className="font-extrabold text-xl text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{project.name}</h3>
                                        <p className="text-sm text-slate-500 font-medium line-clamp-2 mt-2 leading-relaxed">{project.description}</p>
                                    </div>
                                </div>
                                {viewMode === 'list' && <ChevronRight className="text-slate-300 group-hover:text-blue-500 ml-4" />}
                            </div>

                            {viewMode === 'grid' && (
                                <div className="pt-6 mt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-300" /> {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'Reciente'}</span>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">Entrar</span>
                                </div>
                            )}

                            {/* [Admin] Delete Action */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('¿Seguro que quieres eliminar este proyecto? Esta acción es irreversible.')) {
                                            syncService.deleteProject(project.id).then(() => {
                                                setProjects(prev => prev.filter(p => p.id !== project.id));
                                            });
                                        }
                                    }}
                                    className="p-2 bg-white/90 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 shadow-sm border border-slate-100"
                                    title="Eliminar Proyecto"
                                >
                                    <Trash size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Floating Glass Modal (Project Manifest) */}
            {showManifest && (
                <ProjectManifest onClose={() => setShowManifest(false)} />
            )}
        </div>
    );
}
