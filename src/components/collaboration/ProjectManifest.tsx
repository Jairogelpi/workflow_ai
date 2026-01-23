import React, { useState } from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { Shield, Users, Zap, Globe, Lock, ChevronRight, Hash, HardDrive, Terminal } from 'lucide-react';
import { UserRole } from '../../canon/schema/ir';

/**
 * ProjectManifest (Hito 4.1)
 * The Sovereign Onboarding UI with Forensic HUD Aesthetics.
 */
export const ProjectManifest: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { initProjectSwarm } = useGraphStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [members, setMembers] = useState<Array<{ id: string, name: string, role: UserRole }>>([
        { id: '1', name: 'Jairo Gelpi', role: 'admin' },
        { id: '2', name: 'Arquitecto Alpha', role: 'editor' },
        { id: '3', name: 'Auditor Externo', role: 'viewer' }
    ]);

    const handleGenerate = async () => {
        if (!name || !description) return;
        const roleMap = members.reduce((acc, m) => ({ ...acc, [m.id]: m.role }), {});
        await initProjectSwarm(name, description, roleMap);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-xl animate-in fade-in duration-500">
            {/* Main Container - Axiom Style */}
            <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.15)] overflow-hidden">

                <div className="p-12 relative overflow-hidden">
                    {/* Brand Accents */}
                    <div className="absolute top-0 left-0 w-full h-2 flex">
                        <div className="flex-1 bg-blue-500" />
                        <div className="flex-1 bg-red-500" />
                        <div className="flex-1 bg-yellow-400" />
                        <div className="flex-1 bg-green-500" />
                    </div>

                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-6">
                            <div className="p-5 bg-blue-50 rounded-3xl text-blue-500 shadow-sm border border-blue-100/50">
                                <Globe className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Tu Espacio de Axiom</h2>
                                <p className="text-slate-400 mt-1 font-medium">Configura tu nuevo universo de ideas</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        {/* Section: Intent & Context */}
                        <div className="space-y-6">
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
                                    <Hash size={20} />
                                </div>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nombre de tu proyecto..."
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-[28px] pl-16 pr-8 py-5 text-xl font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-400 focus:shadow-[0_10px_30px_rgba(59,130,246,0.1)] outline-none transition-all"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute left-6 top-6 text-slate-300">
                                    <Zap size={20} />
                                </div>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="¿Qué quieres lograr hoy? Cuéntale a tu IA..."
                                    className="w-full bg-slate-50/50 border border-slate-100 rounded-[28px] pl-16 pr-8 py-6 text-slate-700 font-medium leading-relaxed placeholder:text-slate-300 focus:bg-white focus:border-blue-400 focus:shadow-[0_10px_30px_rgba(59,130,246,0.1)] outline-none transition-all h-36 resize-none"
                                />
                            </div>
                        </div>

                        {/* Section: Team/Collaboration */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <Users className="w-5 h-5 text-slate-400" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Colaboradores</span>
                            </div>

                            <div className="bg-slate-50/50 border border-slate-100 rounded-[32px] overflow-hidden">
                                <div className="p-4 space-y-2">
                                    {members.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-50 shadow-sm transition-transform hover:scale-[1.01]">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 border-2 border-white flex items-center justify-center text-slate-500 font-bold text-xs shadow-sm">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-800">{member.name}</span>
                                            </div>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${member.role === 'admin' ? 'text-blue-600 border-blue-100 bg-blue-50/50' :
                                                    member.role === 'editor' ? 'text-yellow-600 border-yellow-100 bg-yellow-50/50' :
                                                        'text-slate-400 border-slate-200 bg-slate-50'
                                                }`}>
                                                {member.role === 'admin' ? 'Dueño' : member.role === 'editor' ? 'Editor' : 'Lector'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Swarm Launch Button */}
                        <div className="pt-4 flex flex-col items-center gap-6">
                            <button
                                onClick={handleGenerate}
                                className="w-full max-w-sm group relative bg-blue-500 text-white font-bold py-6 rounded-[28px] active:scale-[0.98] transition-all overflow-hidden shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:bg-blue-600 flex items-center justify-center gap-4"
                            >
                                <span className="text-lg tracking-tight">Comenzar mi proyecto</span>
                                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-[0.2em] flex items-center gap-3">
                                <Lock size={12} /> Seguridad AXIOM Garantizada
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
