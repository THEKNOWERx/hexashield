"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Mic2, ShieldCheck, Play, Square } from 'lucide-react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

const VoiceBriefing = ({ vuln }) => {
  const { speak, stop, isSpeaking } = useVoiceAssistant();

  if (!vuln) return null;

  const generateScript = () => {
    const severity = vuln.severity || 'Medium';
    const name = vuln.name || 'Unidentified Threat';
    const cve = vuln.cve_id || 'CVE-Pending';
    const target = vuln.target || 'target host';
    const service = vuln.service || 'network service';

    return `
      Technical Briefing initiated. 
      Criticality level: ${severity}.
      Target Identification: ${target}.
      
      We have identified a significant vulnerability in the ${service}, identified as ${name}.
      
      The attack vector involves a sophisticated exploitation of the ${service} layer. 
      An attacker could leverage this to gain unauthorized system orchestration or remote execution capabilities.
      
      The potential impact is rated as ${severity}, which could lead to a total compromise of service integrity on ${target}.
      
      Strategic Recommendation: Immediate remediation is required. Please update the affected binaries to version two-point-four or higher and enforce strict egress filtering.
      
      End of briefing.
    `.trim();
  };

  const handleToggle = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(generateScript());
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-blue-500/20 transition-all group">
      <button 
        onClick={handleToggle}
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${
          isSpeaking 
          ? 'bg-red-500 text-white animate-pulse' 
          : 'bg-cyber-blue hover:bg-blue-600 text-white active:scale-95'
        }`}
      >
        {isSpeaking ? <Square size={16} fill="currentColor" /> : <Volume2 size={20} />}
      </button>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Mic2 size={12} className={isSpeaking ? 'text-cyber-neon' : 'text-gray-600'} />
          <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase">AI Strategic Briefing</h4>
        </div>
        
        {isSpeaking ? (
          <div className="flex items-center gap-1 h-3 overflow-hidden">
             {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
               <motion.div
                 key={i}
                 initial={{ height: 2 }}
                 animate={{ height: [2, 12, 4, 10, 2] }}
                 transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                 className="w-1 bg-cyber-neon rounded-full"
               />
             ))}
          </div>
        ) : (
          <p className="text-[11px] font-medium text-gray-500 line-clamp-1 group-hover:text-gray-300">
            Listen to the technical analyst's report on {vuln.name}
          </p>
        )}
      </div>

      <div className="hidden lg:block px-3 py-1 rounded bg-white/5 border border-white/10 text-[8px] font-black text-gray-600 uppercase tracking-widest">
        Voice Sync Ready
      </div>
    </div>
  );
};

export default VoiceBriefing;
