/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reconService } from '../services/apiClient';
import { useSecurity } from '../context/SecurityContext';
import { Search, Globe, Fingerprint, Play, Loader2, Target, Wifi, Database, Shield, Zap, Activity, ShieldCheck, Server, AlertCircle, Info, Cpu, Users, Building2, FileText, KeyRound, LogIn, Mail, ExternalLink, Eye } from 'lucide-react';
import CyberCard from '../components/CyberCard';
import GlobalHeader from '../components/GlobalHeader';
import { Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

const ReconView = ({ headerTitle, headerSubtitle }) => {
  const { reconResults, setReconResults, activeTarget, setActiveTarget } = useSecurity();
  const [target, setTarget] = useState(activeTarget || '');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  // Open-source intelligence panel state
  const [osintCategory, setOsintCategory] = useState('all');
  const [osintLoading, setOsintLoading] = useState(false);
  const [osintData, setOsintData] = useState(null);
  const [osintError, setOsintError] = useState(null);

  const OSINT_CATEGORIES = [
    { id: 'all', label: 'Overview', icon: Eye },
    { id: 'people', label: 'People & Profiles', icon: Users },
    { id: 'company', label: 'Company Intelligence', icon: Building2 },
    { id: 'documents', label: 'Exposed Documents', icon: FileText },
    { id: 'credentials', label: 'Credentials & Leaks', icon: KeyRound },
    { id: 'surfaces', label: 'Login Surfaces', icon: LogIn },
    { id: 'email', label: 'Email Footprint', icon: Mail },
  ];

  const gatherOsint = async (category = osintCategory) => {
    if (!target.trim()) {
      setOsintError('Enter a target above first.');
      return;
    }
    setOsintCategory(category);
    setOsintLoading(true);
    setOsintError(null);
    setOsintData(null);
    try {
      const res = await reconService.osint(target.trim(), category);
      setOsintData(res.data);
      setActiveTarget(target.trim());
    } catch (err) {
      setOsintError(err.response?.data?.detail || err.message || 'Intelligence gathering failed.');
    } finally {
      setOsintLoading(false);
    }
  };


  // No persistence for inputs as per user request
  useEffect(() => {
    // sessionStorage.setItem('reconState', JSON.stringify({ target }));
  }, [target]);

  const handleDiscovery = async () => {
    if (!target.trim()) return;
    setIsScanning(true);
    setError(null);
    setReconResults(null);
    try {
      const res = await reconService.fullRecon(target);
      setReconResults(res.data);
      setActiveTarget(target);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Recon failed. Check the target and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const geo = reconResults?.ip_intelligence || {};
  const dnsRecords = reconResults?.dns_records || [];
  const headers = reconResults?.headers?.headers || {};
  const version = reconResults?.headers?.version || "Unknown";
  const sslInfo = reconResults?.ssl_info || {};
  const subdomains = reconResults?.subdomains || [];
  const whoisInfo = reconResults?.whois_info || {};

  // Prepare DNS Intelligence Chart Data
  const dnsLabels = {
    'A': 'Address',
    'MX': 'Mail',
    'NS': 'Name Server',
    'TXT': 'Text',
    'AAAA': 'IPv6',
    'CNAME': 'Alias',
    'SOA': 'Authority'
  };

  const dnsCounts = dnsRecords.reduce((acc, record) => {
    acc[record.type] = (acc[record.type] || 0) + 1;
    return acc;
  }, {});
  
  const radarData = {
    labels: Object.keys(dnsCounts).map(k => dnsLabels[k] || k),
    datasets: [
      {
        label: 'Record Density',
        data: Object.values(dnsCounts),
        backgroundColor: 'rgba(0, 113, 255, 0.2)',
        borderColor: '#0071ff',
        borderWidth: 2,
        pointBackgroundColor: '#0071ff',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#0071ff',
        fill: true,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#050505',
        titleFont: { family: 'JetBrains Mono', size: 10 },
        bodyFont: { family: 'JetBrains Mono', size: 9 },
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      }
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(255,255,255,0.05)' },
        grid: { color: 'rgba(255,255,255,0.05)' },
        pointLabels: { color: '#666', font: { family: 'JetBrains Mono', size: 8 } },
        ticks: { display: false, count: 5 }
      }
    }
  };

  return (
    <div className="space-y-8">
      <GlobalHeader title={headerTitle} subtitle={headerSubtitle} />

      {/* Target Input */}
      <CyberCard className="border-cyber-blue/20">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-blue animate-pulse" size={20} />
            <input
              type="text"
              placeholder="Enter domain, URL, or IP…"
              className="w-full bg-cyber-black/50 border border-cyber-border rounded-xl py-4 pl-12 pr-4 focus:border-cyber-blue outline-none transition-all font-mono text-sm placeholder:text-gray-600"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDiscovery()}
            />
          </div>
          <button
            onClick={handleDiscovery}
            disabled={isScanning}
            className="cyber-button px-10 py-4 h-full w-full md:w-auto"
          >
            {isScanning ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
            <span className="font-semibold">{isScanning ? 'Analyzing…' : 'Start'}</span>
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono">
            [ERROR] {error}
          </div>
        )}
      </CyberCard>

      {/* Open-Source Intelligence */}
      <CyberCard title="Open-Source Intelligence" icon={Eye}>
        <div className="space-y-5">
          <p className="text-xs text-gray-500">
            Surface publicly available information about a company, person, or domain. Choose what to look for and run the gather.
          </p>

          <div className="flex flex-wrap gap-2">
            {OSINT_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = osintCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setOsintCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all
                    ${active
                      ? 'bg-cyber-blue/10 border-cyber-blue/50 text-white'
                      : 'bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/10'}`}
                >
                  <Icon size={14} className={active ? 'text-cyber-blue' : 'text-gray-500'} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => gatherOsint()}
              disabled={osintLoading}
              className="cyber-button px-8 py-3 disabled:opacity-50 flex items-center gap-2"
            >
              {osintLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              <span className="font-semibold">{osintLoading ? 'Gathering…' : 'Gather intelligence'}</span>
            </button>
            {osintData && (
              <span className="text-xs text-gray-500 font-mono">
                {osintData.summary?.results || 0} records · {osintData.summary?.sources || 0} sources
              </span>
            )}
          </div>

          {osintError && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono">
              [ERROR] {osintError}
            </div>
          )}

          {osintData && (
            osintData.groups.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                No public records surfaced for this selection.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {osintData.groups.map((group, gi) => (
                  <motion.div
                    key={gi}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: gi * 0.05 }}
                    className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white">{group.title}</h4>
                      <span className="text-[10px] font-mono text-gray-500">{group.items.length}</span>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {group.items.map((item, ii) => (
                        item.url ? (
                          <a
                            key={ii}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                          >
                            <ExternalLink size={12} className="mt-0.5 text-gray-600 group-hover:text-cyber-blue flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-300 group-hover:text-white truncate">{item.title}</p>
                              {item.source && <p className="text-[10px] text-cyber-blue/60 font-mono truncate">{item.source}</p>}
                            </div>
                          </a>
                        ) : (
                          <div key={ii} className="flex items-center gap-2 p-2 rounded-lg">
                            <Mail size={12} className="text-gray-600 flex-shrink-0" />
                            <p className="text-xs text-gray-300 font-mono truncate">{item.title}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>
      </CyberCard>

      {!reconResults && !isScanning && (
        <div className="text-center py-20">
          <Globe className="mx-auto text-gray-700 mb-4" size={60} />
          <p className="text-gray-500 font-medium">Enter a target above to start reconnaissance.</p>
        </div>
      )}

      {reconResults && (
        <div className="space-y-8">
          {/* DIGITAL PERIMETER SUMMARY HUD */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: 'Firewall', value: reconResults.headers?.waf_status || 'None', icon: Shield, color: 'text-cyber-neon' },
               { label: 'DNS Records', value: `${dnsRecords.length} records`, icon: Database, color: 'text-cyber-blue' },
               { label: 'Subdomains', value: `${subdomains.length} found`, icon: Target, color: 'text-white' },
               { label: 'SSL', value: sslInfo.expired ? 'Expired' : 'Valid', icon: ShieldCheck, color: sslInfo.expired ? 'text-red-500' : 'text-cyber-neon' },
             ].map((stat, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-2"
               >
                 <div className="flex items-center gap-2 opacity-50">
                    <stat.icon size={12} />
                    <span className="text-xs font-medium">{stat.label}</span>
                 </div>
                 <div className={`text-sm font-semibold font-mono ${stat.color}`}>
                    {stat.value}
                 </div>
               </motion.div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* IP Intelligence & Network Range */}
          <div className="lg:col-span-4 space-y-8">
            <CyberCard title="Target Intelligence" icon={Globe}>
              <div className="space-y-3">
                {[
                  { label: 'Target Domain', value: geo.target, icon: Globe },
                  { label: 'Asset Hostname', value: geo.hostname, icon: Globe, highlight: true },
                  { label: 'Resolved IP', value: geo.ip, icon: Wifi },
                  { label: 'Operating System', value: geo.os_guess, icon: Cpu },
                  { label: 'Organization', value: geo.org, icon: Building2 },
                  { label: 'ISP Provider (ICM)', value: geo.isp, icon: Server },
                  { label: 'Network ASN', value: geo.asn, icon: Database },
                  { label: 'Country', value: geo.country, icon: Globe },
                  { label: 'City', value: geo.city, icon: Target },
                ].map(({ label, value, icon: Icon, highlight }) => value && value !== "N/A" && (
                  <div key={label} className={`flex justify-between items-center py-2 border-b border-white/5 last:border-0 ${highlight ? 'bg-cyber-blue/5 -mx-2 px-2 rounded-lg' : ''}`}>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 flex-shrink-0">
                      <Icon size={10} className={highlight ? 'text-cyber-neon' : ''} /> {label}
                    </span>
                    <span className={`font-mono text-xs truncate max-w-[180px] ${highlight ? 'text-white font-black' : 'text-cyber-blue'}`} title={value}>{value}</span>
                  </div>
                ))}
              </div>
            </CyberCard>

            {/* Domain Infrastructure Mapping */}
            <CyberCard title="Domain Infrastructure" icon={Globe}>
              <div className="space-y-4">
                <div className="flex flex-col p-3 bg-white/5 border border-white/5 rounded-xl">
                   <span className="text-[8px] font-black text-cyber-blue uppercase tracking-widest mb-1">Root Domain Analysis</span>
                   <span className="text-sm font-black text-white font-mono break-all">{geo.target}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <span className="text-[8px] font-bold text-gray-600 uppercase block mb-1">Domain Status</span>
                      <span className="text-[10px] text-cyber-neon font-black uppercase tracking-tighter">Active // Verified</span>
                   </div>
                   <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <span className="text-[8px] font-bold text-gray-600 uppercase block mb-1">Primary Host</span>
                      <span className="text-[10px] text-white font-black truncate">{geo.hostname?.split('.')[0] || 'Unknown'}</span>
                   </div>
                </div>
                {Array.isArray(whoisInfo.name_servers) && whoisInfo.name_servers.length > 0 && (
                   <div className="p-3 border border-cyber-blue/10 rounded-xl">
                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-2">Authoritative Nameservers</span>
                      <div className="space-y-1">
                         {whoisInfo.name_servers.slice(0, 3).map((ns, idx) => (
                           <div key={idx} className="text-[9px] font-mono text-cyber-blue flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-cyber-blue" />
                              {(ns || '').toString().toLowerCase()}
                           </div>
                         ))}
                      </div>
                   </div>
                )}
              </div>
            </CyberCard>

            {/* WHOIS Registry Info */}
            <CyberCard title="Registry Intelligence" icon={Fingerprint}>
              {whoisInfo && typeof whoisInfo === 'object' && !whoisInfo.error ? (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                     <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Organization</span>
                     <span className="text-xs font-black text-white">{whoisInfo.organization}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Registrar', value: whoisInfo.registrar },
                      { label: 'Status', value: whoisInfo.status },
                      { label: 'Created', value: (whoisInfo.creation_date || '').toString().split('T')[0] },
                      { label: 'Expires', value: (whoisInfo.expiration_date || '').toString().split('T')[0] },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-1">
                        <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{label}</span>
                        <span className={`font-mono text-[10px] truncate ${label === 'Status' ? 'text-cyber-neon' : 'text-gray-300'}`}>{value || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                  {Array.isArray(whoisInfo.name_servers) && whoisInfo.name_servers.length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                       <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-2 block">Name Servers</span>
                       <div className="flex flex-wrap gap-2">
                          {whoisInfo.name_servers.slice(0, 3).map((ns, i) => (
                            <span key={i} className="px-2 py-1 bg-cyber-blue/10 border border-cyber-blue/20 rounded text-[9px] font-mono text-cyber-blue">{(ns || '').toString().toLowerCase()}</span>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-xs py-4 text-center">{whoisInfo?.error || "WHOIS protection enabled."}</p>
              )}
            </CyberCard>
          </div>

          {/* SSL & Headers */}
          <div className="lg:col-span-4 space-y-8">
            <CyberCard title="Service Information" icon={Fingerprint}>
              <div className="space-y-3">
                {[
                  { label: 'Service Version', value: version, color: 'text-cyber-neon' },
                  { label: 'Primary Platform', value: reconResults.headers?.platform, color: 'text-white' },
                  { label: 'Security Grade', value: reconResults.headers?.security_grade, color: 'text-cyber-blue' },
                  { label: 'Target URL', value: reconResults.headers?.url, color: 'text-gray-400' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                     <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</span>
                     <span className={`font-mono text-[10px] truncate max-w-[150px] ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </CyberCard>

            <CyberCard title="SSL/TLS Certificate" icon={Fingerprint}>
              {sslInfo && !sslInfo.error ? (
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Issuer</span>
                    <span className="text-[11px] text-gray-300 font-mono break-all">{sslInfo.issuer?.O || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Expiry</span>
                    <span className={`text-[11px] font-mono ${sslInfo.expired ? 'text-red-500' : 'text-cyber-neon'}`}>{sslInfo.notAfter?.split('T')[0]}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-xs py-4 text-center">{sslInfo.error || "SSL data unavailable"}</p>
              )}
            </CyberCard>

            <CyberCard title="HTTP Headers" icon={Fingerprint}>
              <div className="space-y-4">
                {Object.entries(headers).map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">{key}</span>
                    <span className="text-[11px] text-gray-300 font-mono break-all">{value}</span>
                  </div>
                ))}
                {Object.keys(headers).length === 0 && <p className="text-gray-600 text-xs">No headers detected.</p>}
              </div>
            </CyberCard>

            {/* Surface Subdomains - Professional Grid Layout */}
            <CyberCard title="Surface Subdomains" icon={Globe}>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 cyber-scrollbar">
                {subdomains.map((sub, i) => (
                  <div key={i} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between group hover:border-cyber-blue/30 transition-all">
                     <span className="text-[10px] font-mono text-gray-400 group-hover:text-white transition-colors truncate">{sub}</span>
                     <div className="w-1 h-1 rounded-full bg-cyber-neon/40 group-hover:bg-cyber-neon animate-pulse" />
                  </div>
                ))}
                {subdomains.length === 0 && <p className="text-gray-600 text-xs py-10 text-center uppercase tracking-widest font-black opacity-50">No subdomains mapped</p>}
              </div>
            </CyberCard>
          </div>

          {/* DNS and Subdomains */}
          <div className="lg:col-span-4 space-y-8">
            {dnsRecords.length > 0 && (
              <CyberCard title="DNS Intelligence Vector" icon={Database}>
                <div className="mt-4 h-64 relative">
                   <Radar data={radarData} options={radarOptions} />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                   {Object.entries(dnsLabels).map(([code, desc]) => (
                     <div key={code} className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg border border-white/5">
                        <span className="w-8 text-[10px] font-black text-cyber-blue font-mono">{code}</span>
                        <span className="text-[9px] text-gray-600 uppercase font-bold">{desc}</span>
                     </div>
                   ))}
                </div>
              </CyberCard>
            )}
            
            <CyberCard title="DNS Manifest" icon={Database}>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto cyber-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[9px] uppercase tracking-widest text-gray-500">
                      <th className="py-3 px-4">Record</th>
                      <th className="py-3 px-4">Technical Value</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px] font-mono text-gray-300">
                    {dnsRecords.map((record, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] group transition-colors">
                        <td className="py-3 px-4">
                           <div className="flex flex-col">
                              <span className="text-white font-black group-hover:text-cyber-blue transition-colors">{record.type}</span>
                              <span className="text-[8px] text-gray-600 uppercase">{record.description}</span>
                           </div>
                        </td>
                        <td className="py-3 px-4 break-all opacity-80 group-hover:opacity-100">{record.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CyberCard>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default ReconView;

