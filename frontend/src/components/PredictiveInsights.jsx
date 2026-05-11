import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, ShieldCheck, Zap, AlertTriangle, ArrowUpRight, Cpu } from 'lucide-react';

const PredictiveInsights = ({ data }) => {
  if (!data) return (
    <div className="cyber-panel flex items-center justify-center p-20 gap-6 opacity-30">
       <Cpu size={32} className="animate-spin duration-[4s]" />
       <span className="text-xs font-black tracking-[0.5em] uppercase">Simulating Adversary Logic...</span>
    </div>
  );

  const { top_risks, threat_scenario, remediation_priority } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* ADVERSARY SCENARIO CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:col-span-2 cyber-panel relative overflow-hidden group border-white/5"
      >
        <div className="absolute top-0 right-0 p-32 bg-cyber-blue/10 rounded-full blur-[100px] -mr-16 -mt-16 opacity-20" />
        
        <div className="relative z-10 flex flex-col h-full">
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-cyber-blue/10 border border-cyber-blue/20 rounded-xl text-cyber-blue">
                    <Brain size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Probabilistic Threat Model</h3>
                    <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mt-1">AI-Driven Scenario Generation</p>
                 </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-full">
                 <div className="w-1.5 h-1.5 rounded-full bg-cyber-neon shadow-neon-glow animate-pulse" />
                 <span className="text-[9px] font-black text-white uppercase tracking-widest">Active Hypothesis</span>
              </div>
           </div>

           <div className="flex-1 space-y-8">
              <div className="p-8 bg-black/40 border border-white/5 rounded-2xl relative">
                 <div className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em] mb-4">Adversary Trajectory</div>
                 <p className="text-lg text-white font-black italic leading-relaxed tracking-tight">
                    {threat_scenario}
                 </p>
                 <ShieldCheck className="absolute top-8 right-8 text-white/5" size={48} />
              </div>

              <div className="grid grid-cols-2 gap-8">
                 {top_risks.map((risk, i) => (
                    <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-xl hover:border-cyber-blue/40 transition-all group/risk">
                       <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-white px-3 py-1 bg-cyber-blue/20 rounded border border-cyber-blue/20 uppercase tracking-widest">{risk.risk_level}</span>
                          <span className="text-[10px] font-mono text-gray-500 tabular-nums">CONF: {(risk.confidence * 100).toFixed(1)}%</span>
                       </div>
                       <h4 className="text-sm font-black text-white group-hover/risk:text-cyber-blue transition-colors uppercase tracking-tight">{risk.name}</h4>
                       <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-cyber-blue" />
                             <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Tactic: {risk.mitre_tech}</span>
                          </div>
                          <ArrowUpRight size={14} className="text-gray-800 group-hover/risk:text-white transition-all" />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </motion.div>

      {/* STRATEGIC REMEDIATION CARD */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="cyber-panel bg-black/40 border-white/5 flex flex-col"
      >
        <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8">
           <div className="p-3 bg-cyber-alert/5 border border-cyber-alert/20 rounded-xl text-cyber-alert">
              <Target size={24} />
           </div>
           <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Remediation Priority</h3>
              <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mt-1">Kill-Chain Suppression List</p>
           </div>
        </div>

        <div className="flex-1 space-y-4">
           {remediation_priority.map((item, i) => (
              <div key={i} className="flex items-center gap-5 p-5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all cursor-default group">
                 <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black border border-white/5 text-[10px] font-black text-gray-400 group-hover:text-white transition-all">
                    {i + 1}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[8px] font-black text-cyber-alert uppercase tracking-widest">{item.action.split('//')[0]}</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="text-[11px] font-black text-white italic">{(item.exploit_prob * 10).toFixed(1)}</div>
                    <div className="text-[8px] font-black text-gray-700 uppercase tracking-tighter">Prob</div>
                 </div>
              </div>
           ))}
        </div>

        <button className="w-full mt-10 py-5 bg-white text-black font-black text-[10px] tracking-[0.4em] uppercase hover:bg-gray-200 transition-all">
           Authorize Neutralization
        </button>
      </motion.div>
    </div>
  );
};

export default PredictiveInsights;
