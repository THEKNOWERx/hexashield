"use client";
 
import React from 'react';
import { AlertCircle, ShieldAlert, Info, Loader2 } from 'lucide-react';

const RiskItem = ({ title, category, cvss, priority, severity }) => {
  const isCritical = severity === 'CRITICAL';
  
  return (
    <div className="group bg-cyber-black/40 border border-white/5 hover:border-cyber-blue/40 rounded-lg p-3 transition-all duration-300">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h5 className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors uppercase tracking-wider">{title}</h5>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[8px] text-gray-500 font-mono tracking-widest">{category}</span>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${
          isCritical ? 'bg-cyber-alert/20 text-cyber-alert border border-cyber-alert/30' : 'bg-cyber-warning/20 text-cyber-warning border border-cyber-warning/30'
        }`}>
          {severity}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 pl-1 border-l-2 border-cyber-blue/10 group-hover:border-cyber-blue/30 transition-colors">
        <div className="flex flex-col">
          <span className="text-[8px] text-gray-600 uppercase font-bold tracking-tighter">Base CVSS</span>
          <span className="text-[10px] font-mono font-bold text-gray-400">{cvss}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] text-cyber-blue font-bold uppercase tracking-tighter">Priority Score</span>
          <span className="text-sm font-black font-mono text-cyber-blue">{priority}</span>
        </div>
      </div>
    </div>
  );
};

const RiskPrioritizationEngine = ({ findings = [] }) => {
  // Sort by Custom Risk Score desc
  const sortedFindings = [...findings].sort((a, b) => (b.custom_risk_score || b.cvss || 0) - (a.custom_risk_score || a.cvss || 0));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyber-alert animate-pulse" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Risk Prioritization Engine</h4>
        </div>
        <div className="w-8 h-8 rounded-lg bg-cyber-alert/10 border border-cyber-alert/20 flex items-center justify-center">
          <ShieldAlert size={16} className="text-cyber-alert" />
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {sortedFindings.length > 0 ? (
          sortedFindings.map((f, i) => (
            <RiskItem 
              key={i}
              title={f.name}
              category={f.owasp_category || 'A03:2021-Injection'}
              cvss={f.cvss || 7.5}
              priority={(f.custom_risk_score || f.cvss || 7.5).toFixed(1)}
              severity={f.severity === 'Critical' ? 'CRITICAL' : (f.severity === 'High' ? 'HIGH' : 'MEDIUM')}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-white/5 rounded-xl gap-2 text-center px-4">
             <ShieldAlert size={20} className="text-gray-800 mb-2" />
             <p className="text-[10px] uppercase font-mono tracking-[0.2em] text-gray-600 font-bold">No High-Priority Threats</p>
             <p className="text-[8px] text-gray-700 font-medium">Your perimeter is currently secure against known CVE patterns.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskPrioritizationEngine;
