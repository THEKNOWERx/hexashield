import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Cpu, Shield, AlertTriangle, Zap, StopCircle, Volume2 } from 'lucide-react';
import { nexusService } from '../services/apiClient';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { motion, AnimatePresence } from 'framer-motion';

const NexusChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'أنا المحلل الأمني Nexus. كيف يمكنني مساعدتك في تأمين منظومتك اليوم؟', type: 'message' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const { speak, stop, isSpeaking } = useVoiceAssistant();
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!query.trim() || isLoading) return;

        const userMsg = query;
        setQuery('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg, type: 'message' }]);
        setIsLoading(true);

        try {
            const res = await nexusService.chat({ query: userMsg });
            const data = res.data;

            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: data.answer, 
                risk: data.risk_level, 
                remediation: data.recommendation, 
                confidence: data.confidence,
                type: 'analysis' 
            }]);

            // Auto-speak the primary answer
            speak(data.answer);

        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'حدث خطأ أثناء التواصل مع محرك الاستخبارات.', type: 'error' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center 
                ${isOpen ? 'bg-red-500 rotate-90' : 'bg-cyber-blue shadow-blue-500/20'}`}
            >
                {isOpen ? <X size={24} className="text-white" /> : <MessageSquare size={24} className="text-white" />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-neon opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-cyber-neon"></span>
                    </span>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="absolute bottom-20 right-0 w-96 max-h-[600px] bg-black/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-transparent flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Cpu size={16} className="text-cyber-blue" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black tracking-widest text-white uppercase">Nexus Intelligence</h3>
                                    <p className="text-[9px] text-cyber-neon font-bold uppercase tracking-tighter">AI SOC Analyst Enabled</p>
                                </div>
                            </div>
                            {isSpeaking && (
                                <button onClick={stop} className="p-2 bg-red-500/10 rounded-full text-red-500 animate-pulse">
                                    <StopCircle size={16} />
                                </button>
                            )}
                        </div>

                        {/* Messages Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed 
                                        ${msg.role === 'user' 
                                            ? 'bg-cyber-blue text-white shadow-lg' 
                                            : 'bg-white/5 border border-white/10 text-gray-300'}`}>
                                        
                                        {msg.content}

                                        {msg.type === 'analysis' && (
                                            <div className="mt-4 space-y-3 pt-3 border-t border-white/10">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border 
                                                        ${msg.risk === 'CRITICAL' ? 'border-red-500 text-red-500 bg-red-500/10' : 
                                                          msg.risk === 'HIGH' ? 'border-orange-500 text-orange-500 bg-orange-500/10' : 
                                                          'border-blue-500 text-blue-500 bg-blue-500/10'}`}>
                                                        Risk: {msg.risk}
                                                    </span>
                                                    <span className="text-[9px] text-gray-500 font-mono italic">Confidence: {msg.confidence}</span>
                                                </div>
                                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-start gap-2">
                                                    <Zap size={12} className="text-cyber-neon shrink-0 mt-0.5" />
                                                    <p className="text-[10px] text-gray-400">
                                                        <span className="text-gray-500 font-bold">REMEDIATION:</span> {msg.remediation}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-cyber-blue rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-cyber-blue rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-cyber-blue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-4 bg-black/40 border-t border-white/5 flex items-center gap-3">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="اسأل المحلل الأمني..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyber-blue transition-all"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="p-3 bg-cyber-blue hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg active:scale-95"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NexusChat;
