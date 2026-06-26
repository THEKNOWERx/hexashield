/* eslint-disable no-unused-vars */
"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Loader2, CheckCircle, DownloadCloud, Trash2, Shield } from 'lucide-react';
import { vulnService, reportsService } from '../../services/apiClient';
import { motion } from 'framer-motion';

import { useRouter } from 'next/navigation';

import GlobalHeader from '../../components/GlobalHeader';

const ReportGeneratorView = ({ headerTitle, headerSubtitle }) => {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await vulnService.getAllFindings();
        const grouped = res.data.reduce((acc, current) => {
           if(!acc[current.scan_id]) {
             acc[current.scan_id] = current;
             acc[current.scan_id].findingCount = 1;
           } else {
             acc[current.scan_id].findingCount += 1;
           }
           return acc;
        }, {});
        setReports(Object.values(grouped));
      } catch (err) {
        console.error("Report fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleDownload = async (scanId, format) => {
    try {
      const response = await reportsService.download(scanId, format);
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/html' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `HexaReport_${scanId}.${format === 'pdf' ? 'pdf' : 'html'}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error", err);
      alert("Unauthorized or server error. Please ensure you are logged in correctly.");
    }
  };

  const handleDelete = async (scanId) => {
    if(!window.confirm("Are you sure you want to delete this report?")) return;
    try {
       await reportsService.delete(scanId);
       setReports(prev => prev.filter(r => r.scan_id !== scanId));
     } catch (err) {
        console.error("Delete error", err);
        alert("Failed to delete report.");
     }
  };

  const handleWipeAll = async () => {
    if (!window.confirm("WARNING: This will permanently wipe ALL scan results and findings from the database. This action cannot be undone. Proceed?")) return;
    try {
      await reportsService.purgeAll();
      setReports([]);
    } catch (err) {
      console.error("Purge error", err);
      alert("Failed to purge database.");
    }
  };

  const displayReports = reports;
  const filteredReports = displayReports.filter(r => 
    r.target?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.scan_id?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4 opacity-50">
           <Loader2 size={40} className="animate-spin text-cyber-neon" />
           <p className="text-sm font-medium text-gray-400">Loading reports…</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <GlobalHeader 
        title={headerTitle} 
        subtitle={headerSubtitle} 
      />

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
           <button 
             onClick={handleWipeAll}
             className="px-4 py-2 bg-cyber-alert/10 border border-cyber-alert/30 rounded-lg text-sm font-medium text-cyber-alert hover:bg-cyber-alert/20 transition-all"
           >
              Delete all
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-white/30 transition-colors">
              <Filter size={16} /> Filters
           </button>
        </div>
      </header>

      {/* Table Panel */}
      {filteredReports.length > 0 ? (
        <div className="bg-cyber-surface/50 border border-white/5 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/5">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Scan Date</th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Findings</th>
                  <th className="text-right py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReports.map((report) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={report.scan_id} 
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-cyber-blue" />
                        <span className="text-sm font-bold text-gray-200 tracking-wide">{report.scan_id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-bold text-white tracking-wide">{report.target}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 font-mono">{new Date(report.timestamp).toLocaleDateString()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                        {report.findingCount} findings
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                         {/* 1. Download Now Button */}
                         <button 
                           onClick={() => handleDownload(report.scan_id, 'pdf')}
                           className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20"
                           title="Download Now (PDF)"
                         >
                           <Download size={14} />
                           <span className="text-xs font-medium">Download</span>
                         </button>

                         {/* 2. Read Before Print (View) Button */}
                         <button 
                           onClick={() => router.push(`/reports/${report.scan_id}`)} 
                           className="flex items-center gap-2 px-3 py-1.5 bg-cyber-blue/10 text-cyber-blue rounded-lg hover:bg-cyber-blue/20 transition-all border border-cyber-blue/20"
                           title="View report"
                         >
                           <Shield size={14} />
                           <span className="text-xs font-medium">View</span>
                         </button>

                         {/* 3. Delete Button */}
                         <button 
                           onClick={() => handleDelete(report.scan_id)}
                           className="p-2 bg-cyber-alert/10 text-cyber-alert rounded-lg hover:bg-cyber-alert/20 transition-all border border-cyber-alert/20"
                           title="Delete Record"
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 border border-dashed border-white/5 rounded-2xl bg-black/20">
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Shield size={32} className="text-gray-700" />
           </div>
           <h3 className="text-lg font-bold text-gray-400 mb-2">No reports yet</h3>
           <p className="text-xs text-gray-600 text-center max-w-[300px] leading-relaxed">
              Run a <span className="text-cyber-blue">Network Scan</span> or <span className="text-cyber-neon">Reconnaissance</span> to generate findings.
           </p>
        </div>
      )}

      {/* Bottom Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
         <div className="flex flex-col items-center justify-center p-12 bg-cyber-surface/30 border border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all group">
            <DownloadCloud size={32} className="text-gray-500 group-hover:text-cyber-blue transition-colors mb-4" />
            <h3 className="text-lg font-bold text-gray-300 mb-2">Export All Data (JSON)</h3>
            <p className="text-xs text-gray-500 text-center max-w-[250px]">Full raw data export for external SIEM integration.</p>
         </div>
         
         <div className="flex flex-col items-center justify-center p-12 bg-cyber-surface/30 border border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all group">
            <CheckCircle size={32} className="text-gray-500 group-hover:text-cyber-neon transition-colors mb-4" />
            <h3 className="text-lg font-bold text-gray-300 mb-2">Compliance Packages</h3>
            <p className="text-xs text-gray-500 text-center max-w-[250px]">Generate NIST and OWASP compliance reports.</p>
         </div>
      </div>

    </div>
  );
};

export default ReportGeneratorView;
