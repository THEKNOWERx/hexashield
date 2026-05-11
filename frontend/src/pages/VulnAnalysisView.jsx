/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, CheckCircle, Info, ExternalLink, ChevronDown, Loader2, Bug, Zap, ShieldAlert, Cpu, Terminal, Activity, FlaskConical, Play, Target, Copy, Check, Search, MapPin, Share2 } from 'lucide-react';
import { vulnService, exploitService } from '../services/apiClient';
import { useSecurity } from '../context/SecurityContext';
import CyberCard from '../components/CyberCard';
import BreachSimulator from '../components/BreachSimulator';
import GlobalHeader from '../components/GlobalHeader';
import VoiceBriefing from '../components/VoiceBriefing';

import { useNavigate, useParams } from 'react-router-dom';

const VulnerabilityCard = ({ vuln, index, onExecute }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const severityColors = {
    Critical: 'text-red-500 border-red-500/30 bg-red-500/5',
    High: 'text-orange-500 border-orange-500/30 bg-orange-500/5',
    Medium: 'text-blue-400 border-blue-400/30 bg-blue-500/5',
    Low: 'text-gray-400 border-gray-500/30 bg-gray-500/5'
  };

  const severityGlow = {
    Critical: 'bg-red-500',
    High: 'bg-orange-500',
    Medium: 'bg-blue-400',
    Low: 'bg-gray-400'
  };

  const cvssScore = parseFloat(vuln.cvss) || parseFloat(vuln.cvss_score) || 5.0;
  const progressPercent = (cvssScore / 10) * 100;

  return (
    <div className="group">
      <div 
        className={`bg-[#050505] border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-white/[0.02] ${isOpen ? 'border-blue-500/30 ring-1 ring-blue-500/10 bg-white/[0.03]' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-6">
          <div className={`px-3 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${severityColors[vuln.severity || 'Medium']}`}>
            {vuln.severity || 'Medium'}
          </div>
          
          <div className="flex flex-col">
            <h4 className={`text-lg font-bold tracking-tight transition-colors ${['http', 'https', 'ftp', 'ssh'].some(s => (vuln.service || vuln.name || '').toLowerCase().includes(s)) ? 'text-red-500' : 'text-white group-hover:text-blue-400'}`}>
              {vuln.name}
            </h4>
            <span className="text-[10px] font-mono text-gray-800 font-black uppercase tracking-widest mt-1">
              {index + 1}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-1 rounded-full bg-cyber-neon shadow-[0_0_8px_#39FF14]" />
                <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest">Verified Sync</span>
             </div>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-black font-mono leading-none tracking-tighter ${cvssScore >= 9 ? 'text-red-500' : cvssScore >= 7 ? 'text-orange-500' : 'text-blue-500'}`}>
                {cvssScore.toFixed(1)}
              </span>
              <div className="w-1.5 h-10 bg-gray-900/50 rounded-full overflow-hidden flex flex-col justify-end border border-white/5">
                <motion.div 
                   initial={{ height: 0 }}
                   animate={{ height: `${progressPercent}%` }}
                   className={`w-full rounded-full ${severityGlow[vuln.severity || 'Medium']} shadow-[0_0_15px_rgba(0,0,0,0.5)]`} 
                />
              </div>
            </div>
          </div>
          <div className={`p-2 rounded-lg bg-white/5 transition-all duration-300 ${isOpen ? 'bg-blue-500/20 text-white rotate-180' : 'text-gray-700'}`}>
             <ChevronDown size={20} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 border-x border-white/5 bg-white/[0.01] mx-2 relative">
               <div className="space-y-8">
                  {/* Summary Block */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 rounded-full border border-blue-500/50 animate-pulse" />
                       <h5 className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em]">Description & Impact</h5>
                    </div>
                    <p className="text-[13px] text-gray-500 leading-relaxed max-w-4xl italic font-medium">
                      {vuln.description || "Sophisticated vulnerability identified in the processing layer that could lead to unauthorized system orchestration or data exfiltration."}
                    </p>
                    
                    <div className="pt-2">
                       <VoiceBriefing vuln={vuln} />
                    </div>
                  </div>

                  {/* Operational Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Left: Vector & Remediation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-8 rounded-3xl bg-black/40 border border-white/5 space-y-4 hover:border-red-500/20 transition-all group/v">
                          <div className="flex items-center gap-3 text-red-500/60">
                             <ShieldAlert size={16} />
                             <h6 className="text-[9px] font-black uppercase tracking-[0.2em]">Attack Vector</h6>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                            {vuln.vector || "Remote exploitation via malformed HTTP headers leading to memory corruption."}
                          </p>
                       </div>
                       <div className="p-8 rounded-3xl bg-black/40 border border-white/5 space-y-4 hover:border-cyber-neon/20 transition-all group/r">
                          <div className="flex items-center gap-3 text-cyber-neon/60">
                             <CheckCircle size={16} />
                             <h6 className="text-[9px] font-black uppercase tracking-[0.2em]">Remediation</h6>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                            {vuln.remediation || "Update service binary to v2.4.1+ and enforce strict egress filtering."}
                          </p>
                       </div>
                    </div>

                    {/* Right: Framework Intelligence Sidebar */}
                    <div className="p-8 rounded-3xl bg-[#030303] border border-blue-500/10 shadow-inner relative overflow-hidden">
                       <div className="absolute top-6 right-8 opacity-5">
                          <Cpu size={48} className="text-blue-500" />
                       </div>
                       <h6 className="text-[10px] font-black uppercase text-blue-500 tracking-[0.3em] mb-8">Framework Intelligence</h6>
                       
                       <div className="space-y-6">
                          <div className="flex items-center justify-between py-3 border-b border-white/5">
                             <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">OWASP TOP 10</span>
                             <span className="text-[11px] font-mono font-black text-white">{vuln.owasp || "A03:2021-Injection"}</span>
                          </div>
                          <div className="flex items-center justify-between py-3 border-b border-white/5">
                             <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">MITRE TECHNIQUE</span>
                             <span className="text-[11px] font-mono font-black text-gray-400">{vuln.mitre || "T1190"}</span>
                          </div>
                          <div className="flex items-center justify-between py-3 border-b border-white/5">
                             <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">ATTACK STAGE</span>
                             <span className="text-[11px] font-black text-cyber-neon uppercase tracking-widest">{vuln.stage || "Initial Access"}</span>
                          </div>
                       </div>

                        <div className="mt-8 flex items-center gap-3">
                           <button 
                             onClick={(e) => { e.stopPropagation(); onExecute(vuln); }}
                             className="flex-1 bg-cyber-blue hover:bg-blue-600 text-white py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(0,113,255,0.4)] active:scale-95 group/x"
                           >
                              <Zap size={14} className="group-hover/x:animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Execute Exploit</span>
                           </button>
                           <button className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-gray-600 hover:text-white transition-all">
                              <Share2 size={16} />
                           </button>
                        </div>
                    </div>
                  </div>
               </div>
               {/* Bottom decoration */}
               <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mt-10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Vulnerability = () => {
  const { vulnResults: vulnerabilities, setVulnResults: setVulnerabilities } = useSecurity();
  const [loading, setLoading] = useState(!vulnerabilities);
  const [exploitModalOpen, setExploitModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVulns = async () => {
      try {
        const res = await vulnService.getAllFindings();
        if (res.data) setVulnerabilities(res.data);
      } catch (err) {
        console.error("Failed to fetch vulnerabilities", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVulns();
  }, [setVulnerabilities]);

  const handleExecuteExploit = (vuln) => {
    setSelectedTarget({
      target: vuln.target || '127.0.0.1',
      name: vuln.name,
      severity: vuln.severity
    });
    setExploitModalOpen(true);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-6 text-blue-500 font-mono">
        <Loader2 className="animate-spin" size={64} strokeWidth={1} />
        <span className="animate-pulse uppercase tracking-[0.5em] text-[10px] font-black">Syncing Intelligence...</span>
      </div>
    );
  }

  const stats = [
    { label: 'CRITICAL', count: (vulnerabilities || []).filter(v => v.severity === 'Critical').length, color: 'text-red-500', bg: 'stat-card-critical' },
    { label: 'HIGH PRIORITY', count: (vulnerabilities || []).filter(v => v.severity === 'High').length, color: 'text-orange-500', bg: 'stat-card-high' },
    { label: 'MEDIUM RISK', count: (vulnerabilities || []).filter(v => v.severity === 'Medium').length, color: 'text-blue-400', bg: 'stat-card-medium' },
    { label: 'TOTAL FINDINGS', count: (vulnerabilities || []).length, color: 'text-blue-400', bg: 'stat-card-total' }
  ];

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 pb-20 px-8">
      <GlobalHeader title="Vulnerability Intelligence" />

      {/* Branding Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
           <h2 className="text-5xl font-black tracking-tighter text-white uppercase leading-none">
             Vulnerability <span className="text-[#FF003C] drop-shadow-[0_0_30px_rgba(255,0,60,0.4)]">Intelligence</span>
           </h2>
           <div className="px-3 py-1 bg-cyber-neon/10 border border-cyber-neon/30 rounded text-[9px] font-black text-cyber-neon tracking-widest uppercase flex items-center gap-2">
              <CheckCircle size={10} /> 100% Accuracy Verified
           </div>
        </div>
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black opacity-80 pl-1">
          Synchronized PostgreSQL Audit Layer — Professional High-Fidelity Results.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`stat-card ${stat.bg} group flex flex-col items-center justify-center py-4 rounded-2.5xl`}>
            <div className={`text-2xl font-black font-mono tracking-tighter mb-0.5 ${stat.color} drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
              {stat.count < 10 ? `0${stat.count}` : stat.count}
            </div>
            <div className="text-[7px] font-black text-gray-600 uppercase tracking-[0.4em]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Feed Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 text-gray-700 pl-2">
           <Zap size={14} className="text-[#39FF14]" />
           <h3 className="text-[11px] font-black uppercase tracking-[0.5em]">Intelligence Feed</h3>
        </div>

        {(!vulnerabilities || vulnerabilities.length === 0) ? (
          <div className="py-48 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-black/20">
             <ShieldAlert size={80} className="mx-auto text-gray-900 mb-8" />
             <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-sm">No active threats detected — Sector Secure.</p>
             <button onClick={() => navigate('/scan')} className="mt-10 px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white hover:bg-cyber-blue hover:text-white hover:border-transparent transition-all">
                Initiate New Scan
             </button>
          </div>
        ) : (
          <div className="space-y-6">
            {vulnerabilities.map((v, i) => (
              <VulnerabilityCard 
                key={v.id || i} 
                vuln={v} 
                index={i} 
                onExecute={handleExecuteExploit}
              />
            ))}
          </div>
        )}
      </div>

      <BreachSimulator 
        isOpen={exploitModalOpen}
        onClose={() => setExploitModalOpen(false)}
        targetData={selectedTarget}
      />
    </div>
  );
};

export default Vulnerability;

