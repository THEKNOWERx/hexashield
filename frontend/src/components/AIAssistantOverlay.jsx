/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Zap, Copy, Check } from 'lucide-react';
import { aiService } from '../services/apiClient';

const AIAssistantOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'System initialized. I am your AI security analyst. How can I assist with your pentest today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (overrideQuery = null) => {
    const query = overrideQuery || input;
    if (!query.trim()) return;
    
    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await aiService.chat(query, "General Security Context");
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to reach the security core.";
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-cyber-blue text-white rounded-full flex items-center justify-center shadow-blue-glow hover:scale-110 transition-transform z-50 group"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-neon opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-cyber-neon"></span>
        </span>
      </button>

      {/* Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-[400px] h-[600px] cyber-panel border-cyber-blue/50 flex flex-col z-50 glass-panel shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-cyber-border">
              <div className="flex items-center gap-2">
                <Bot className="text-cyber-neon" size={20} />
                <span className="font-semibold text-sm">Security AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyber-neon"></div>
                <span className="text-xs text-gray-400">Online</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-lg text-sm select-text cursor-text ${
                    msg.role === 'user' 
                      ? 'bg-cyber-blue text-white ml-auto' 
                      : 'bg-cyber-dark text-gray-300 border border-cyber-border'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {msg.role === 'assistant' ? <Bot size={14} className="text-cyber-neon" /> : <User size={14} />}
                        <span className="text-xs font-medium opacity-50">
                          {msg.role === 'assistant' ? 'AI' : 'You'}
                        </span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(msg.content, i)}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        {copiedId === i ? <Check size={12} className="text-cyber-neon" /> : <Copy size={12} />}
                      </button>
                    </div>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-cyber-dark text-gray-300 border border-cyber-border p-3 rounded-lg text-xs flex gap-1 items-center">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce [animation-delay:0.2s]">.</span>
                    <span className="animate-bounce [animation-delay:0.4s]">.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-cyber-border bg-cyber-black/50">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask for remediation advice..."
                  className="cyber-input flex-1 px-3 py-2"
                />
                <button 
                  onClick={handleSend}
                  className="bg-cyber-blue p-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                {['Scan Report', 'Explain CVE', 'Risk Analysis'].map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => {
                      setInput(tag);
                      handleSend(tag);
                    }}
                    className="text-[10px] bg-cyber-surface border border-cyber-border px-2 py-1 rounded hover:border-cyber-neon transition-colors whitespace-nowrap"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistantOverlay;

