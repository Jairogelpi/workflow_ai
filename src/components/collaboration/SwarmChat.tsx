'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Brain } from 'lucide-react';
import { generateText } from '../../kernel/llm/gateway';
import { useGraphStore } from '../../store/useGraphStore';

interface BridgeContext {
    title: string;
    url: string;
    content: string;
}

export const SwarmChat = () => {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'Axiom Link-OS conectado. Estoy listo para analizar tu contexto.' }
    ]);
    const [input, setInput] = useState('');
    const [context, setContext] = useState<BridgeContext | null>(null);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // [REALISM] Dynamic Project Context for Billing
    const { projectManifest } = useGraphStore();
    const projectId = projectManifest?.id || 'global-system';

    // [CONTEXT BRIDGE] Listen for messages from Extension
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Security: In production check event.origin
            if (event.data?.type === 'UPDATE_CONTEXT') {
                console.log('[SwarmChat] Received Context:', event.data.context);
                setContext(event.data.context);

                // Announce context reception
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `He recibido el contexto: "${event.data.context.title}". ¿Que quieres saber?`
                }]);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            // Call Real Intelligence via Gateway
            const systemPrompt = `You are the Swarm Intelligence of Axiom Link-OS. 
            CONTEXT: The user is viewing: ${context?.title} (${context?.url}).
            CONTENT SNIPPET: ${context?.content.substring(0, 1000)}...
            
            Analyze the user's query in relation to this content. Be concise, insightful, and act as a second brain.`;

            // Pass explicit Project ID for Ledger Tracking
            const { content } = await generateText(systemPrompt, userMsg, 'REASONING', undefined, undefined, projectId);

            setMessages(prev => [...prev, { role: 'assistant', content }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión con el Enjambre Real.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Context Widget */}
            {context && (
                <div className="p-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] text-blue-600 font-bold truncate">
                        Foco: {context.title}
                    </span>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, i) => (
                    <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-purple-600 text-white'}`}>
                            {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-white text-slate-700' : 'bg-purple-50 text-purple-900'}`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
                            <Bot size={14} />
                        </div>
                        <div className="p-3 rounded-2xl bg-purple-50 text-purple-900 text-xs shadow-sm italic">
                            Pensando...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input
                    className="flex-1 bg-slate-50 border-0 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Pregunta algo sobre el contenido..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};
