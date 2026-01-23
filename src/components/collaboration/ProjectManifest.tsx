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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-700">
            {/* Main HUD Container */}
            <div className="w-full max-w-2xl bg-slate-950 border-2 border-cyan-500/40 rounded-[32px] p-1 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden group">
                {/* Background Grid & Scanline */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/20 animate-scanline pointer-events-none" />

                <div className="bg-slate-900/40 rounded-[30px] p-10 relative z-10">
                    <div className="flex items-center justify-between mb-8 border-b border-cyan-500/10 pb-6">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse" />
                                <div className="relative p-4 bg-slate-950 rounded-2xl border border-cyan-500/30">
                                    <Shield className="w-8 h-8 text-cyan-400" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white tracking-widest font-mono uppercase">PROJECT_MANIFEST_V4.1</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                                    <p className="text-cyan-500/60 text-[9px] font-black uppercase tracking-[0.3em] font-mono">GATE_8: IDENTITY_SECURED</p>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:block text-right font-mono">
                            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest">System_Entropy</div>
                            <div className="text-xs text-cyan-400 font-bold">0.032%_STABLE</div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Section: Intent & Context */}
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <Terminal className="w-4 h-4 text-cyan-500" />
                                <span className="text-[10px] font-black text-cyan-500/50 uppercase tracking-[0.2em] font-mono">INTENT_DECOMPOSITION</span>
                            </div>

                            <div className="relative group/field">
                                <div className="absolute left-4 top-4 text-cyan-500/30">
                                    <Hash size={16} />
                                </div>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="INIT_NAME"
                                    className="w-full bg-slate-950/50 border border-cyan-500/20 rounded-2xl pl-12 pr-6 py-4 text-white font-mono font-bold placeholder:text-slate-700 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] outline-none transition-all group-hover/field:border-cyan-500/40"
                                />
                            </div>

                            <div className="relative group/field">
                                <div className="absolute left-4 top-4 text-cyan-500/30">
                                    <HardDrive size={16} />
                                </div>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="DESCRIBE_CANON_PURPOSE: El RLM analizará la redundancia y generará la estructura recursiva..."
                                    className="w-full bg-slate-950/50 border border-cyan-500/20 rounded-2xl pl-12 pr-6 py-4 text-white font-mono text-sm leading-relaxed placeholder:text-slate-700 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] outline-none transition-all h-32 resize-none group-hover/field:border-cyan-500/40"
                                />
                            </div>
                        </div>

                        {/* Section: RBAC Governance */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Lock className="w-4 h-4 text-cyan-500" />
                                    <span className="text-[10px] font-black text-cyan-500/50 uppercase tracking-[0.2em] font-mono">GOVERNANCE_POLICIES</span>
                                </div>
                                <div className="text-[9px] text-slate-500 font-mono">SQL_RLS_ACTIVE</div>
                            </div>

                            <div className="bg-slate-950/50 border border-cyan-500/20 rounded-2xl overflow-hidden backdrop-blur-md">
                                <table className="w-full text-left font-mono">
                                    <thead>
                                        <tr className="border-b border-cyan-500/10 bg-cyan-500/5">
                                            <th className="px-6 py-3 text-[9px] font-black text-cyan-500/60 uppercase">Identity</th>
                                            <th className="px-6 py-3 text-[9px] font-black text-cyan-500/60 uppercase text-right">Clearance_Level</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cyan-500/10">
                                        {members.map(member => (
                                            <tr key={member.id} className="hover:bg-cyan-500/5 transition-colors group/row">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-slate-700 group-hover/row:bg-cyan-500 transition-colors" />
                                                        <span className="text-xs font-bold text-slate-300 uppercase">{member.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`px-2.2 py-0.8 rounded text-[8px] font-black uppercase tracking-tighter border ${member.role === 'admin' ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5' :
                                                            member.role === 'editor' ? 'text-amber-400 border-amber-400/30 bg-amber-400/5' :
                                                                'text-slate-500 border-slate-500/30 bg-slate-500/5'
                                                        }`}>
                                                        {member.role === 'admin' ? 'SOBERANO' : member.role === 'editor' ? 'ARQUITECTO' : 'OBSERVADOR'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Swarm Launch Button */}
                        <div className="relative pt-4">
                            <button
                                onClick={handleGenerate}
                                className="w-full relative group/btn bg-cyan-500 text-slate-950 font-black py-5 rounded-2xl active:scale-[0.98] transition-all overflow-hidden border border-cyan-400 shadow-[0_5px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_8px_30px_rgba(6,182,212,0.5)]"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                                <div className="relative flex items-center justify-center gap-4">
                                    <Zap className="w-5 h-5 fill-current" />
                                    <span className="uppercase tracking-[0.3em] font-mono">INIT_RLM_SWARM_LAUNCH</span>
                                    <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-all" />
                                </div>
                            </button>

                            <div className="mt-6 flex items-center justify-center gap-3">
                                <div className="h-px bg-cyan-500/10 flex-1" />
                                <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono flex items-center gap-2">
                                    <Lock size={10} /> Forensic_Verification_Engine_Active
                                </div>
                                <div className="h-px bg-cyan-500/10 flex-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes scanline {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(600px); }
                }
                .animate-scanline {
                    animation: scanline 4s linear infinite;
                }
            `}</style>
        </div>
    );
};
