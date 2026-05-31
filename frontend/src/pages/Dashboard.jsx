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

const SEVERITY_STYLES = {
  CRITICAL: 'bg-cyber-alert/15 text-cyber-alert border-cyber-alert/30',
  HIGH: 'bg-cyber-warning/15 text-cyber-warning border-cyber-warning/30',
  MEDIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-cyber-blue/15 text-cyber-blue border-cyber-blue/30',
};

const SeverityBadge = ({ severity }) => {
  const key = (severity || 'LOW').toUpperCase();
  const style = SEVERITY_STYLES[key] || SEVERITY_STYLES.LOW;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${style}`}>
      {key.charAt(0) + key.slice(1).toLowerCase()}
    </span>
  );
};

const Dashboard = ({ headerTitle = "Security Overview", headerSubtitle = "Risk posture and active threats." }) => {
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
          <span className="text-sm font-medium text-gray-500">Loading security data…</span>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-28 animate-in fade-in duration-500">
      <GlobalHeader title={headerTitle} subtitle={headerSubtitle} />

      {/* Status strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-neon animate-pulse" />
          <span className="text-xs font-medium text-gray-400">Live · Security Operations Center</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-cyber-dark border border-white/[0.06]">
          <Cpu className="text-cyber-blue" size={18} />
          <div className="leading-tight">
            <p className="text-xs text-gray-500">AI model accuracy</p>
            <p className="text-sm font-semibold text-white">{Number(stats.ai_accuracy ?? 0).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Findings" value={statsCore.total} icon={Layers} colorClass="text-cyber-blue" subtext="Across all engagements" />
        <StatCard title="Critical & High" value={statsCore.critical} icon={ShieldAlert} colorClass="text-cyber-alert" subtext="Require immediate action" />
        <StatCard title="Weaponized" value={statsCore.exploitable} icon={Zap} colorClass="text-cyber-warning" subtext="Public exploit available" />
        <StatCard title="Avg. Risk Score" value={statsCore.risk.toFixed(1)} icon={Brain} colorClass="text-cyber-neon" subtext="AI-weighted CVSS" />
      </div>

      {/* CENTER ANALYTICS */}
      <div className="grid grid-cols-12 gap-5">
        {/* AI Insight */}
        <div className="col-span-12 lg:col-span-4 cyber-panel p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <Cpu className="text-cyber-blue" size={18} />
            <h3 className="text-sm font-semibold text-white">Top Priority Finding</h3>
          </div>

          {mostCritical ? (
            <div className="space-y-4">
              <div className="p-4 bg-cyber-alert/[0.06] border border-cyber-alert/20 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <SeverityBadge severity={mostCritical.severity} />
                  <span className="text-xs font-mono text-gray-500">{mostCritical.cve_id && mostCritical.cve_id !== 'N/A' ? mostCritical.cve_id : '—'}</span>
                </div>
                <h4 className="text-base font-semibold text-white leading-snug mb-1.5">{mostCritical.name}</h4>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">{mostCritical.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                  <span className="text-xs text-gray-500 block mb-1">CVSS Score</span>
                  <span className="text-xl font-bold text-white tabular-nums">{mostCritical.cvss}</span>
                </div>
                <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.05]">
                  <span className="text-xs text-gray-500 block mb-1">Exploit</span>
                  <span className="text-xl font-bold text-cyber-warning">{mostCritical.cve_id && mostCritical.cve_id !== 'N/A' ? 'Likely' : 'Unknown'}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No findings available yet.</p>
          )}
        </div>

        {/* Distribution Chart */}
        <div className="col-span-12 lg:col-span-4 cyber-panel p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <PieChart className="text-cyber-blue" size={18} />
            <h3 className="text-sm font-semibold text-white">Risk Distribution</h3>
          </div>
          <div className="h-[280px]">
            <IntelligenceDoughnut findings={safeFindings} />
          </div>
        </div>

        {/* Trend Chart */}
        <div className="col-span-12 lg:col-span-4 cyber-panel p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <TrendingUp className="text-cyber-neon" size={18} />
            <h3 className="text-sm font-semibold text-white">Severity Trend</h3>
          </div>
          <div className="h-[280px]">
            <VulnTrendChart findings={safeFindings} />
          </div>
        </div>
      </div>

      {/* MATRIX TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-white">Recent Findings</h3>
          <div className="flex gap-1 p-1 bg-cyber-dark border border-white/[0.06] rounded-lg">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${severityFilter === sev ? 'bg-cyber-blue text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {sev.charAt(0) + sev.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="cyber-panel p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left pro-table">
              <thead>
                <tr>
                  <th>Finding</th>
                  <th>Target</th>
                  <th>Severity</th>
                  <th className="text-right">CVSS</th>
                  <th className="text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-10">No findings match this filter.</td></tr>
                ) : filteredFindings.slice(0, 8).map((f, i) => (
                  <tr key={i} onClick={() => setSelectedFinding(f)} className="hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{f.name}</span>
                        <span className="text-xs text-gray-500 font-mono">{f.cve_id && f.cve_id !== 'N/A' ? f.cve_id : `Port ${f.port ?? '—'}`}</span>
                      </div>
                    </td>
                    <td className="font-mono text-gray-400">{f.target || '—'}</td>
                    <td><SeverityBadge severity={f.severity} /></td>
                    <td className="text-right font-semibold text-white tabular-nums">{f.cvss}</td>
                    <td className="text-right"><ChevronRight size={16} className="text-gray-600 inline" /></td>
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
