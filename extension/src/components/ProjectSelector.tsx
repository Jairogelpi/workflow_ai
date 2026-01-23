import React, { useState, useEffect } from 'react';
import { Layers, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Project {
    id: string;
    name: string;
}

export const ProjectSelector: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
            const { data: { session } } = await supabase.auth.getSession();

            try {
                const response = await fetch(`${serverUrl}/api/user/projects`, {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                });
                const data = await response.json();
                if (data.projects) {
                    setProjects(data.projects);
                    if (data.projects.length > 0) {
                        setSelectedId(data.projects[0].id);
                        onSelect(data.projects[0].id);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch projects:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    if (loading) return <div className="h-10 w-full animate-pulse bg-slate-50 rounded-xl" />;

    return (
        <div className="relative group">
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-blue-200 transition-all cursor-pointer">
                <Layers size={16} className="text-blue-500" />
                <select
                    value={selectedId}
                    onChange={(e) => {
                        setSelectedId(e.target.value);
                        onSelect(e.target.value);
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-700 appearance-none cursor-pointer"
                >
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                    {projects.length === 0 && <option value="">Crear Proyecto...</option>}
                </select>
                <ChevronDown size={14} className="text-slate-400" />
            </div>
        </div>
    );
};
