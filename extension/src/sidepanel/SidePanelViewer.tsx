import { useState, useEffect } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface ArticleData {
    title: string;
    content: string; // Plain text
    html: string;    // Sanitzed HTML from Parser
    images: string[];
    url: string;
}

export const SidePanelViewer = () => {
    const [article, setArticle] = useState<ArticleData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Listen for parsed content from Background
        const listener = (msg: any) => {
            if (msg.type === 'SHOW_ARTICLE') {
                setArticle(msg.data);
                setLoading(false);
            }
            if (msg.type === 'PARSING_START') {
                setLoading(true);
                setArticle(null);
            }
        };
        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);

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
            <div className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
                <div className="flex-1 overflow-hidden">
                    <h2 className="truncate text-sm font-bold" title={article.title}>{article.title}</h2>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-gray-400 hover:text-blue-500">
                        {new URL(article.url).hostname} <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                </div>
                <button
                    onClick={handleInsertToChat}
                    className="ml-2 flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition"
                >
                    Insert to Chat <ArrowRight className="ml-1.5 h-3 w-3" />
                </button>
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
