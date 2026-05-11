import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Activity, BookOpen, Terminal, ChevronRight, AlertTriangle, ShieldCheck, Cpu, Globe } from 'lucide-react';
import { nexusService } from '../services/apiClient';
import CyberCard from '../components/CyberCard';
import GlobalHeader from '../components/GlobalHeader';

const NexusIntelligenceView = ({ initialTab = 'intelligence', headerTitle, headerSubtitle }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [data, setData] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNexusData = async () => {
      setLoading(true);
      try {
        const [dashRes, vulnRes, reportRes] = await Promise.all([
          nexusService.getDashboard(),
          nexusService.getVulnerabilities(),
          nexusService.getReportSummary()
        ]);
        setData(dashRes.data);
        setVulnerabilities(vulnRes.data);
        setReport(reportRes.data);
      } catch (err) {
        console.error("Nexus sync failure", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNexusData();
  }, []);

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300 border ${
        activeTab === id 
          ? 'bg-cyber-blue/10 border-cyber-blue/40 text-white shadow-blue-glow' 
          : 'bg-cyber-black border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'
      }`}
    >
      <Icon size={18} className={activeTab === id ? 'text-cyber-blue' : ''} />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );

  return (
    <div className="space-y-8 pb-20">
      <GlobalHeader title="Nexus Command" subtitle="Unified Tactical Intelligence & Protocol Management" />

      {/* Mode Selector */}
      <div className="flex flex-wrap gap-4 p-2 bg-cyber-black/40 border border-white/5 rounded-2xl w-fit">
        <TabButton id="tactical" label="Tactical Features" icon={Zap} />
        <TabButton id="intelligence" label="Intelligence Hub" icon={Activity} />
        <TabButton id="protocol" label="Protocol Spec" icon={BookOpen} />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'tactical' && (
          <motion.div
            key="tactical"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <CyberCard title="Exploitation Vectors" icon={Terminal}>
              <div className="space-y-4">
                <p className="text-xs text-gray-400">Weaponized attack paths derived from latest intelligence.</p>
                <div className="space-y-2">
                  {vulnerabilities.slice(0, 5).map((v, i) => (
                    <div key={i} className="p-4 bg-cyber-black/60 border border-white/5 rounded-xl flex items-center justify-between group hover:border-cyber-blue/30 transition-all">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-cyber-blue font-black tracking-widest uppercase mb-1">{v.severity}</span>
                        <span className="text-sm font-bold text-white uppercase">{v.name}</span>
                      </div>
                      <button className="p-2 rounded-lg bg-cyber-blue/10 text-cyber-blue opacity-0 group-hover:opacity-100 transition-all">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CyberCard>
            <CyberCard title="Background Operations" icon={Cpu}>
              <div className="space-y-6">
                <div className="p-6 bg-cyber-blue/5 border border-cyber-blue/20 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-blue/10 blur-3xl rounded-full" />
                  <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4">Neural Scanner Status</h4>
                  <div className="flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full bg-cyber-neon animate-pulse" />
                     <span className="text-xl font-mono font-black text-white">ORCHESTRATOR_IDLE</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">Ready for deployment on critical infrastructure.</p>
                </div>
              </div>
            </CyberCard>
          </motion.div>
        )}

        {activeTab === 'intelligence' && (
          <motion.div
            key="intelligence"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="p-6 bg-cyber-black border border-white/5 rounded-2xl space-y-2 group hover:border-cyber-blue/30 transition-all">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Total Intelligence Scans</span>
                  <div className="text-4xl font-black font-mono text-white tracking-tighter">{data?.total_scans || 0}</div>
                  <div className="text-[8px] text-cyber-blue font-black uppercase">Capacity: Production-Grade</div>
               </div>
               <div className="p-6 bg-cyber-black border border-white/5 rounded-2xl space-y-2 group hover:border-red-500/30 transition-all">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Critical Vulnerabilities</span>
                  <div className="text-4xl font-black font-mono text-red-500 tracking-tighter">{data?.critical_count || 0}</div>
                  <div className="text-[8px] text-red-400 font-black uppercase">Immediate Remediation Required</div>
               </div>
               <div className="p-6 bg-cyber-black border border-white/5 rounded-2xl space-y-2 group hover:border-cyber-neon/30 transition-all">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">System Defense Tier</span>
                  <div className="text-4xl font-black font-mono text-cyber-neon tracking-tighter">{data?.system_status || 'SECURE'}</div>
                  <div className="text-[8px] text-cyber-neon font-black uppercase">Neural Firewall Pulse Active</div>
               </div>
            </div>

            <CyberCard title="Global Threat Map" icon={Globe}>
              <div className="h-64 flex flex-col items-center justify-center bg-cyber-black/60 rounded-2xl border border-white/5 relative overflow-hidden">
                 <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                 <div className="relative z-10 space-y-4 text-center">
                    <Activity className="text-cyber-blue mx-auto animate-pulse" size={40} />
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Streaming Neural Intelligence...</p>
                 </div>
              </div>
            </CyberCard>
          </motion.div>
        )}

        {activeTab === 'protocol' && (
          <motion.div
            key="protocol"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-8 space-y-6">
              <CyberCard title="Compliance Protocol Specifications" icon={ShieldCheck}>
                <div className="space-y-6">
                   {[
                     { name: 'NIST 800-53', desc: 'Security and Privacy Controls for Federal Information Systems.', status: 'COMPLIANT' },
                     { name: 'OWASP ASVS', desc: 'Application Security Verification Standard v4.0.', status: 'AUDITING' },
                     { name: 'ISO/IEC 27001', desc: 'Information security management systems standard.', status: 'VERIFIED' },
                   ].map((p, i) => (
                     <div key={i} className="p-5 bg-cyber-black/60 border border-white/5 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                           <h5 className="font-bold text-white text-sm">{p.name}</h5>
                           <p className="text-xs text-gray-500">{p.desc}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest border ${
                          p.status === 'COMPLIANT' ? 'border-cyber-neon text-cyber-neon bg-cyber-neon/5' : 
                          p.status === 'VERIFIED' ? 'border-cyber-blue text-cyber-blue bg-cyber-blue/5' : 
                          'border-cyber-warning text-cyber-warning bg-cyber-warning/5'
                        }`}>
                          {p.status}
                        </span>
                     </div>
                   ))}
                </div>
              </CyberCard>
            </div>
            <div className="lg:col-span-4">
              <CyberCard title="Latest Audit Report" icon={BookOpen}>
                 <div className="space-y-4">
                    <div className="flex flex-col items-center p-8 bg-cyber-blue/5 border border-cyber-blue/20 rounded-2xl">
                       <BookOpen size={48} className="text-cyber-blue mb-4" />
                       <span className="text-[10px] font-black text-gray-500 uppercase mb-2">INTELLIGENCE_AUDIT_{report?.latest_scan || 'NONE'}</span>
                       <span className="text-sm font-bold text-white">{report?.findings_count || 0} Findings Localized</span>
                    </div>
                    <button className="cyber-button w-full py-4 text-[10px] font-black tracking-widest uppercase">
                       ACCESS SPECIFICATIONS
                    </button>
                 </div>
              </CyberCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NexusIntelligenceView;
