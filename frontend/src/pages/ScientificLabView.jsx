import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Binary, Cpu, BookOpen, Target, Zap, Activity, Info, ChevronRight, ExternalLink, GraduationCap, Microscope, Rocket, Loader2 } from 'lucide-react';
import { aiService } from '../services/apiClient';
import CyberCard from '../components/CyberCard';
import GlobalHeader from '../components/GlobalHeader';

const MetricGauge = ({ label, value, color }) => (
  <div className="flex flex-col items-center gap-3">
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="48" cy="48" r="40"
          stroke="currentColor" strokeWidth="8"
          fill="transparent" className="text-white/5"
        />
        <motion.circle
          cx="48" cy="48" r="40"
          stroke="currentColor" strokeWidth="8"
          fill="transparent"
          strokeDasharray="251.2"
          initial={{ strokeDashoffset: 251.2 }}
          animate={{ strokeDashoffset: 251.2 - (251.2 * value) / 100 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={color}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-xl font-black text-white leading-none">{Math.round(value)}%</span>
      </div>
    </div>
    <span className="text-xs font-medium text-gray-500">{label}</span>
  </div>
);

const ScientificLabView = ({ isMonochrome, onToggleMonochrome, headerTitle, headerSubtitle }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState(null);

  useEffect(() => {
    const fetchLabData = async () => {
      try {
        const res = await aiService.getScientificLab();
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch lab intelligence", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLabData();
  }, []);

  if (loading) {
     return (
       <div className="h-screen w-full flex flex-col items-center justify-center gap-6">
         <Microscope className="animate-pulse text-cyber-blue" size={64} strokeWidth={1} />
         <p className="text-sm font-medium text-cyber-blue">Loading lab environment…</p>
       </div>
     );
  }

  const metrics = data?.metrics || { accuracy: 94, precision: 92, recall: 89 };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col">
        <h2 className="text-4xl font-semibold tracking-tight text-white flex items-center gap-4">
           AI <span className="text-cyber-neon drop-shadow-[0_0_20px_rgba(57,255,20,0.5)]">Scientific</span> Lab
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-2">
           Random Forest classification and academic scenario generation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Model Metrics */}
        <div className="lg:col-span-4 space-y-8">
          <CyberCard className="bg-[#050505] border-cyber-neon/20 shadow-neon-glow/5">
            <div className="flex items-center gap-3 mb-10">
              <Binary className="text-cyber-neon" size={20} />
              <h3 className="text-sm font-semibold text-white leading-none">Model Performance</h3>
            </div>

            <div className="grid grid-cols-2 gap-y-10">
              <MetricGauge label="Accuracy" value={metrics.accuracy} color="text-cyber-neon" />
              <MetricGauge label="Precision" value={metrics.precision} color="text-cyber-blue" />
              <MetricGauge label="Recall" value={metrics.recall} color="text-cyber-alert" />
              <MetricGauge label="F1 Score" value={(metrics.precision + metrics.recall)/2} color="text-white" />
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-gray-600">Estimators</span>
                <span className="text-white">500 Trees</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-gray-600">Normalization</span>
                <span className="text-cyber-neon">CVSS Scalar</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-gray-600">Ground Truth</span>
                <span className="text-white">NVD 2024.1</span>
              </div>
            </div>
          </CyberCard>

          <CyberCard className="bg-cyber-blue/5 border-cyber-blue/10">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-cyber-blue/20 rounded-lg">
                <GraduationCap className="text-cyber-blue" size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Academic Context</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                  {data?.scientific_context || "Model trained on peer-reviewed security datasets to predict exploit impact based on NVD descriptions and CVSS metrics."}
                </p>
              </div>
            </div>
          </CyberCard>
        </div>

        {/* Right: Scenarios & Intel */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Rocket className="text-cyber-blue" size={20} />
               <h3 className="text-sm font-semibold text-white leading-none">AI Generated Training Scenarios</h3>
             </div>
             <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-gray-500">
               {data?.scenarios?.length || 0} Ready
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.scenarios?.map((scenario, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
                onClick={() => setActiveScenario(scenario)}
              >
                <CyberCard className="h-full border-white/5 hover:border-cyber-blue/30 transition-all bg-[#080808]/60 backdrop-blur-md">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-cyber-blue/10 transition-colors">
                        <Target className="text-gray-600 group-hover:text-cyber-blue transition-colors" size={20} />
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${scenario.difficulty === 'Master' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-cyber-blue/30 text-cyber-blue bg-cyber-blue/5'}`}>
                        {scenario.difficulty}
                      </span>
                   </div>
                   <h4 className="text-white font-semibold tracking-tight mb-2 group-hover:text-cyber-blue transition-colors">
                     {scenario.title}
                   </h4>
                   <p className="text-[11px] text-gray-500 leading-relaxed mb-6 line-clamp-2">
                     {scenario.objective}
                   </p>
                   <div className="flex items-center text-xs font-medium text-cyber-blue group-hover:gap-2 transition-all">
                      <span>Access Lab</span>
                      <ChevronRight size={12} />
                   </div>
                </CyberCard>
              </motion.div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/5">
             <div className="flex items-center gap-3 mb-6">
               <Cpu className="text-gray-600" size={18} />
               <h3 className="text-sm font-semibold text-gray-400 leading-none">Classification Feed</h3>
             </div>
             <div className="space-y-3">
               {data?.classifications?.slice(0, 5).map((item, idx) => (
                 <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-cyber-neon shadow-neon-glow" />
                       <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-white">{item.name}</span>
                          <span className="text-[9px] text-gray-600 font-medium">{item.mitre_id || 'T1190'}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] font-semibold text-cyber-neon font-mono">
                          {item.ai_intel.prediction}
                       </div>
                       <div className="text-[8px] text-gray-700 font-medium">
                          {item.ai_intel.confidence}% Confidence
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Scenario Detail Modal */}
      <AnimatePresence>
        {activeScenario && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveScenario(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-[#0A0A0A] border border-cyber-blue/30 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10">
                <div className="flex justify-between items-start mb-10">
                  <div className="p-4 bg-cyber-blue/10 rounded-3xl">
                    <Rocket className="text-cyber-blue" size={28} />
                  </div>
                  <button 
                    onClick={() => setActiveScenario(null)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"
                  >
                    <Info size={18} />
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <span className="text-[10px] font-black text-cyber-blue uppercase tracking-[0.3em] mb-3 block">Training Scenario</span>
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">{activeScenario.title}</h3>
                  </div>

                  <p className="text-sm text-gray-400 leading-relaxed font-medium">
                    {activeScenario.objective}
                  </p>

                  <div className="space-y-4">
                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest pb-2 border-b border-white/5">Execution Protocol</div>
                    {activeScenario.lab_steps.map((step, sidx) => (
                      <div key={sidx} className="flex items-start gap-4">
                        <span className="text-cyber-blue font-black font-mono text-xs">0{sidx + 1}</span>
                        <p className="text-xs text-gray-500 font-medium">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-10 flex gap-4">
                    <button className="flex-1 bg-cyber-blue hover:bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-blue-glow active:scale-[0.98] transition-all">
                      Initialize Virtual Lab
                    </button>
                    <div className="flex gap-2">
                       {activeScenario.resources.map((res, ridx) => (
                         <a key={ridx} href={res.url} target="_blank" rel="noreferrer" className="p-4 bg-white/5 border border-white/10 rounded-2xl text-gray-500 hover:text-white transition-all">
                            <ExternalLink size={18} />
                         </a>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScientificLabView;
