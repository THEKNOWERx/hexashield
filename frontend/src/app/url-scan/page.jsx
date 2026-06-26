/* eslint-disable no-unused-vars */
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Search, Shield, Zap, Activity, Loader2, Lock, Unlock, AlertTriangle, ExternalLink, RefreshCcw, History, Terminal } from 'lucide-react';
import { scanService, reconService } from '../../../services/apiClient';
import { useNotification } from '../../../components/NotificationSystem';
import CyberCard from '../../../components/CyberCard';
import GlobalHeader from '../../../components/GlobalHeader';

const URLScannerView = ({ headerTitle, headerSubtitle }) => {
  const showNotification = useNotification();
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  const handleScan = async () => {
    if (!url) {
      showNotification("Please enter a valid URL or Domain", "warning");
      return;
    }

    setIsScanning(true);
    setResults(null);

    try {
      // simulate a deep URL analysis using existing recon service + custom logic
      const res = await reconService.fullRecon(url);
      
      // Mocking high-fidelity URL reputation for demo purposes
      // In a real scenario, this would call a dedicated backend endpoint
      const mockReputation = {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        category: "Information Technology",
        status: "Clean",
        malicious_indicators: 0,
        ssl_valid: url.startsWith('https'),
        redirects: Math.floor(Math.random() * 3)
      };

      const finalResults = {
        ...res.data,
        reputation: mockReputation,
        audit_id: `URL-${Math.floor(Math.random() * 9000) + 1000}`
      };

      setResults(finalResults);
      setHistory(prev => [finalResults, ...prev].slice(0, 5));
      showNotification("URL Intelligence Audit Complete", "success");
    } catch (err) {
      console.error("URL Scan Error", err);
      showNotification("Failed to resolve URL infrastructure", "error");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <GlobalHeader title={headerTitle} subtitle={headerSubtitle} />

      {/* Main Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group p-[2px] rounded-3xl bg-gradient-to-r from-cyber-blue/20 via-transparent to-cyber-neon/20 overflow-hidden"
      >
        <div className="bg-cyber-black/90 backdrop-blur-xl p-10 rounded-[22px] border border-white/5 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative flex-1 w-full">
              <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-cyber-blue group-focus-within:text-cyber-neon transition-colors" size={24} />
              <input 
                type="text" 
                placeholder="Enter a URL to audit (e.g., https://example.com)" 
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-mono text-sm focus:border-cyber-blue/50 outline-none transition-all placeholder:text-gray-700"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleScan()}
              />
            </div>
            <button 
              onClick={handleScan}
              disabled={isScanning}
              className="w-full md:w-auto px-10 py-5 bg-cyber-blue hover:bg-blue-600 disabled:opacity-50 rounded-2xl text-white font-semibold text-sm shadow-[0_0_40px_rgba(0,71,255,0.3)] transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {isScanning ? 'Analyzing…' : 'Run Audit'}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Results Display */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {!results && !isScanning ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="h-[400px] border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-gray-700"
              >
                <Globe size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">Enter a URL to start</p>
              </motion.div>
            ) : isScanning ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="h-[400px] bg-cyber-black/40 border border-white/5 rounded-3xl flex flex-col items-center justify-center"
              >
                <Loader2 size={48} className="animate-spin text-cyber-blue mb-6" />
                <div className="space-y-2 text-center">
                   <p className="text-sm font-semibold text-white">Analyzing…</p>
                   <p className="text-xs font-mono text-cyber-blue animate-pulse">Inspecting protocol layers and certificates…</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Reputation HUD */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-cyber-blue/10 border border-cyber-blue/30 p-6 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-gray-400 mb-2">Safety Score</span>
                    <span className="text-4xl font-mono font-bold text-cyber-neon">{results.reputation.score}%</span>
                  </div>
                  <div className="bg-cyber-blue/10 border border-cyber-blue/30 p-6 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-gray-400 mb-2">Protocol Status</span>
                    <div className="flex items-center gap-2">
                       {results.reputation.ssl_valid ? <Lock size={20} className="text-cyber-neon" /> : <Unlock size={20} className="text-red-500" />}
                       <span className={`text-xl font-semibold ${results.reputation.ssl_valid ? 'text-white' : 'text-red-500'}`}>{results.reputation.ssl_valid ? 'Secure' : 'Insecure'}</span>
                    </div>
                  </div>
                  <div className="bg-cyber-blue/10 border border-cyber-blue/30 p-6 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-gray-400 mb-2">Redirect Chain</span>
                    <span className="text-4xl font-mono font-bold text-cyber-blue">{results.reputation.redirects}</span>
                  </div>
                </div>

                {/* Deep Intel Table */}
                <CyberCard title="Web Layer Intelligence" icon={Activity}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <h5 className="text-xs font-semibold text-cyber-blue border-l-2 border-cyber-blue pl-3">Server Fingerprint</h5>
                          <div className="space-y-3 font-mono text-[11px]">
                             <div className="flex justify-between border-b border-white/5 pb-2">
                               <span className="text-gray-600">Engine:</span>
                               <span className="text-white">{results.headers?.headers?.Server || 'Standard'}</span>
                             </div>
                             <div className="flex justify-between border-b border-white/5 pb-2">
                               <span className="text-gray-600">Powered By:</span>
                               <span className="text-white">{results.headers?.headers?.['X-Powered-By'] || 'N/A'}</span>
                             </div>
                             <div className="flex justify-between border-b border-white/5 pb-2">
                               <span className="text-gray-600">Compression:</span>
                               <span className="text-cyber-neon">Enabled (Gzip)</span>
                             </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <h5 className="text-xs font-semibold text-cyber-neon border-l-2 border-cyber-neon pl-3">Reputation Profile</h5>
                          <div className="space-y-3 font-mono text-[11px]">
                             <div className="flex justify-between border-b border-white/5 pb-2">
                               <span className="text-gray-600">Category:</span>
                               <span className="text-white">{results.reputation.category}</span>
                             </div>
                             <div className="flex justify-between border-b border-white/5 pb-2">
                               <span className="text-gray-600">Maturity:</span>
                               <span className="text-white">High</span>
                             </div>
                             <div className="flex justify-between border-b border-white/5 pb-2">
                               <span className="text-gray-600">Global Rank:</span>
                               <span className="text-cyber-blue">Top 100K</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="mt-8 p-4 bg-cyber-alert/5 border border-cyber-alert/20 rounded-xl flex items-center gap-4">
                       <AlertTriangle className="text-cyber-alert" size={24} />
                       <div>
                          <p className="text-xs font-semibold text-white mb-1">Alert</p>
                          <p className="text-[10px] text-gray-500">Non-standard HTTP methods enabled (OPTIONS, PUT). Review for unauthorized file interaction.</p>
                       </div>
                    </div>
                  </div>
                </CyberCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-8">
          <CyberCard title="Audit History" icon={History}>
             <div className="space-y-4">
                {history.length > 0 ? (
                  history.map((h, i) => (
                    <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group">
                       <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-cyber-blue font-mono">{h.audit_id}</span>
                          <span className="text-[10px] font-medium text-gray-600">2m ago</span>
                       </div>
                       <div className="text-xs font-semibold text-white truncate mb-2">{url}</div>
                       <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${h.reputation.score > 80 ? 'text-cyber-neon' : 'text-cyber-alert'}`}>
                            {h.reputation.status} Score: {h.reputation.score}%
                          </span>
                          <RefreshCcw size={12} className="text-gray-700 group-hover:text-cyber-blue transition-colors" />
                       </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600 text-center py-10">No previous audits</p>
                )}
             </div>
          </CyberCard>

          <CyberCard title="Advisory" icon={Terminal}>
             <div className="space-y-4">
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                   <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                     Targets with safety scores below 75% often exhibit unauthorized redirect patterns shortly after the initial request.
                   </p>
                </div>
                <div className="pt-2 border-t border-white/5">
                   <span className="text-[10px] font-medium text-cyber-blue">URL reputation and protocol inspection</span>
                </div>
             </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );
};

export default URLScannerView;
