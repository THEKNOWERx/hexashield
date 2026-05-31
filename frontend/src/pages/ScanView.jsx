/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Search, Shield, Zap, Play, Terminal, Cloud, Activity, Loader2, Cpu, Globe, AlertCircle, ChevronRight, ShieldCheck, Lock, Server, ExternalLink } from 'lucide-react';
import { scanService } from '../services/apiClient';
import { useSecurity } from '../context/SecurityContext';
import { useNotification } from '../components/NotificationSystem';
import CyberCard from '../components/CyberCard';
import GlobalHeader from '../components/GlobalHeader';

const ExpandablePortRow = ({ port: p }) => {
  const [isDeepDive, setIsDeepDive] = useState(false);

  const getAdvisory = (port, service) => {
    const s = service.toLowerCase();
    if (s.includes('http')) return "Ensure TLS 1.3 is enforced and use HSTS headers. Audit for XSS and SQLi on all endpoints.";
    if (s.includes('ssh')) return "Disable root login and migrate to key-based authentication only. Fail2Ban recommended.";
    if (s.includes('smb') || port === 445) return "CRITICAL: Disable SMBv1 immediately. Enforce packet signing and restrict to internal VLANs.";
    if (s.includes('ftp') || port === 21) return "Insecure Protocol: Migrate to SFTP or FTPS. Anonymous login must be disabled.";
    if (s.includes('sql')) return "Restrict access to application tier only. Enforce complex authentication and audit query logs.";
    return "Standard service identified. Follow principle of least privilege and monitor for anomalous traffic patterns.";
  };

  return (
    <React.Fragment>
      <tr 
        onClick={() => setIsDeepDive(!isDeepDive)}
        className={`group cursor-pointer transition-all duration-300 ${isDeepDive ? 'bg-cyber-blue/10' : 'hover:bg-white/[0.02]'}`}
      >
        <td className={`py-4 pl-6 font-mono text-xs ${['http', 'https', 'ftp', 'ssh'].some(s => p.service.toLowerCase().includes(s)) ? 'text-red-500' : 'text-cyber-blue'}`}>
          {p.port}/TCP
        </td>
        <td className={`py-4 font-bold text-sm tracking-tight ${['http', 'https', 'ftp', 'ssh'].some(s => p.service.toLowerCase().includes(s)) ? 'text-red-500' : 'text-white'}`}>
          {p.service.toUpperCase()}
        </td>
        <td className="py-4 text-[11px] text-gray-500 font-mono tracking-tighter">
          {p.version || 'N/A'}
        </td>
        <td className="py-4 pr-6 text-right">
          <div className="flex items-center justify-end gap-3">
            {p.source && p.source.includes('SHODAN') && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[8px] font-black uppercase tracking-widest">
                <Cloud size={10} /> Global Intel
              </div>
            )}
            <span className={`px-2 py-0.5 rounded text-[9px] font-black border transition-all ${
              p.risk === 'Critical' || ['http', 'https', 'ftp', 'ssh'].some(s => p.service.toLowerCase().includes(s)) ? 'border-red-600 text-red-600 bg-red-900/10 shadow-[0_0_15px_rgba(255,0,0,0.3)]' : 
              p.risk === 'High' ? 'border-cyber-alert text-cyber-alert bg-cyber-alert/5' : 
              p.risk === 'Medium' ? 'border-cyber-warning text-cyber-warning bg-cyber-warning/5' : 
              'border-cyber-blue/40 text-cyber-blue/80 bg-cyber-blue/5'
            }`}>
              {['http', 'https', 'ftp', 'ssh'].some(s => p.service.toLowerCase().includes(s)) && p.risk !== 'Critical' ? 'Exploitable' : p.risk}
            </span>
          </div>
        </td>
      </tr>

      <AnimatePresence>
        {isDeepDive && (
          <tr>
            <td colSpan="5" className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-cyber-black/40 border-l-2 border-cyber-blue/30 mx-4 mb-4 rounded-br-2xl"
              >
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Service Identity Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <Cpu size={14} className="text-cyber-blue" />
                       <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Service Intelligence</h5>
                    </div>
                    <div className="bg-cyber-black/60 border border-white/5 rounded-xl p-4 space-y-3">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Raw Banner Metadata</span>
                          <code className="text-[10px] text-cyber-neon font-mono truncate">{p.version || 'Version probe incomplete'}</code>
                       </div>
                       <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-[9px] font-bold text-gray-500">Service Reliability</span>
                          <span className="text-[9px] font-black text-cyber-blue uppercase tracking-widest">Verified (sV)</span>
                       </div>
                    </div>
                  </div>

                  {/* Analyst Perspective Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <ShieldCheck size={14} className="text-cyber-neon" />
                       <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Analyst Briefing</h5>
                    </div>
                    <div className="bg-cyber-blue/5 border border-cyber-blue/20 rounded-xl p-4">
                       <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                          {getAdvisory(p.port, p.service)}
                       </p>
                       <div className="mt-4 flex items-center gap-3">
                          <span className="text-[8px] font-black text-cyber-blue uppercase tracking-widest flex items-center gap-1">
                             <Lock size={10} /> Compliance: Level 3
                          </span>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </React.Fragment>
  );
};

const PortCard = ({ port: p }) => {
  const isHighValue = ['http', 'https', 'ftp', 'ssh'].some(s => p.service.toLowerCase().includes(s)) || [21, 22, 80, 443].includes(parseInt(p.port));
  const isCritical = [21, 22, 80, 443, 3306, 3389].includes(parseInt(p.port)) || isHighValue;
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotateY: 30 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className={`relative p-5 rounded-2xl border transition-all duration-500 overflow-hidden group
        ${isCritical 
          ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_20px_rgba(255,0,0,0.05)]' 
          : 'bg-cyber-blue/5 border-cyber-blue/20 shadow-[0_0_20px_rgba(0,183,255,0.05)]'}`}
    >
      {/* Background Glitch Effect */}
      <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] rounded-full transition-opacity duration-700 opacity-20 group-hover:opacity-40
        ${isCritical ? 'bg-red-600' : 'bg-cyber-blue'}`} />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isCritical ? 'text-red-400' : 'text-gray-500'}`}>
              Port ID
            </span>
            <h3 className={`text-2xl font-mono font-black tracking-tighter ${isCritical ? 'text-white' : 'text-cyber-blue'}`}>
              {p.port}
            </h3>
          </div>
          <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-900/30' : 'bg-cyber-blue/10'}`}>
            <Terminal size={18} className={isCritical ? 'text-red-500' : 'text-cyber-blue'} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Service Protocol</span>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-sm font-bold ${isCritical ? 'text-red-200' : 'text-white'}`}>
                {p.service.toUpperCase()}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-500 font-mono">
                TCP
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Activity size={10} className={isCritical ? 'text-red-500' : 'text-cyber-neon'} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${isCritical ? 'text-red-500' : 'text-cyber-neon'}`}>
                Active / Open
              </span>
            </div>
            <Shield size={12} className="text-gray-700 group-hover:text-cyber-blue transition-colors" />
          </div>
        </div>
      </div>
      
      {/* Decorative Corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10" />
    </motion.div>
  );
};

const ScanView = ({ headerTitle, headerSubtitle }) => {
  const showNotification = useNotification();
  const { 
    scanResults, setScanResults, 
    scanLogs, setScanLogs, 
    scanProgress, setScanProgress, 
    livePorts: ctxLivePorts, setLivePorts: setCtxLivePorts,
    activeTarget, setActiveTarget 
  } = useSecurity();

  const [target, setTarget] = useState(activeTarget || '');
  const [intensity, setIntensity] = useState('deep');
  const [isScanning, setIsScanning] = useState(false);

  // No persistence for inputs as per user request
  useEffect(() => {
    // Keeping this empty or removing the sessionStorage sync entirely
  }, [target, intensity]);

  const addLog = (line, color = 'text-gray-400') => {
    setScanLogs(prev => [...prev, { line, color }]);
  };

  const startScan = async () => {
    if (!target) {
      showNotification("Please enter a target address", "warning");
      return;
    }
    setIsScanning(true);
    setScanProgress(0);
    setCtxLivePorts([]);
    setScanResults(null);
    setScanLogs([]);

    addLog(`[INIT] Starting scan engine…`, 'text-cyber-blue');
    addLog(`[INFO] TARGET: ${target}`, 'text-gray-400');

    try {
      // 1. Kickoff the scan
      const startRes = await scanService.startScan(target, intensity);
      const scanId = startRes?.data?.id;
      
      if (!scanId) throw new Error("Failed to start scan.");

      addLog(`[INFO] Scan #${scanId} started — monitoring progress…`, 'text-cyber-blue');

      // 2. Begin Reactive Polling (Turbo Interval) - Defensive Implementation
      let completed = false;
      let lastPhase = '';
      let pollCount = 0;
      let knownPorts = new Set();

      while (!completed && pollCount < 1200) { // Max 6 mins polling with 300ms interval
        pollCount++;
        await new Promise(r => setTimeout(r, 300));
        
        try {
          const statusRes = await scanService.getStatus(scanId);
          if (!statusRes || !statusRes.data) continue;
          
          const scanData = statusRes.data;
          
          // Safety check for results_json
          let results = {};
          try {
            const rawJson = scanData.results_json;
            results = rawJson ? (typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson) : {};
          } catch (e) { 
            console.error("Engine Telemetry Parse Error", e);
            // Don't crash the loop, just use empty results for this tick
          }

          if (typeof results !== 'object' || results === null) results = {};

          // Update Progress based on Phase - Smooth scaling
          const phase = results.phase || (scanData.status === 'completed' ? 'Complete' : 'Initializing');
          if (phase !== lastPhase) {
            lastPhase = phase;
            const color = phase.includes('Complete') ? 'text-cyber-neon' : (phase.includes('Failed') ? 'text-cyber-alert' : 'text-yellow-400');
            addLog(`[PHASE] ${phase}`, color);
          }

          // Dynamic Progress Smoothing
          let targetProgress = 10;
          const lowerPhase = phase.toLowerCase();
          if (lowerPhase.includes('complete')) targetProgress = 100;
          else if (lowerPhase.includes('vulnerability')) targetProgress = 80;
          else if (lowerPhase.includes('port discovery')) targetProgress = 50;
          else if (lowerPhase.includes('initializing')) targetProgress = 20;
          
          setScanProgress(prev => {
             if (prev < targetProgress) return Math.min(targetProgress, prev + 5); 
             return prev;
          });

          // Stream live ports immediately - Optimized logic
          if (results.ports && Array.isArray(results.ports)) {
            const newPorts = results.ports.filter(p => !knownPorts.has(`${p.port}-${p.service}`));
            if (newPorts.length > 0) {
              newPorts.forEach(p => {
                knownPorts.add(`${p.port}-${p.service}`);
                addLog(`[OPEN] ${p.port}/tcp — ${p.service || 'unknown'}`, 'text-cyber-neon');
              });
              setCtxLivePorts(results.ports);
            }
          }

          if (scanData.status === 'completed') {
            completed = true;
            setScanProgress(100);
            setScanResults(scanData);
            setCtxLivePorts(results.ports || []);
            
            addLog(`[DONE] Scan complete.`, 'text-cyber-neon');
            const ports_list = (results.ports || []).map(p => `${p.port}/tcp`).join(', ');
            addLog(`[INFO] Open ports: ${ports_list || 'none'}`, 'text-white font-semibold');
            
            const vuln_count = scanData.findings_count || (results.findings?.length) || 0;
            addLog(`[VULN] ${vuln_count} finding(s) recorded.`, 'text-cyber-blue');
            
            showNotification(`Scan complete — ${(results.ports || []).length} open port(s).`, "success");
          } else if (scanData.status === 'failed') {
            throw new Error(scanData.error || "Engine Aborted. Discovery logic failure.");
          }
        } catch (pollErr) {
          console.error("Polling Tick Error:", pollErr);
          // If it's a 404, the scan might have been purged
          if (pollErr.response?.status === 404) break;
        }
      }

    } catch (err) {
      setScanProgress(0);
      addLog(`[ERROR] Scan failed: ${err.message}`, 'text-cyber-alert');
      showNotification("Scan failed: " + err.message, "error");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8">
      <GlobalHeader title={headerTitle} subtitle={headerSubtitle} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Column */}
        <div className="lg:col-span-4 space-y-6">
          <CyberCard title="Scan Configuration" icon={Cpu}>
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Target</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-blue group-focus-within:text-cyber-neon transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Host, IP, or subnet…"
                    className="w-full bg-cyber-black/50 border border-cyber-border rounded-xl py-3 pl-12 pr-4 focus:border-cyber-blue outline-none transition-all font-mono text-sm placeholder:text-gray-600"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isScanning && startScan()}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Scan profile</label>
                <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: 'fast', name: 'Quick Scan', desc: 'Curated top ports with service banners', icon: Shield, color: 'text-cyber-blue' },
                      { id: 'deep', name: 'Full Audit', desc: 'Full well-known range and version detection', icon: Zap, color: 'text-cyber-neon' },
                      { id: 'ultra', name: 'Port Discovery', desc: 'Fast surface discovery of open ports', icon: Terminal, color: 'text-cyber-neon' },
                    ].map(profile => (
                      <button 
                        key={profile.id}
                        onClick={() => setIntensity(profile.id)}
                        className={`p-4 text-left border rounded-2xl transition-all duration-300 flex items-center gap-5 group
                          ${intensity === profile.id ? 'bg-cyber-blue/10 border-cyber-blue/50 shadow-[0_0_20px_rgba(0,71,255,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                      >
                        <div className={`p-2 rounded-xl bg-black/40 border border-white/5 transition-colors ${intensity === profile.id ? 'text-cyber-blue' : 'text-gray-600 group-hover:text-gray-400'}`}>
                          <profile.icon size={22} />
                        </div>
                        <div className="flex-1">
                          <div className={`text-[13px] font-bold tracking-tight mb-0.5 ${intensity === profile.id ? 'text-white' : 'text-gray-500'}`}>{profile.name}</div>
                          <div className="text-[10px] text-gray-600 font-medium tracking-tight">{profile.desc}</div>
                        </div>
                        <div className={`w-1.5 h-1.5 rounded-full transition-all ${intensity === profile.id ? 'bg-cyber-blue shadow-[0_0_10px_#0047ff]' : 'bg-transparent'}`} />
                      </button>
                    ))}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={isScanning}
                  onClick={startScan}
                  className="w-full bg-cyber-blue hover:bg-blue-600 disabled:opacity-50 text-white py-4 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(0,71,255,0.3)] active:scale-[0.98] flex items-center justify-center gap-4 group"
                >
                  {isScanning ? <Loader2 className="animate-spin text-white" size={22} /> : <Search className="text-white group-hover:scale-110 transition-transform" size={22} />}
                  <span className="font-semibold text-sm">{isScanning ? 'Scanning…' : 'Start scan'}</span>
                </button>
              </div>
            </div>
          </CyberCard>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <CyberCard title="Activity" icon={Activity}>
            <div className="space-y-6 min-h-[350px] flex flex-col">
              {/* Progress Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                  <span className="text-sm font-medium text-gray-400">{(isScanning || scanProgress === 100) ? (scanProgress === 100 ? 'Scan complete' : 'Scanning…') : 'Ready'}</span>
                  <span className="text-2xl font-mono font-bold text-cyber-neon tracking-tight">{scanProgress}%</span>
                </div>
                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/5 p-[1px]">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ type: "spring", stiffness: 40, damping: 20 }}
                    className="h-full bg-cyber-neon shadow-[0_0_15px_rgba(57,255,20,0.6)] rounded-full" 
                   />
                </div>
              </div>

              {/* Console Output (Image-Matched Styling) */}
              <div className="flex-1 bg-black/60 rounded-2xl p-6 font-mono text-[11px] leading-relaxed text-gray-400 overflow-y-auto h-48 border border-white/5 relative">
                 <div className="absolute top-4 right-6 text-xs font-medium text-cyber-blue/50 select-none">Log</div>
                 <div className="space-y-1.5">
                    {scanLogs.length === 0 && (
                      <p className="text-cyber-blue opacity-50 italic">Waiting to start…</p>
                    )}
                    {scanLogs.map((log, i) => {
                      const isDone = log.line.startsWith('[DONE]');
                      const isOpen = log.line.startsWith('[OPEN]');
                      const isVuln = log.line.startsWith('[VULN]');
                      
                      let colorClass = log.color;
                      if (isDone || isOpen) colorClass = 'text-cyber-neon font-bold';
                      if (isVuln) colorClass = 'text-cyber-blue font-bold';

                      return (
                        <p key={i} className={`${colorClass} flex items-start gap-2`}>
                          <span className="opacity-40 select-none">{">"}</span>
                          <span>{log.line}</span>
                        </p>
                      );
                    })}
                    {isScanning && <div className="animate-pulse text-cyber-blue mt-2 font-black inline-block">_</div>}
                 </div>
                  
                  {/* Scan Summary */}
                  {scanResults && (() => {
                    let rj = {};
                    try {
                      const raw = scanResults.results_json;
                      rj = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};
                    } catch { rj = {}; }
                    const openCount = (rj.ports || ctxLivePorts || []).length;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 rounded-xl bg-cyber-blue/5 border border-cyber-blue/20 flex flex-wrap gap-6"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium text-gray-500">Resolved IP</span>
                          <span className="text-sm font-mono text-cyber-blue">{rj.resolved_ip || activeTarget || '—'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium text-gray-500">Open ports</span>
                          <span className="text-sm font-mono text-cyber-neon">{openCount}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium text-gray-500">Findings</span>
                          <span className="text-sm font-mono text-white">{scanResults.findings_count ?? (rj.findings?.length ?? 0)}</span>
                        </div>
                        <div className="flex flex-col ml-auto">
                          <span className="text-[10px] font-medium text-gray-500">Status</span>
                          <span className="text-xs font-semibold text-cyber-neon flex items-center gap-1">
                            <ShieldCheck size={12} /> Complete
                          </span>
                        </div>
                      </motion.div>
                    );
                  })()}
               </div>

              {/* Ports Table (Elite Branding) */}
              <div className="mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                         <tr className="text-xs text-gray-500 font-semibold border-b border-white/5">
                           <th className="pb-4 pl-6">Port / Proto</th>
                           <th className="pb-4">Service</th>
                           <th className="pb-4">Version</th>
                           <th className="pb-4 pr-6 text-right">Risk</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                           {(ctxLivePorts || []).length > 0 ? (
                            ctxLivePorts.map((p, i) => {
                              const svc = (p.service || '').toLowerCase();
                              const isHighValue = ['http', 'https', 'ftp', 'ssh', 'telnet', 'smb'].some(s => svc.includes(s)) || [21, 22, 23, 80, 443, 445, 3306, 3389].includes(parseInt(p.port));
                              const riskLabel = isHighValue ? 'Review' : 'Open';
                              return (
                                <tr key={`${p.port}-${i}`} className="group hover:bg-white/[0.02] transition-colors">
                                  <td className={`py-5 pl-6 font-mono text-xs font-semibold ${isHighValue ? 'text-cyber-warning' : 'text-cyber-blue'}`}>
                                    {p.port}/tcp
                                  </td>
                                  <td className={`py-5 font-medium text-sm ${isHighValue ? 'text-cyber-warning' : 'text-white'}`}>
                                    {p.service || 'unknown'}
                                  </td>
                                  <td className="py-5 text-[11px] text-gray-500 font-mono">
                                    {[p.product, p.version].filter(Boolean).join(' ') || '—'}
                                  </td>
                                  <td className="py-5 pr-6 text-right">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                                      isHighValue ? 'border-cyber-warning/40 text-cyber-warning bg-cyber-warning/5' : 
                                      'border-cyber-neon/30 text-cyber-neon/80 bg-cyber-neon/5'
                                    }`}>
                                      {riskLabel}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="4" className="py-12 text-center">
                                 <p className="text-sm text-gray-500">No ports yet — start a scan to see results.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                    </table>
                </div>
              </div>
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );
};

export default ScanView;

