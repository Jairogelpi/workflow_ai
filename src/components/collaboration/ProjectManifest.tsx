import React, { useState } from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { Shield, ChevronRight, Plus, X, Globe } from 'lucide-react';
import { UserRole } from '../../canon/schema/ir';

/**
 * ProjectManifest (Redesign v2)
 * Clean, Centered, Symmetrical, "Google-Quality".
 */
export const ProjectManifest: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { initProjectSwarm } = useGraphStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [members, setMembers] = useState<Array<{ id: string, name: string, email?: string, role: UserRole, status?: 'active' | 'pending' }>>([
        { id: '1', name: 'Jairo Gelpi', role: 'admin', status: 'active' },
    ]);

    const handleAddMember = () => {
        if (!inviteEmail || !inviteEmail.includes('@')) return;
        const namePart = inviteEmail.split('@')[0];
        setMembers([...members, {
            id: Math.random().toString(36).substr(2, 9),
            name: namePart ?? 'Nuevo Colaborador',
            email: inviteEmail,
            role: 'viewer',
            status: 'pending'
        }]);
        setInviteEmail('');
    };

    const handleRemoveMember = (id: string) => {
        if (id === '1') return;
        setMembers(members.filter(m => m.id !== id));
    };

    const handleGenerate = async () => {
        if (!name || !description) return;
        const roleMap = members.reduce((acc, m) => ({ ...acc, [m.id]: m.role }), {});
        await initProjectSwarm(name, description, roleMap);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Main Card: Centered, Focused, minimal margins */}
            <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">

                {/* Header Section */}
                <div className="px-10 pt-10 pb-6 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Globe className="text-white w-6 h-6" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Nuevo Proyecto</h2>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Define la identidad y el equipo de tu swarm.</p>
                </div>

                {/* Form Body */}
                <div className="px-10 pb-10 space-y-6">

                    {/* Input: Name */}
                    <div className="group">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre del Proyecto</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Análisis de Mercado Q3"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                            autoFocus
                        />
                    </div>

                    {/* Input: Description */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Objetivo</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe brevemente qué debe lograr la IA..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-700 font-medium placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all h-24 resize-none text-sm"
                        />
                    </div>

                    {/* Team Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Colaboradores</label>
                            <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold">{members.length}</span>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            {/* Member List */}
                            <div className="max-h-[140px] overflow-y-auto bg-white custom-scrollbar divide-y divide-slate-50">
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm
                                                ${member.role === 'admin' ? 'bg-slate-800' : 'bg-blue-500'}
                                            `}>
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{member.name}</span>
                                                <span className="text-[10px] text-slate-400 font-medium lowercase">{member.email || 'Dueño'}</span>
                                            </div>
                                        </div>
                                        {member.id !== '1' && (
                                            <button onClick={() => handleRemoveMember(member.id)} className="text-slate-300 hover:text-red-500 p-1">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add Member Input */}
                            <div className="bg-slate-50 p-2 flex items-center border-t border-slate-200">
                                <input
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                                    placeholder="Invitar por email..."
                                    className="flex-1 bg-transparent px-3 py-1.5 text-xs font-medium text-slate-700 outline-none placeholder:text-slate-400"
                                />
                                <button
                                    onClick={handleAddMember}
                                    disabled={!inviteEmail.includes('@')}
                                    className="p-1.5 bg-white border border-slate-200 rounded-md text-blue-600 shadow-sm hover:border-blue-300 disabled:opacity-50 transition-all"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4">
                        <button
                            onClick={handleGenerate}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span>Crear Espacio</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-widest flex items-center justify-center gap-2">
                            <Shield size={10} /> Axiom Secure Environment
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
