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

const normalizeSeverity = (sev) => {
  if (!sev) return 'Medium';
  const s = String(sev).toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const VulnerabilityCard = ({ vuln, index, onExecute }) => {
  const [isOpen, setIsOpen] = useState(false);
  const severity = normalizeSeverity(vuln.severity);

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
          <div className={`px-3 py-1 rounded-md border text-xs font-semibold ${severityColors[severity]}`}>
            {severity}
          </div>
          
          <div className="flex flex-col">
            <h4 className={`text-base font-semibold tracking-tight transition-colors ${['http', 'https', 'ftp', 'ssh'].some(s => (vuln.service || vuln.name || '').toLowerCase().includes(s)) ? 'text-red-400' : 'text-white group-hover:text-blue-400'}`}>
              {vuln.name}
            </h4>
            <span className="text-xs font-mono text-gray-500 mt-0.5">
              {vuln.cve_id && vuln.cve_id !== 'N/A' ? vuln.cve_id : `Finding #${index + 1}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-1 rounded-full bg-cyber-neon" />
                <span className="text-xs font-medium text-gray-500">Verified</span>
             </div>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold font-mono leading-none tracking-tight ${cvssScore >= 9 ? 'text-red-500' : cvssScore >= 7 ? 'text-orange-500' : 'text-blue-500'}`}>
                {cvssScore.toFixed(1)}
              </span>
              <div className="w-1.5 h-10 bg-gray-900/50 rounded-full overflow-hidden flex flex-col justify-end border border-white/5">
                <motion.div 
                   initial={{ height: 0 }}
                   animate={{ height: `${progressPercent}%` }}
                   className={`w-full rounded-full ${severityGlow[severity]}`} 
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
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
                       <h5 className="text-xs font-semibold text-gray-300 tracking-wide">Description & Impact</h5>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-4xl">
                      {vuln.description || "Vulnerability identified in the processing layer that could lead to unauthorized access or data exposure."}
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
                          <div className="flex items-center gap-3 text-red-500/70">
                             <ShieldAlert size={16} />
                             <h6 className="text-xs font-semibold tracking-wide">Attack Vector</h6>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed">
                            {vuln.vector || "Remote exploitation via malformed input leading to memory corruption."}
                          </p>
                       </div>
                       <div className="p-8 rounded-3xl bg-black/40 border border-white/5 space-y-4 hover:border-cyber-neon/20 transition-all group/r">
                          <div className="flex items-center gap-3 text-cyber-neon/70">
                             <CheckCircle size={16} />
                             <h6 className="text-xs font-semibold tracking-wide">Remediation</h6>
                          </div>
                          <p className="text-sm text-gray-400 leading-relaxed">
                            {vuln.remediation || "Update the affected component to the latest patched version and apply egress filtering."}
                          </p>
                       </div>
                    </div>

                    {/* Right: Framework Intelligence Sidebar */}
                    <div className="p-8 rounded-3xl bg-[#030303] border border-blue-500/10 shadow-inner relative overflow-hidden">
                       <div className="absolute top-6 right-8 opacity-5">
                          <Cpu size={48} className="text-blue-500" />
                       </div>
                       <h6 className="text-xs font-semibold text-blue-400 tracking-wide mb-8">Framework Intelligence</h6>
                       
                       <div className="space-y-6">
                          <div className="flex items-center justify-between py-3 border-b border-white/5">
                             <span className="text-xs font-medium text-gray-500">OWASP Top 10</span>
                             <span className="text-sm font-mono font-semibold text-white">{vuln.owasp || vuln.owasp_category || "A03:2021-Injection"}</span>
                          </div>
                          <div className="flex items-center justify-between py-3 border-b border-white/5">
                             <span className="text-xs font-medium text-gray-500">MITRE Technique</span>
                             <span className="text-sm font-mono font-semibold text-gray-300">{vuln.mitre || vuln.mitre_id || "T1190"}</span>
                          </div>
                          <div className="flex items-center justify-between py-3 border-b border-white/5">
                             <span className="text-xs font-medium text-gray-500">Attack Stage</span>
                             <span className="text-sm font-semibold text-cyber-neon">{vuln.stage || "Initial Access"}</span>
                          </div>
                       </div>

                        <div className="mt-8 flex items-center gap-3">
                           <button 
                             onClick={(e) => { e.stopPropagation(); onExecute(vuln); }}
                             className="flex-1 bg-cyber-blue hover:bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] group/x"
                           >
                              <Zap size={14} />
                              <span className="text-sm font-semibold">Run exploit check</span>
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
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 text-gray-500">
        <Loader2 className="animate-spin text-cyber-blue" size={40} strokeWidth={1.5} />
        <span className="text-sm font-medium">Loading vulnerabilities…</span>
      </div>
    );
  }

  const norm = (v) => normalizeSeverity(v.severity);
  const stats = [
    { label: 'Critical', count: (vulnerabilities || []).filter(v => norm(v) === 'Critical').length, color: 'text-red-500', bg: 'stat-card-critical' },
    { label: 'High', count: (vulnerabilities || []).filter(v => norm(v) === 'High').length, color: 'text-orange-500', bg: 'stat-card-high' },
    { label: 'Medium', count: (vulnerabilities || []).filter(v => norm(v) === 'Medium').length, color: 'text-blue-400', bg: 'stat-card-medium' },
    { label: 'Total Findings', count: (vulnerabilities || []).length, color: 'text-white', bg: 'stat-card-total' }
  ];

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 pb-20">
      <GlobalHeader title="Vulnerabilities" subtitle="Findings and remediation guidance." />

      <div className="flex items-center gap-3">
         <div className="px-2.5 py-1 bg-cyber-neon/10 border border-cyber-neon/30 rounded-md text-xs font-semibold text-cyber-neon flex items-center gap-1.5">
            <CheckCircle size={12} /> Verified
         </div>
         <span className="text-sm text-gray-500">Prioritized by CVSS and exploitability.</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card flex flex-col gap-1 py-5">
            <div className={`text-3xl font-bold font-mono tracking-tight ${stat.color}`}>
              {stat.count}
            </div>
            <div className="text-sm font-medium text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Feed Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-2.5 text-gray-300">
           <Zap size={16} className="text-cyber-neon" />
           <h3 className="text-base font-semibold">Findings</h3>
        </div>

        {(!vulnerabilities || vulnerabilities.length === 0) ? (
          <div className="py-32 text-center border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.01]">
             <ShieldAlert size={56} className="mx-auto text-gray-700 mb-5" />
             <p className="text-gray-400 font-medium text-base">No findings yet — run a scan to get started.</p>
             <button onClick={() => navigate('/scan')} className="mt-6 px-6 py-2.5 bg-cyber-blue rounded-lg text-sm font-semibold text-white hover:bg-blue-600 transition-all">
                Start a scan
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

