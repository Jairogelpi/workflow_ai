import React, { useState } from 'react';
import { useGraphStore } from '../../store/useGraphStore';
import { Shield, Users, Zap, Globe, Lock, ChevronRight, Hash, HardDrive, Terminal, Plus, X, Mail } from 'lucide-react';
import { UserRole } from '../../canon/schema/ir';

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
        if (id === '1') return; // Don't remove self
        setMembers(members.filter(m => m.id !== id));
    };

    const handleGenerate = async () => {
        if (!name || !description) return;
        const roleMap = members.reduce((acc, m) => ({ ...acc, [m.id]: m.role }), {});
        await initProjectSwarm(name, description, roleMap);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-950/40 backdrop-blur-2xl animate-in fade-in duration-700">
            {/* Main Holographic Container */}
            <div className="w-full max-w-3xl bg-white/90 rounded-[48px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.2)] overflow-hidden border border-white/50 animate-in zoom-in-95 duration-500">
                <div className="p-8 md:p-14 relative">
                    {/* Brand Accents */}
                    <div className="absolute top-0 left-0 w-full h-[6px] flex opacity-80">
                        <div className="flex-1 bg-blue-500 blur-[1px]" />
                        <div className="flex-1 bg-indigo-500 blur-[1px]" />
                        <div className="flex-1 bg-violet-500 blur-[1px]" />
                        <div className="flex-1 bg-fuchsia-500 blur-[1px]" />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-violet-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative p-6 bg-white rounded-3xl text-blue-600 shadow-xl shadow-blue-500/10 border border-blue-50">
                                    <Globe className="w-10 h-10" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">Manifesto de Proyecto</h2>
                                <p className="text-slate-500 mt-3 text-lg font-medium">Bautiza tu vision y convoca a tu equipo</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
                        {/* LEFT: Context Inputs */}
                        <div className="md:col-span-3 space-y-8">
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Identidad</label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Hash size={22} />
                                    </div>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Nombre del Proyecto"
                                        className="w-full bg-slate-100/50 border border-slate-200/60 rounded-[32px] pl-16 pr-8 py-6 text-2xl font-black text-slate-900 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:shadow-[0_20px_50px_-10px_rgba(59,130,246,0.15)] outline-none transition-all duration-300"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Proposito</label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-7 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Zap size={22} />
                                    </div>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe tu vision para la IA..."
                                        className="w-full bg-slate-100/50 border border-slate-200/60 rounded-[32px] pl-16 pr-8 py-7 text-slate-800 font-bold text-lg leading-relaxed placeholder:text-slate-300 focus:bg-white focus:border-blue-500 focus:shadow-[0_20px_50px_-10px_rgba(59,130,246,0.15)] outline-none transition-all duration-300 h-48 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Team management */}
                        <div className="md:col-span-2 space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Escuadrón</label>
                                    <Users className="w-4 h-4 text-slate-300" />
                                </div>

                                {/* Invite Input */}
                                <div className="relative flex items-center group">
                                    <input
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                                        placeholder="Email colaborador..."
                                        className="w-full bg-slate-100/50 border border-slate-200/60 rounded-full pl-6 pr-14 py-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-400 outline-none transition-all"
                                    />
                                    <button
                                        onClick={handleAddMember}
                                        disabled={!inviteEmail.includes('@')}
                                        className="absolute right-2 p-3 bg-blue-600 text-white rounded-full hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>

                                {/* Members List */}
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {members.map(member => (
                                        <div key={member.id} className="group relative flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-50 flex items-center justify-center text-slate-600 font-black text-sm shadow-inner group-hover:from-blue-50 group-hover:to-white transition-colors uppercase">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    {member.status === 'pending' && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 border-2 border-white rounded-full animate-pulse" title="Pendiente" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900">{member.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                        {member.role === 'admin' ? 'Comandante' : member.role === 'editor' ? 'Operador' : 'Observador'}
                                                    </span>
                                                </div>
                                            </div>

                                            {member.id !== '1' && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Action */}
                    <div className="mt-16 flex flex-col items-center gap-8">
                        <button
                            onClick={handleGenerate}
                            className="w-full max-w-md group relative bg-indigo-600 text-white font-black py-7 rounded-[36px] active:scale-[0.98] transition-all overflow-hidden shadow-[0_25px_60px_-12px_rgba(79,70,229,0.4)] hover:shadow-[0_30px_70px_-10px_rgba(79,70,229,0.6)] hover:bg-indigo-700 flex items-center justify-center gap-5"
                        >
                            <span className="text-2xl tracking-tighter uppercase whitespace-nowrap">Inicializar Protocolo Swarm</span>
                            <div className="p-2 bg-indigo-500 rounded-full group-hover:translate-x-1 transition-transform">
                                <ChevronRight className="w-6 h-6" />
                            </div>
                        </button>

                        <div className="flex items-center gap-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
                            <span className="flex items-center gap-2"><Shield size={12} className="text-indigo-400" /> Cifrado Militar</span>
                            <span className="flex items-center gap-2"><Zap size={12} className="text-amber-400" /> IA Hyperdrive</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
