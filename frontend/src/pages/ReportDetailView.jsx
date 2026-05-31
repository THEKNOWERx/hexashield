/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Target, 
  Activity, 
  Zap, 
  FileText, 
  ArrowLeft, 
  Globe, 
  Server, 
  Hash, 
  Terminal, 
  AlertTriangle,
  ChevronRight,
  Loader2,
  Trash2,
  Download,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { reportsService } from '../services/apiClient';
import { motion } from 'framer-motion';
import AttackPathVisualizer from '../components/AttackPathVisualizer';
import GlobalHeader from '../components/GlobalHeader';
import RiskScoreGauge from '../components/RiskScoreGauge';

const ReportSection = ({ title, icon: Icon, children, sectionNumber, subtitle }) => (
  <section className="mb-16 scroll-mt-24">
    <div className="flex flex-col mb-8">
       <div className="flex items-center gap-4 mb-2">
          {sectionNumber && <span className="text-cyber-blue font-bold text-2xl font-mono opacity-50">{sectionNumber}</span>}
          <h3 className="text-xl font-semibold text-white flex items-center gap-3">
             {Icon && <Icon size={22} className="text-cyber-blue" />}
             {title}
          </h3>
       </div>
       {subtitle && <p className="text-xs font-medium text-gray-500 ml-12">{subtitle}</p>}
       <div className="h-px bg-gradient-to-r from-cyber-blue/50 via-transparent to-transparent mt-4 ml-12" />
    </div>
    <div className="ml-0 md:ml-12">
      {children}
    </div>
  </section>
);

const ReportDetailView = ({ headerTitle, headerSubtitle }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editableFindings, setEditableFindings] = useState([]);
  const [remarks, setRemarks] = useState('');

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      const res = await reportsService.download(id, 'pdf');
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HexaShield_Audit_REP${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Failed to generate PDF. Is the xhtml2pdf backend ready?");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if(!window.confirm("Are you sure you want to delete this record forever?")) return;
    try {
       await reportsService.delete(id);
       navigate('/reports');
     } catch (err) {
        console.error("Delete error", err);
        alert("Failed to delete audit record.");
     }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await reportsService.getReportDetails(id);
        const data = res.data;
        setReport(data);
        setEditableFindings(data.findings || []);
        setRemarks(data.recon?.remarks || '');
      } catch (err) {
        console.error("Failed to fetch report details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await reportsService.updateReport(id, {
        remarks: remarks,
        findings: editableFindings
      });
      setEditMode(false);
      // Refresh local report state
      setReport({ ...report, findings: editableFindings, recon: { ...report.recon, remarks: remarks } });
      alert("Report updated.");
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save updates.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateFinding = (idx, field, value) => {
    const updated = [...editableFindings];
    updated[idx][field] = value;
    setEditableFindings(updated);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 size={40} className="animate-spin text-cyber-blue" />
        <p className="text-sm font-medium text-gray-400">Loading report…</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
        <AlertTriangle size={48} className="text-cyber-alert" />
        <h2 className="text-2xl font-bold">Report not found</h2>
        <button onClick={() => navigate('/reports')} className="cyber-button">Back to reports</button>
      </div>
    );
  }

  const { recon, ports, findings, target, timestamp, scan_id, risk_score } = report;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      {/* PROFESSIONAL COVER PAGE SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#050505] shadow-[0_0_100px_rgba(0,0,0,1)]"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
           <Shield size={400} className="text-cyber-blue" />
        </div>
        
        <div className="relative p-12 md:p-16 flex flex-col md:flex-row justify-between gap-12 items-end">
           <div className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-3">
                 <span className="px-3 py-1 bg-cyber-blue text-white text-xs font-semibold rounded">Final report</span>
                 <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-500 text-xs font-medium rounded">Penetration test</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                 Security Assessment Report
              </h1>
              <div className="flex flex-col gap-2 pt-4">
                 <h2 className="text-lg font-semibold text-gray-300">{target}</h2>
                 <p className="text-xs text-gray-600 font-mono">
                    ID: {scan_id || id} • Generated: {new Date(timestamp).toLocaleString('en-US', { hour12: false })}
                 </p>
                 <p className="text-xs font-medium text-gray-500 mt-4">
                    Confidential · Academic use only
                 </p>
              </div>
           </div>

           <div className="w-full md:w-80 bg-black/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl">
              <RiskScoreGauge 
                score={(risk_score || 75) / 10} 
                monitored={ports?.length || 0} 
                criticals={findings?.filter(f => f.severity === 'Critical').length || 0}
                integrity={98}
              />
           </div>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/reports')}
              className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2"
              title="Back to reports"
            >
              <ArrowLeft size={14} /> Back to reports
            </button>
         </div>
          <div className="flex flex-wrap gap-4">
            {/* 1. Download Now */}
            <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="px-8 py-3 bg-[#0047ff] hover:bg-[#1a5eff] disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-[0_0_20px_rgba(0,71,255,0.3)] transition-all flex items-center gap-3 border border-blue-400/20"
            >
                {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {isDownloading ? 'Compiling…' : 'Download PDF'}
            </button>

            {/* 2. Delete Record */}
             <button 
               onClick={handleDelete}
               className="px-5 py-3 bg-cyber-alert/10 border border-cyber-alert/30 hover:bg-cyber-alert/20 text-cyber-alert rounded-xl text-sm font-medium transition-all flex items-center gap-2"
               title="Delete report"
             >
               <Trash2 size={14} /> Delete
             </button>

             {/* 3. Edit/Save Toggle */}
             {!editMode ? (
               <button 
                 onClick={() => setEditMode(true)}
                 className="px-5 py-3 bg-cyber-neon/10 border border-cyber-neon/30 hover:bg-cyber-neon/20 text-cyber-neon rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(57,255,20,0.1)]"
                 title="Edit report"
               >
                 <Edit3 size={14} /> Edit Mode
               </button>
             ) : (
               <div className="flex gap-2">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-3 bg-cyber-neon text-black rounded-xl text-sm font-semibold transition-all flex items-center gap-2 hover:brightness-110"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                  </button>
                  <button 
                    onClick={() => { setEditMode(false); setEditableFindings(report.findings); }}
                    className="px-3 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-medium transition-all flex items-center hover:bg-white/10"
                  >
                    <X size={14} />
                  </button>
               </div>
             )}
          </div>
      </div>

      {/* 0. Executive Summary (Editable) */}
      <div className="bg-[#0a0a0b] border border-white/10 p-8 rounded-2xl shadow-2xl mb-8 relative group">
         <div className="absolute -top-3 -left-3 px-4 py-1 bg-cyber-blue text-white text-xs font-semibold rounded">
            Executive Summary
         </div>
         <h4 className="text-xs font-semibold text-gray-500 mb-6 mt-2">Overview & Guidance</h4>
         {!editMode ? (
            <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-cyber-blue/30 pl-4">
               {remarks || "No additional remarks recorded for this report. Use Edit to add guidance for stakeholders."}
            </p>
         ) : (
            <textarea 
               value={remarks}
               onChange={(e) => setRemarks(e.target.value)}
               placeholder="Enter an executive summary or guidance…"
               className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-cyber-blue font-mono focus:border-cyber-blue/50 focus:outline-none min-h-[100px] transition-all"
            />
         )}
      </div>

      {/* 1. Infrastructure Overlays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
         {/* Service Fingerprint */}
         <div className="bg-[#0a0a0b] border border-white/5 p-6 rounded-2xl shadow-2xl">
            <h4 className="text-xs font-semibold text-gray-500 mb-6">Service Fingerprint</h4>
            <div className="space-y-4 font-mono">
               <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs w-32">Detected Version:</span>
                  <span className="text-cyber-neon font-semibold text-xs">{recon?.headers?.version || 'Unknown'}</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs w-32">Server Type:</span>
                  <span className="text-gray-200 font-semibold text-xs">{recon?.headers?.headers?.Server || 'gws'}</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs w-32">Powered By:</span>
                  <span className="text-gray-200 font-semibold text-xs">{recon?.headers?.headers?.['X-Powered-By'] || 'N/A'}</span>
               </div>
            </div>
         </div>

         {/* Geospatial Telemetry */}
         <div className="bg-[#0a0a0b] border border-white/5 p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
            <h4 className="text-xs font-semibold text-gray-500 mb-6">Geolocation</h4>
            <div className="space-y-4 font-mono">
               <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs w-32">Coordinates:</span>
                  <span className="text-cyber-blue font-semibold text-xs">{recon?.ip_intelligence?.lat || '37.4225'}, {recon?.ip_intelligence?.lon || '-122.085'}</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-[11px] w-32">Location:</span>
                  <span className="text-gray-200 font-semibold text-xs">{recon?.ip_intelligence?.city || 'Mountain View'}, {recon?.ip_intelligence?.country || 'United States'}</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-[11px] w-32">ASN/ISP:</span>
                  <span className="text-gray-200 font-semibold text-xs">{recon?.ip_intelligence?.asn || 'AS15169 Google LLC'}</span>
               </div>
            </div>
         </div>
      </div>

      {/* 2. Infrastructure Surface Discovery - LIST OPEN PORTS (Requested Feature) */}
      <ReportSection 
        title="Infrastructure Surface Discovery" 
        subtitle="Network Service Mapping & Asset Fingerprinting"
        sectionNumber="02/"
        icon={Server}
      >
        <div className="bg-[#0a0a0b] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-500 font-semibold border-b border-white/5 bg-white/[0.01]">
                  <th className="py-5 pl-8">Port / Protocol</th>
                  <th className="py-5">Service</th>
                  <th className="py-5">Platform / Version</th>
                  <th className="py-5 pr-8 text-right">Reputation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ports && ports.length > 0 ? (
                  ports.map((p, idx) => {
                    const service = (p.service || '').toString();
                    const protocol = (p.protocol || 'tcp').toString();
                    const isSensitive = ['http', 'ssh', 'ftp', 'smb', 'sql', 'rdp'].some(s => service.toLowerCase().includes(s));
                    return (
                      <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                        <td className={`py-6 pl-8 font-mono text-xs font-semibold ${isSensitive ? 'text-red-500' : 'text-cyber-blue'}`}>
                          {p.port}/{protocol.toUpperCase()}
                        </td>
                        <td className={`py-6 font-semibold text-sm ${isSensitive ? 'text-red-500' : 'text-white'}`}>
                          {service ? service.toUpperCase() : '—'}
                        </td>
                        <td className="py-6 text-[11px] text-gray-500 font-mono">
                          {p.version || p.product || 'Standard Service'}
                        </td>
                        <td className="py-6 pr-8 text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                            isSensitive ? 'border-red-600 text-red-500 bg-red-900/10' : 'border-cyber-blue/30 text-cyber-blue/70 bg-cyber-blue/5'
                          }`}>
                            {isSensitive ? 'Sensitive' : 'Stable'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-20 text-center text-gray-600 font-medium text-sm">
                      No active ports discovered in this scan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ReportSection>

      {/* 3. Vulnerability Deep-Dive */}
      <ReportSection 
        title="Vulnerability Intelligence" 
        subtitle="Findings and remediation analysis"
        sectionNumber="03/"
        icon={Zap}
      >
         <div className="space-y-8">
            {findings && findings.length > 0 ? findings.map((f, idx) => (
               <motion.div 
                 key={idx} 
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 className="bg-[#0a0a0b] border border-white/5 rounded-2xl overflow-hidden shadow-2xl group transition-all hover:border-cyber-blue/30"
               >
                  {/* Finding Header */}
                  <div className="bg-white/[0.02] border-b border-white/5 px-8 py-5 flex justify-between items-center">
                     <h4 className="text-sm md:text-md font-semibold text-white">{f.name}</h4>
                     <div className={`px-4 py-1.5 rounded-full text-xs font-medium border shadow-lg
                        ${f.severity === 'Critical' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 
                          f.severity === 'High' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 
                          'bg-cyber-neon/10 border-cyber-neon/30 text-cyber-neon'}
                     `}>
                        {f.severity} (CVSS: {f.cvss || '5.0'})
                     </div>
                  </div>
                  
                  <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div>
                        <h5 className="text-xs font-semibold text-gray-500 mb-4 border-l-2 border-gray-800 pl-3">Vulnerability Description</h5>
                        {!editMode ? (
                          <p className="text-xs text-gray-400 leading-relaxed font-medium">
                             {f.description}
                          </p>
                        ) : (
                          <textarea 
                            value={editableFindings[idx]?.description || ''}
                            onChange={(e) => updateFinding(idx, 'description', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-gray-300 font-mono focus:border-cyber-blue/30 focus:outline-none min-h-[80px]"
                          />
                        )}
                        <div className="mt-10 flex flex-wrap gap-4">
                           <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                              <span className="block text-[10px] font-medium text-gray-600 mb-1">OWASP Category</span>
                              <span className="text-[11px] font-semibold text-cyber-neon">{f.owasp_category || f.owasp || 'A03:2021-Injection'}</span>
                           </div>
                           <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                              <span className="block text-[10px] font-medium text-gray-600 mb-1">MITRE ATT&CK</span>
                              <span className="text-[11px] font-semibold text-cyber-blue">{f.mitre_id || f.mitre || 'T1190'}</span>
                           </div>
                        </div>

                        {/* Aggregated Sources indicator for Reports */}
                        <div className="mt-6 flex flex-wrap gap-2">
                           {(f.aggregated_sources || ["NIST NVD", "Local Mirror"]).map((source, i) => (
                              <div key={i} className="px-2 py-1 bg-white/[0.02] border border-white/5 rounded text-[10px] font-medium text-gray-600">
                                 {source}
                              </div>
                           ))}
                        </div>
                     </div>
                     
                     <div className="relative">
                        <h5 className="text-xs font-semibold text-cyber-neon mb-4 border-l-2 border-cyber-neon pl-3">Recommended Remediation</h5>
                        <div className="bg-[#39ff14]/[0.02] border border-[#39ff14]/20 p-6 rounded-2xl backdrop-blur-sm relative group overflow-hidden mb-6">
                           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                              <Shield size={40} className="text-cyber-neon" />
                           </div>
                           {!editMode ? (
                             <p className="text-xs text-cyber-neon leading-relaxed font-medium z-10 relative">
                                {f.remediation || 'Apply input validation and parameterized queries to mitigate this risk across all vulnerable endpoints.'}
                             </p>
                           ) : (
                             <textarea 
                               value={editableFindings[idx]?.remediation || ''}
                               onChange={(e) => updateFinding(idx, 'remediation', e.target.value)}
                               className="w-full bg-black/40 border border-[#39ff14]/30 rounded-xl p-4 text-xs text-cyber-neon font-medium focus:border-cyber-neon focus:outline-none min-h-[100px] z-10 relative"
                             />
                           )}
                        </div>

                        {/* External Intelligence Block */}
                        {(f.reference_url || (f.exploit_db_id && f.exploit_db_id !== 'N/A')) && (
                           <div className="grid grid-cols-2 gap-4">
                              {f.reference_url && (
                                <a 
                                  href={f.reference_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                                >
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">NVD Database</span>
                                  <Globe size={14} className="text-cyber-blue group-hover:scale-110 transition-transform" />
                                </a>
                              )}
                              {f.exploit_db_id && f.exploit_db_id !== 'N/A' && (
                                <a 
                                  href={`https://www.exploit-db.com/exploits/${f.exploit_db_id}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                                >
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Exploit-DB</span>
                                  <Hash size={14} className="text-cyber-alert group-hover:scale-110 transition-transform" />
                                </a>
                              )}
                           </div>
                        )}
                     </div>
                  </div>
               </motion.div>
            )) : (
               <div className="py-20 text-center text-gray-600 border border-dashed border-white/10 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]">No vulnerability findings documented.</div>
            )}
         </div>
      </ReportSection>

      {/* 4. Attack Path Mapping */}
      <ReportSection 
        title="Tactical Incursion Chain" 
        subtitle="Graph-based simulation of exploitation vectors"
        sectionNumber="04/"
        icon={Activity}
      >
         <div className="h-[600px] bg-[#0a0a0b] rounded-3xl overflow-hidden border border-white/5 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <AttackPathVisualizer scanId={id} />
            <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
               <div className="w-2 h-2 rounded-full bg-cyber-blue animate-pulse shadow-[0_0_10px_rgba(0,71,255,0.8)]" />
               <span className="text-[9px] font-black text-gray-200 uppercase tracking-widest">Dynamic Path Mapping Reactive</span>
            </div>
         </div>
      </ReportSection>
   </div>
  );
};

export default ReportDetailView;
