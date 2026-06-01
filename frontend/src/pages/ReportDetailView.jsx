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
  X,
  Calendar,
  Clock
} from 'lucide-react';
import { reportsService } from '../services/apiClient';
import { motion } from 'framer-motion';
import AttackPathVisualizer from '../components/AttackPathVisualizer';
import RiskScoreGauge from '../components/RiskScoreGauge';

const ReportSection = ({ title, icon: Icon, children, sectionNumber, subtitle }) => (
  <section className="mb-12 print:mb-8 print:break-inside-avoid scroll-mt-24">
    <div className="flex flex-col mb-6">
       <div className="flex items-center gap-4 mb-1">
          {sectionNumber && <span className="text-blue-600 font-bold text-2xl font-mono opacity-80">{sectionNumber}</span>}
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
             {Icon && <Icon size={24} className="text-blue-600" />}
             {title}
          </h3>
       </div>
       {subtitle && <p className="text-sm font-medium text-gray-500 ml-12">{subtitle}</p>}
       <div className="h-px bg-gradient-to-r from-blue-300 via-transparent to-transparent mt-4 ml-12" />
    </div>
    <div className="ml-0 md:ml-12">
      {children}
    </div>
  </section>
);

const ReportDetailView = () => {
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
    // Instead of backend PDF, trigger browser print which is perfectly styled now!
    window.print();
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
      setReport({ ...report, findings: editableFindings, recon: { ...report.recon, remarks: remarks } });
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 bg-gray-50">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-sm font-medium text-gray-500">Compiling Document…</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 bg-gray-50 text-gray-800">
        <AlertTriangle size={48} className="text-red-500" />
        <h2 className="text-2xl font-bold">Report not found</h2>
        <button onClick={() => navigate('/reports')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Back to reports</button>
      </div>
    );
  }

  const { recon, ports, findings, target, timestamp, scan_id, risk_score } = report;
  let reportDate = new Date(timestamp);
  if (isNaN(reportDate.getTime())) {
    reportDate = new Date(); // Fallback to current real date if missing/invalid
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white font-sans text-gray-900">
      <div className="max-w-5xl mx-auto bg-white shadow-[0_0_40px_rgba(0,0,0,0.05)] rounded-sm print:shadow-none print:max-w-full">
        
        {/* ACTION BAR (HIDDEN ON PRINT) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-50 p-6 border-b border-gray-200 print:hidden rounded-t-sm">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/reports')}
                className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={14} /> Back to reports
              </button>
           </div>
            <div className="flex flex-wrap gap-3">
              <button 
                  onClick={handleDownloadPDF}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md transition-all flex items-center gap-2"
              >
                  <Download size={16} /> Print / Save PDF
              </button>
               <button 
                 onClick={handleDelete}
                 className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
               >
                 <Trash2 size={14} /> Delete
               </button>
               {!editMode ? (
                 <button 
                   onClick={() => setEditMode(true)}
                   className="px-5 py-2.5 bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                 >
                   <Edit3 size={14} /> Edit Mode
                 </button>
               ) : (
                 <div className="flex gap-2">
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                    </button>
                    <button 
                      onClick={() => { setEditMode(false); setEditableFindings(report.findings); }}
                      className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all flex items-center hover:bg-gray-50"
                    >
                      <X size={14} /> Cancel
                    </button>
                 </div>
               )}
            </div>
        </div>

        <div className="p-12 md:p-16 print:p-8">
          {/* PROFESSIONAL COVER HEADER */}
          <header className="mb-16 border-b-2 border-blue-600 pb-12 print:pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
             <div className="space-y-6 flex-1">
                <div className="flex items-center gap-3 print:mb-4">
                   <span className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold uppercase tracking-wider rounded">Final Report</span>
                   <span className="px-3 py-1 bg-gray-100 text-gray-600 border border-gray-200 text-xs font-bold uppercase tracking-wider rounded">Confidential</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                   Security Assessment Report
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                   <div>
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Target Infrastructure</span>
                     <span className="text-lg font-bold text-blue-700">{target}</span>
                   </div>
                   <div>
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Assessment ID</span>
                     <span className="text-sm font-mono text-gray-800">{scan_id || id}</span>
                   </div>
                   <div className="flex items-center gap-2 text-gray-700 mt-2">
                     <Calendar size={16} className="text-blue-500" />
                     <span className="text-sm font-semibold">{reportDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                   </div>
                   <div className="flex items-center gap-2 text-gray-700 mt-2">
                     <Clock size={16} className="text-blue-500" />
                     <span className="text-sm font-semibold">{reportDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                </div>
             </div>

             <div className="w-full md:w-72 bg-white border-2 border-gray-100 p-6 rounded-2xl shadow-lg shrink-0">
                <div className="text-center mb-4 border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Calculated Risk Score</span>
                </div>
                <div className="flex justify-center filter drop-shadow-md">
                  <RiskScoreGauge 
                    score={(risk_score || 75) / 10} 
                    monitored={ports?.length || 0} 
                    criticals={findings?.filter(f => f.severity === 'Critical').length || 0}
                    integrity={98}
                  />
                </div>
             </div>
          </header>

          {/* 0. Executive Summary */}
          <div className="bg-blue-50/50 border border-blue-100 p-8 rounded-2xl mb-12 relative">
             <div className="absolute -top-3 left-6 px-4 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm">
                Executive Summary
             </div>
             <h4 className="text-sm font-bold text-blue-900 mb-4 mt-2">Overview & Management Guidance</h4>
             {!editMode ? (
                <p className="text-gray-800 text-sm leading-relaxed border-l-4 border-blue-500 pl-4 font-medium whitespace-pre-wrap">
                   {remarks || "No additional executive summary recorded for this report. This assessment evaluates the external perimeter and internal configuration of the specified target."}
                </p>
             ) : (
                <textarea 
                   value={remarks}
                   onChange={(e) => setRemarks(e.target.value)}
                   className="w-full bg-white border border-blue-200 rounded-lg p-4 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[120px] transition-all"
                />
             )}
          </div>

          {/* 1. Infrastructure Overlays */}
          <ReportSection 
            title="Service Fingerprint" 
            subtitle="Metadata and server headers detected during enumeration"
            sectionNumber="01/"
            icon={Target}
          >
            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-sm">
                  <div className="flex flex-col gap-1 border-l-2 border-gray-200 pl-4">
                      <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Detected OS/Version</span>
                      <span className="text-blue-700 font-bold">{recon?.headers?.version || 'Unknown'}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-l-2 border-gray-200 pl-4">
                      <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Server Technology</span>
                      <span className="text-gray-900 font-bold">{recon?.headers?.headers?.Server || 'Standard Web Server'}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-l-2 border-gray-200 pl-4">
                      <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Powered By</span>
                      <span className="text-gray-900 font-bold">{recon?.headers?.headers?.['X-Powered-By'] || 'N/A'}</span>
                  </div>
                </div>
            </div>
          </ReportSection>

          {/* 2. Infrastructure Surface Discovery */}
          <ReportSection 
            title="Network Surface Discovery" 
            subtitle="Exposed ports, protocols, and services"
            sectionNumber="02/"
            icon={Server}
          >
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                    <th className="py-4 pl-6">Port / Protocol</th>
                    <th className="py-4">Service</th>
                    <th className="py-4">Platform / Version</th>
                    <th className="py-4 pr-6 text-right">Reputation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ports && ports.length > 0 ? (
                    ports.map((p, idx) => {
                      const service = (p.service || '').toString();
                      const protocol = (p.protocol || 'tcp').toString();
                      const isSensitive = ['http', 'ssh', 'ftp', 'smb', 'sql', 'rdp'].some(s => service.toLowerCase().includes(s));
                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className={`py-5 pl-6 font-mono text-sm font-bold ${isSensitive ? 'text-red-600' : 'text-blue-700'}`}>
                            {p.port}/{protocol.toUpperCase()}
                          </td>
                          <td className={`py-5 font-bold text-sm ${isSensitive ? 'text-red-600' : 'text-gray-900'}`}>
                            {service ? service.toUpperCase() : '—'}
                          </td>
                          <td className="py-5 text-xs text-gray-600 font-medium">
                            {p.version || p.product || 'Standard Service'}
                          </td>
                          <td className="py-5 pr-6 text-right">
                            <span className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider ${
                              isSensitive ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {isSensitive ? 'Sensitive' : 'Stable'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-gray-500 font-medium text-sm bg-gray-50">
                        No active ports discovered in this scan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ReportSection>

          {/* 3. Vulnerability Deep-Dive */}
          <ReportSection 
            title="Vulnerability Intelligence" 
            subtitle="Identified security flaws and detailed remediation guidance"
            sectionNumber="03/"
            icon={Zap}
          >
             <div className="space-y-8">
                {findings && findings.length > 0 ? findings.map((f, idx) => (
                   <div 
                     key={idx} 
                     className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow print:break-inside-avoid"
                   >
                      {/* Finding Header */}
                      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                         <h4 className="text-lg font-bold text-gray-900">{f.name}</h4>
                         <div className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider border shadow-sm
                            ${f.severity === 'Critical' ? 'bg-red-50 border-red-200 text-red-700' : 
                              f.severity === 'High' ? 'bg-orange-50 border-orange-200 text-orange-700' : 
                              'bg-blue-50 border-blue-200 text-blue-700'}
                         `}>
                            {f.severity} (CVSS: {f.cvss || '5.0'})
                         </div>
                      </div>
                      
                      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                         <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 border-l-4 border-gray-300 pl-3">Vulnerability Description</h5>
                            {!editMode ? (
                              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                 {f.description}
                              </p>
                            ) : (
                              <textarea 
                                value={editableFindings[idx]?.description || ''}
                                onChange={(e) => updateFinding(idx, 'description', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-none min-h-[100px]"
                              />
                            )}
                            <div className="mt-8 flex flex-wrap gap-4">
                               <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg min-w-[140px]">
                                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">OWASP Category</span>
                                  <span className="text-xs font-bold text-gray-900">{f.owasp_category || f.owasp || 'A03:2021-Injection'}</span>
                               </div>
                               <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg min-w-[140px]">
                                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">MITRE ATT&CK</span>
                                  <span className="text-xs font-bold text-gray-900">{f.mitre_id || f.mitre || 'T1190'}</span>
                               </div>
                            </div>
                         </div>
                         
                         <div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-green-700 mb-3 border-l-4 border-green-500 pl-3">Recommended Remediation</h5>
                            <div className="bg-green-50 border border-green-200 p-5 rounded-xl mb-6">
                               {!editMode ? (
                                 <p className="text-sm text-green-900 leading-relaxed font-medium">
                                    {f.remediation || 'Apply input validation and parameterized queries to mitigate this risk across all vulnerable endpoints.'}
                                 </p>
                               ) : (
                                 <textarea 
                                   value={editableFindings[idx]?.remediation || ''}
                                   onChange={(e) => updateFinding(idx, 'remediation', e.target.value)}
                                   className="w-full bg-white border border-green-300 rounded-lg p-3 text-sm text-green-900 focus:border-green-500 focus:outline-none min-h-[100px]"
                                 />
                               )}
                            </div>

                            {/* External Intelligence Block */}
                            {(f.reference_url || (f.exploit_db_id && f.exploit_db_id !== 'N/A')) && (
                               <div className="grid grid-cols-2 gap-4 print:hidden">
                                  {f.reference_url && (
                                    <a 
                                      href={f.reference_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
                                    >
                                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">NVD Database</span>
                                      <Globe size={14} className="text-blue-600 group-hover:scale-110 transition-transform" />
                                    </a>
                                  )}
                                  {f.exploit_db_id && f.exploit_db_id !== 'N/A' && (
                                    <a 
                                      href={`https://www.exploit-db.com/exploits/${f.exploit_db_id}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all group"
                                    >
                                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Exploit-DB</span>
                                      <Hash size={14} className="text-red-600 group-hover:scale-110 transition-transform" />
                                    </a>
                                  )}
                               </div>
                            )}
                         </div>
                      </div>
                   </div>
                )) : (
                   <div className="py-16 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl font-bold uppercase tracking-wider text-xs bg-gray-50">
                      No vulnerability findings documented.
                   </div>
                )}
             </div>
          </ReportSection>

          {/* 4. Attack Path Mapping */}
          <ReportSection 
            title="Tactical Incursion Chain" 
            subtitle="Graph-based simulation of exploitation vectors (Print optimized)"
            sectionNumber="04/"
            icon={Activity}
          >
             <div className="h-[600px] bg-white rounded-2xl border-2 border-gray-200 relative shadow-inner overflow-hidden print:border-gray-300 print:shadow-none print:break-inside-avoid">
                {/* CSS override to force AttackPathVisualizer into a light theme appearance */}
                <style>{`
                  .attack-path-light-theme svg { background-color: #ffffff !important; }
                  .attack-path-light-theme text { fill: #374151 !important; font-weight: 700 !important; }
                  .attack-path-light-theme line { stroke: #cbd5e1 !important; stroke-width: 2px !important; }
                  .attack-path-light-theme .overlay-panel { background: rgba(255,255,255,0.95) !important; border-color: #e2e8f0 !important; color: #111827 !important; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important; }
                  .attack-path-light-theme .overlay-text { color: #4b5563 !important; }
                  .attack-path-light-theme .legend-bg { background: rgba(243,244,246,0.9) !important; border-color: #e2e8f0 !important; }
                  .attack-path-light-theme .legend-text { color: #4b5563 !important; }
                `}</style>
                <div className="attack-path-light-theme w-full h-full">
                  <AttackPathVisualizer scanId={id} />
                </div>
                
                <div className="absolute top-6 right-6 flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm print:hidden">
                   <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                   <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Interactive Graph</span>
                </div>
             </div>
          </ReportSection>
          
        </div>
      </div>
    </div>
  );
};

export default ReportDetailView;
