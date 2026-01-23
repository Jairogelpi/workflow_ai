import { useState, useEffect } from 'react';
import { ArrowRight, ExternalLink, Save, Check, Loader2, Settings, Terminal, FileText } from 'lucide-react';
import { ModelSelector } from '../../../src/components/settings/ModelSelector';
import { SidePanelAuditView } from '../components/SidePanelAuditView';
import { useAuth } from '../hooks/useAuth';
import { LoginView } from '../components/LoginView';
import { ProjectSelector } from '../components/ProjectSelector';
import { supabase } from '../lib/supabase';

interface ArticleData {
    title: string;
    content: string; // Plain text
    html: string;    // Sanitzed HTML from Parser
    excerpt: string | null;
    images: string[];
    url: string;
    timestamp?: string; // Added for traceability
}

export const SidePanelViewer = () => {
    const { user, logout, loading: authLoading } = useAuth();
    const [article, setArticle] = useState<ArticleData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'audit'>('content');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    useEffect(() => {
        // Listen for parsed content from Background
        const listener = (msg: any) => {
            if (msg.type === 'SHOW_ARTICLE') {
                setArticle(msg.data);
                setLoading(false);
                setSaved(false);
            }
            if (msg.type === 'SHOW_CAPTURE') {
                setArticle({
                    title: msg.data.title,
                    url: msg.data.url,
                    content: msg.data.content,
                    html: `<div class="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <p class="text-[10px] font-bold text-blue-500 mb-2 uppercase tracking-widest">Fragmento Capturado</p>
                        <blockquote class="text-slate-700 font-medium italic">"${msg.data.content}"</blockquote>
                    </div>`,
                    excerpt: msg.data.content.substring(0, 100),
                    images: [],
                    timestamp: msg.data.timestamp
                });
                setLoading(false);
                setSaved(false);
            }
            if (msg.type === 'PARSING_START') {
                setLoading(true);
                setArticle(null);
                setSaved(false);
            }
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);

    const handleSaveToGraph = async () => {
        if (!article || saving || saved) return;

        setSaving(true);
        try {
            const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch(`${serverUrl}/api/ingest/link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    url: article.url,
                    title: article.title,
                    content: article.content, // Text for vectorization
                    images: article.images,
                    timestamp: article.timestamp || new Date().toISOString(),
                    projectId: selectedProjectId
                })
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            setSaved(true);
        } catch (err) {
            console.error('[WorkGraph] Ingestion failed:', err);
            alert(`Error al guardar: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSaving(false);
        }
    };

    const handleInsertToChat = () => {
        if (!article) return;

        // Command content script to insert text
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: (text) => {
                        const input = document.querySelector('textarea, div[contenteditable="true"]');

                        if (input) {
                            (input as HTMLElement).focus();
                            // Using simulated insert for better compatibility
                            document.execCommand('insertText', false, text);
                        } else {
                            alert('No chat input found on this page.');
                        }
                    },
                    args: [article.content]
                });
            }
        });
    };



    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <LoginView />;
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Analizando contenido...</p>
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex h-screen flex-col bg-white">
                {/* Header with User Info - Premium Style */}
                <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden shadow-sm transition-transform hover:scale-110">
                            {user.user_metadata.avatar_url ? <img src={user.user_metadata.avatar_url} alt="" /> : user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-900 truncate max-w-[140px] tracking-tight">{user.user_metadata.full_name || user.email}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Axiom Link Active</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => logout()} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <ArrowRight size={18} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-32 h-32 mb-10 relative group">
                        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <img src="/logo.png" alt="Axiom" className="w-full h-auto object-contain opacity-20 group-hover:opacity-40 transition-all duration-700 hover:scale-105" />
                    </div>
                    <h3 className="text-[22px] font-bold text-slate-900 mb-3 tracking-tight">Espíritu Axiom</h3>
                    <p className="text-[14px] text-slate-400 leading-relaxed font-medium">Haz clic en el icono 🧠 en cualquier enlace <br /> para extraer su esencia y guardarla <br /> en tu grafo semántico.</p>
                </div>

                <div className="p-8 border-t border-slate-50">
                    <p className="text-center text-[9px] text-slate-300 font-bold uppercase tracking-[0.3em]">
                        Nexus-Axiom Connectivity v1.2
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-white text-slate-900">
            {/* Tab Navigation */}
            <div className="flex border-b bg-slate-50/50 p-1">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 flex items-center justify-center py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-xl ${activeTab === 'content' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <FileText className="w-3.5 h-3.5 mr-2" /> Conocimiento
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`flex-1 flex items-center justify-center py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-xl ${activeTab === 'audit' ? 'text-blue-600 bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Terminal className="w-3.5 h-3.5 mr-2" /> Auditoría
                </button>
            </div>

            {activeTab === 'audit' ? (
                <SidePanelAuditView />
            ) : (
                <>
                    {/* Header */}
                    <div className="flex flex-col border-b bg-white shadow-sm sticky top-0 z-10 p-4 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 overflow-hidden">
                                <h2 className="truncate text-sm font-bold text-slate-900" title={article.title}>{article.title}</h2>
                                <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 hover:text-blue-500">
                                    {new URL(article.url).hostname} <ExternalLink className="ml-1.5 h-3 w-3" />
                                </a>
                            </div>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`ml-2 p-2 rounded-xl transition-colors ${showSettings ? 'bg-blue-50 text-blue-600' : 'text-slate-300 hover:bg-slate-50'}`}
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Project Selection Layer */}
                        <ProjectSelector onSelect={setSelectedProjectId} />

                        {showSettings ? (
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <ModelSelector />
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveToGraph}
                                    disabled={saving || saved || !selectedProjectId}
                                    className={`flex flex-1 items-center justify-center rounded-2xl px-4 py-3 text-xs font-bold transition-all shadow-sm ${saved
                                        ? 'bg-green-50 text-green-600 border border-green-100'
                                        : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none'
                                        }`}
                                >
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                    {saved ? 'Guardado' : 'Guardar en Grafo'}
                                </button>

                                <button
                                    onClick={handleInsertToChat}
                                    className="flex items-center justify-center rounded-2xl bg-slate-900 p-3 text-white hover:bg-black transition-all shadow-lg shadow-black/10"
                                    title="Insertar en Chat"
                                >
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content (Prose) */}
                    <div
                        className="prose prose-sm max-w-none flex-1 overflow-y-auto p-4 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: article.html }} // Trusted from Offscreen Parser (DomPurify)
                    />

                    {/* Image Gallery */}
                    {article.images && article.images.length > 0 && (
                        <div className="bg-gray-50 p-3 border-t">
                            <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Images Found</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {article.images.map((img, i) => (
                                    <img
                                        key={i}
                                        src={img}
                                        alt=""
                                        className="h-16 w-16 rounded object-cover border border-gray-200 cursor-pointer hover:border-blue-500"
                                        onClick={() => {/* Future: Drag to chat */ }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

