'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProjectManifest } from '@/components/collaboration/ProjectManifest';
import { Plus, FolderOpen, Clock, ChevronRight, LogOut, Grid, List } from 'lucide-react';

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

            // Mock Projects - In production invoke Supabase query here
            setProjects([
                { id: 'proj-alpha-001', name: 'Axiom Core V1', description: 'Sistema operativo de grafos.', updated_at: 'Hace 2 horas' },
                { id: 'proj-beta-002', name: 'Marketing Q3', description: 'Estrategia de despliegue.', updated_at: 'Hace 1 día' }
            ]);
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
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Axiom Workspace</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-slate-600 hidden md:block">{user.email}</span>
                    </div>
                    <button onClick={handleLogout} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">

                {/* Hero / Action Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tus Proyectos</h1>
                        <p className="text-slate-500 mt-1 font-medium">Gestiona tus enjambres de inteligencia.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowManifest(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={20} />
                            <span>Nuevo Proyecto</span>
                        </button>
                    </div>
                </div>

                {/* Projects Grid */}
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>

                    {/* Create New Card (Ghost) */}
                    <div
                        onClick={() => setShowManifest(true)}
                        className={`group cursor-pointer border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all
                            ${viewMode === 'grid' ? 'h-[220px]' : 'h-24 flex-row gap-4'}
                        `}
                    >
                        <div className="p-4 bg-slate-50 rounded-full group-hover:bg-white group-hover:scale-110 transition-transform shadow-sm">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold text-sm tracking-wide mt-3">Crear nuevo espacio</span>
                    </div>

                    {/* Existing Projects */}
                    {projects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => handleOpenProject(project.id)}
                            className={`group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-300/50 transition-all cursor-pointer
                                ${viewMode === 'grid' ? 'p-6 flex flex-col justify-between h-[220px]' : 'p-6 flex items-center justify-between'}
                            `}
                        >
                            {/* Card Content */}
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
                                        <FolderOpen className="text-white w-5 h-5" />
                                    </div>
                                    <h3 className="font-extrabold text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                                    <p className="text-sm text-slate-500 font-medium line-clamp-2">{project.description}</p>
                                </div>
                                {viewMode === 'list' && <ChevronRight className="text-slate-300" />}
                            </div>

                            {viewMode === 'grid' && (
                                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {project.updated_at}</span>
                                    <span className="group-hover:translate-x-1 transition-transform text-blue-500 font-bold">Abrir &rarr;</span>
                                </div>
                            )}
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
