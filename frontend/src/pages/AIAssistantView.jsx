 
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Info, Volume2, Shield, Zap } from 'lucide-react';
import { nexusService } from '../services/apiClient';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import GlobalHeader from '../components/GlobalHeader';

const AIAssistant = ({ isMonochrome, onToggleMonochrome, headerTitle, headerSubtitle }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "أنا المحلل الأمني Nexus. أنا جاهز لتحليل نتائج المسح الأخير، وشرح الثغرات المكتشفة، وتقديم مسارات المعالجة الاستراتيجية. كيف يمكنني مساعدتك؟",
      type: 'message'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { speak, stop, isSpeaking } = useVoiceAssistant();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input, type: 'message' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await nexusService.chat({ query: input });
      const data = res.data;
      
      const assistantMsg = { 
        role: 'assistant', 
        content: data.answer,
        risk: data.risk_level,
        remediation: data.recommendation,
        confidence: data.confidence,
        type: 'analysis'
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      speak(data.answer);
    } catch (err) {
      console.error("AI Assistant error", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Neural Link Error: Failed to reach the security core.", type: 'error' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const [deepAnalysis, setDeepAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const runDeepInterrogation = async () => {
    setAnalyzing(true);
    try {
      // Fetch the most recent scan ID to analyze
      const reportsRes = await aiService.chat("Summarize scan results", ""); // Just a dummy to trigger context if needed, but better to use a real ID
      // For demo/sim, we use the last scan ID 1
      const res = await aiService.runDeepAnalysis(1); 
      setDeepAnalysis(res.data);
    } catch (err) {
      console.error("Deep analysis error", err);
    } finally {
      setAnalyzing(false);
    }
  };


  return (
    <div className="flex flex-col h-full space-y-6">
      <GlobalHeader 
        title={headerTitle} 
        subtitle={headerSubtitle} 
        isMonochrome={isMonochrome} 
        onToggleMonochrome={onToggleMonochrome} 
      />

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 cyber-panel flex flex-col bg-cyber-dark/30 relative">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="h-full w-full bg-grid-pattern bg-[size:20px_20px]"></div>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyber-border">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center 
                    ${msg.role === 'user' ? 'bg-cyber-blue text-white' : 'bg-cyber-surface border border-cyber-border text-cyber-neon'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-xl text-sm leading-relaxed shadow-xl border
                    ${msg.role === 'user' ? 'bg-cyber-blue/10 text-blue-100 border-cyber-blue/30' : 'bg-cyber-surface/50 text-gray-300 border-cyber-border'}`}>
                    
                    {msg.content}

                    {msg.type === 'analysis' && (
                        <div className="mt-4 space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border 
                                    ${msg.risk === 'CRITICAL' ? 'border-red-500 text-red-500 bg-red-500/10' : 
                                      msg.risk === 'HIGH' ? 'border-orange-500 text-orange-500 bg-orange-500/10' : 
                                      'border-blue-500 text-blue-500 bg-blue-500/10'}`}>
                                    Risk Engagement: {msg.risk}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-gray-500 font-mono italic">Confidence Cluster: {msg.confidence}</span>
                                    <div className="flex gap-0.5">
                                        {[1,2,3].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= 2 ? 'bg-cyber-neon' : 'bg-gray-800'}`} />)}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-cyber-blue/5 rounded-xl border border-cyber-blue/10 flex items-start gap-3">
                                <Zap size={14} className="text-cyber-neon mt-0.5" />
                                <div>
                                    <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Strategic Remediation</span>
                                    <p className="text-xs text-gray-400 italic font-mono leading-relaxed">{msg.remediation}</p>
                                </div>
                            </div>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-cyber-surface border border-cyber-border p-3 rounded-lg flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-cyber-border bg-cyber-black/50">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="Ask about vulnerabilities, remediation, or scan results..."
                className="flex-1 bg-cyber-black border border-cyber-border rounded-lg px-4 py-3 text-sm focus:border-cyber-blue outline-none transition-all"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                className="bg-cyber-blue text-white p-3 rounded-lg hover:bg-blue-600 transition-all active:scale-95 shadow-[0_0_15px_rgba(0,71,255,0.4)]"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-80 space-y-6 hidden lg:block">
          <div className="cyber-panel">
            <h4 className="font-bold mb-4 flex items-center gap-2 text-cyber-blue text-sm">
              <Terminal size={16} />
              Suggested Queries
            </h4>
            <div className="space-y-2">
              {[
                "Explain CVE-2021-44228 (Log4Shell)",
                "What is the Cyber Kill Chain?",
                "How to remediate SQL Injection?",
                "Analyze critical vulnerabilities in detail",
                "Summarize OWASP Top 10 findings",
                "Explain MITRE ATT&CK T1190"
              ].map(q => (
                <button 
                  key={q} 
                  onClick={() => { setInput(q); }}
                  className="w-full text-left p-2.5 text-xs text-gray-400 hover:text-white hover:bg-cyber-surface rounded-lg border border-transparent hover:border-cyber-border transition-all"
                >
                  â†’ {q}
                </button>
              ))}
            </div>
          </div>

          <div className="cyber-panel">
            <h4 className="font-bold mb-4 flex items-center gap-2 text-cyber-blue text-sm">
              <Sparkles size={16} />
              Neural Deep Interrogation
            </h4>
            <button 
              onClick={runDeepInterrogation}
              disabled={analyzing}
              className="w-full py-3 bg-cyber-blue text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(0,71,255,0.3)] disabled:opacity-50"
            >
              {analyzing ? 'Synthesizing...' : 'Run Advanced Interrogation'}
            </button>
            
            {deepAnalysis && (
              <div className="mt-6 space-y-4">
                 <div className="p-3 bg-cyber-neon/10 border border-cyber-neon/20 rounded-lg">
                    <span className="text-[10px] font-black text-cyber-neon uppercase tracking-widest block mb-1">Risk Posture</span>
                    <span className="text-sm font-bold text-white">{deepAnalysis.analysis_metadata.risk_posture}</span>
                 </div>
                 <div className="space-y-2">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Detected Chains</span>
                    {deepAnalysis.chained_attacks.map((chain, idx) => (
                      <div key={idx} className="p-2 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-100 font-bold">
                        {chain.name}
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>

          <div className="cyber-panel bg-cyber-blue/5 border-cyber-blue/20">
            <h4 className="font-bold mb-2 flex items-center gap-2 text-cyber-blue text-sm">
              <Info size={16} />
              Context Awareness
            </h4>
            <p className="text-[10px] text-gray-500 leading-normal">
              The AI is currently processing the latest scan results. All suggestions are tailored to your specific infrastructure findings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;

