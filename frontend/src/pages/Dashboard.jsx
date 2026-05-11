import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, AlertTriangle, Network, Cpu, Activity, 
  Layers, Binary, Database, Zap, Brain,
  X, Filter, Search, ChevronRight, BarChart3, PieChart,
  Target, Globe, Server, TrendingUp
} from 'lucide-react';

import StatCard from '../components/StatCard';
import NeuralAttackGraph from '../components/NeuralAttackGraph';
import VulnTrendChart from '../components/VulnTrendChart';
import ServiceRiskChart from '../components/ServiceRiskChart';
import IntelligenceDoughnut from '../components/IntelligenceDoughnut';
import GlobalHeader from '../components/GlobalHeader';

import { vulnService, attackPathService, nexusService } from '../services/apiClient';
import { useSecurity } from '../context/SecurityContext';

const Dashboard = ({ headerTitle = "Cyber-Defense Hub", headerSubtitle = "Strategic visibility and AI prioritization." }) => {
  const { vulnResults: findings, setVulnResults } = useSecurity();
  const [stats, setStats] = useState({ ai_accuracy: 100, total_scans: 124, last_scan: '2m ago' });
  const [attackGraph, setAttackGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFinding, setSelectedFinding] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [statsRes, findingsRes, graphRes] = await Promise.all([
          nexusService.getDashboard().catch(() => ({ data: {} })),
          vulnService.getAllFindings().catch(() => ({ data: [] })),
          attackPathService.generateGraph().catch(() => ({ data: { graph: null } }))
        ]);
        
        if (isMounted) {
          if (statsRes?.data) setStats(prev => ({ ...prev, ...statsRes.data }));
          if (findingsRes?.data) setVulnResults(Array.isArray(findingsRes.data) ? findingsRes.data : []);
          if (graphRes?.data?.graph) setAttackGraph(graphRes.data.graph);
        }
      } catch (err) {
        console.error("Dashboard Link Layer Failure", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [setVulnResults]);

  const safeFindings = useMemo(() => Array.isArray(findings) ? findings : [], [findings]);

  const filteredFindings = useMemo(() => {
    return safeFindings.filter(f => {
      const matchesSeverity = severityFilter === 'ALL' || f.severity?.toUpperCase() === severityFilter;
      const nameMatch = (f.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const portMatch = (f.port || '').toString().includes(searchQuery);
      return matchesSeverity && (nameMatch || portMatch);
    });
  }, [safeFindings, severityFilter, searchQuery]);

  const statsCore = useMemo(() => {
    const crit = safeFindings.filter(f => ["CRITICAL", "HIGH"].includes(f.severity?.toUpperCase())).length;
    const expl = safeFindings.filter(f => f.cve_id && f.cve_id !== 'N/A').length;
    return {
      total: safeFindings.length,
      critical: crit,
      exploitable: expl,
      risk: safeFindings.length > 0 
        ? safeFindings.reduce((acc, f) => acc + (parseFloat(f.cvss) || 5.0), 0) / safeFindings.length 
        : 0
    };
  }, [safeFindings]);

  const mostCritical = useMemo(() => {
    if (safeFindings.length === 0) return null;
    return [...safeFindings].sort((a, b) => (parseFloat(b.cvss) || 0) - (parseFloat(a.cvss) || 0))[0];
  }, [safeFindings]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Neural Link Synchronizing...</span>
       </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      <GlobalHeader title={headerTitle} subtitle={headerSubtitle} />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-10 mt-10">
         <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-cyber-blue animate-pulse" />
               <span className="text-[10px] font-black text-cyber-blue uppercase tracking-[0.4em]">SOC Strategic Command</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Threat Intelligence <span className="text-cyber-blue">Neural</span>Hub</h1>
         </div>
         <div className="flex items-center gap-8 mt-8 md:mt-0">
         </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard title="Total Findings" value={statsCore.total} icon={Layers} colorClass="text-cyber-blue" subtext="Aggregated surface data" />
        <StatCard title="Critical Nodes" value={statsCore.critical} icon={ShieldAlert} colorClass="text-cyber-alert" subtext="Immediate priority" />
        <StatCard title="Weaponized" value={statsCore.exploitable} icon={Zap} colorClass="text-cyber-warning" subtext="Public exploit match" />
        <StatCard title="Risk Index" value={statsCore.risk.toFixed(1)} icon={Brain} colorClass="text-purple-500" subtext="AI-weighted average" />
      </div>

      {/* CENTER ANALYTICS */}
      <div className="grid grid-cols-12 gap-8">
         {/* AI Insight */}
         <div className="col-span-12 lg:col-span-4 cyber-panel bg-cyber-surface border-white/5 p-8 relative overflow-hidden h-full">
            <div className="flex items-center gap-3 mb-8">
               <Cpu className="text-cyber-blue" size={20} />
               <h3 className="text-xs font-black text-white uppercase tracking-widest">AI Matrix Insight</h3>
            </div>
            
            {mostCritical ? (
               <div className="space-y-8 relative z-10">
                  <div className="p-6 bg-black/40 border border-cyber-alert/20 rounded-2xl">
                     <h4 className="text-lg font-black text-white uppercase italic leading-tight mb-2">{mostCritical.name}</h4>
                     <p className="text-[10px] text-gray-500 leading-relaxed uppercase">{mostCritical.description?.substring(0, 100)}...</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-gray-700 uppercase block mb-1">Severity</span>
                        <span className="text-xl font-black text-white italic">{mostCritical.cvss}</span>
                     </div>
                     <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-cyber-neon border-cyber-neon/20">
                        <span className="text-[8px] uppercase block mb-1">Likelihood</span>
                        <span className="text-xl font-black italic">HIGH</span>
                     </div>
                  </div>
               </div>
            ) : <p className="text-[10px] text-gray-700 uppercase">Awaiting telemetry...</p>}
         </div>

         {/* Distribution Chart */}
         <div className="col-span-12 lg:col-span-4 cyber-panel bg-cyber-surface border-white/5 p-8">
            <div className="flex items-center gap-3 mb-8">
               <PieChart className="text-cyber-blue" size={18} />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Risk Distribution</span>
            </div>
            <div className="h-[280px]">
               <IntelligenceDoughnut findings={safeFindings} />
            </div>
         </div>

         {/* Trend Chart */}
         <div className="col-span-12 lg:col-span-4 cyber-panel bg-cyber-surface border-white/5 p-8">
            <div className="flex items-center gap-3 mb-8">
               <TrendingUp className="text-cyber-neon" size={18} />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Temporal Trends</span>
            </div>
            <div className="h-[280px]">
               <VulnTrendChart findings={safeFindings} />
            </div>
         </div>
      </div>

      {/* MATRIX TABLE */}
      <div className="space-y-8">
         <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Intelligence Matrix</h3>
            <div className="flex gap-4">
               {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
                  <button key={sev} onClick={() => setSeverityFilter(sev)} className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${severityFilter === sev ? 'bg-cyber-blue text-white' : 'text-gray-500 hover:text-white'}`}>{sev}</button>
               ))}
            </div>
         </div>
         <div className="cyber-panel p-0 overflow-hidden border-white/5 bg-cyber-surface/40">
            <div className="overflow-x-auto">
               <table className="w-full text-left pro-table">
                  <thead>
                     <tr>
                        <th>Target Node</th>
                        <th className="text-center">Severity</th>
                        <th className="text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {filteredFindings.slice(0, 5).map((f, i) => (
                       <tr key={i} onClick={() => setSelectedFinding(f)} className="hover:bg-white/[0.03] transition-all cursor-pointer">
                          <td className="px-8 py-8 flex flex-col">
                             <span className="font-black text-white uppercase italic">{f.name}</span>
                             <span className="text-[9px] text-gray-700">PORT {f.port}</span>
                          </td>
                          <td className="px-8 py-8 text-center text-cyber-blue font-black">{f.cvss}</td>
                          <td className="px-8 py-8 text-right">
                             <ChevronRight size={16} className="text-gray-700 inline" />
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
