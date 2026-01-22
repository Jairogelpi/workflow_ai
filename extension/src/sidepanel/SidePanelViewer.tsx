import { useState, useEffect } from 'react';
import { ArrowRight, ExternalLink, Save, Check, Loader2, Settings } from 'lucide-react';
import { ModelSelector } from '../../../src/components/settings/ModelSelector';

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
    const [article, setArticle] = useState<ArticleData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

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
                    html: `<div class="p-2 bg-yellow-50 border-l-4 border-yellow-400">
                        <p class="text-sm font-medium text-yellow-800 mb-1">Captured Selection</p>
                        <blockquote class="italic text-gray-700">${msg.data.content}</blockquote>
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
            const response = await fetch(`${serverUrl}/api/ingest/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: article.url,
                    title: article.title,
                    content: article.content, // Text for vectorization
                    images: article.images,
                    timestamp: article.timestamp || new Date().toISOString(), // Ensure timestamp is sent
                    projectId: '00000000-0000-0000-0000-000000000000'
                })
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            setSaved(true);
        } catch (err) {
            console.error('[WorkGraph] Ingestion failed:', err);
            alert(`Error saving: ${err instanceof Error ? err.message : String(err)}`);
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

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-400">
                <div className="animate-pulse">Parsing content...</div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center text-gray-500">
                <h3 className="mb-2 font-semibold text-gray-700">WorkGraph OS</h3>
                <p className="text-sm">Click the 🧠 icon next to any link in your chat to extract its knowledge.</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-white text-gray-900">

            {/* Header */}
            <div className="flex flex-col border-b bg-white shadow-sm sticky top-0 z-10">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex-1 overflow-hidden">
                        <h2 className="truncate text-sm font-bold" title={article.title}>{article.title}</h2>
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-gray-400 hover:text-blue-500">
                            {new URL(article.url).hostname} <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                    </div>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`ml-2 p-1.5 rounded-full transition-colors ${showSettings ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>

                {showSettings ? (
                    <div className="px-4 pb-4 border-b border-gray-100 bg-gray-50/50">
                        <ModelSelector />
                    </div>
                ) : (
                    <div className="flex gap-2 px-4 pb-3">
                        <button
                            onClick={handleSaveToGraph}
                            disabled={saving || saved}
                            className={`flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition ${saved
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                            {saved ? 'Saved' : 'Save to Graph'}
                        </button>

                        <button
                            onClick={handleInsertToChat}
                            className="flex flex-1 items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition"
                        >
                            Insert to Chat <ArrowRight className="ml-1.5 h-3 w-3" />
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
        </div>
    );
};

