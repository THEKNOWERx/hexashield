/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Shield, Zap, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { vulnService } from '../services/apiClient';
import { useSecurity } from '../context/SecurityContext';
import { motion } from 'framer-motion';
import GlobalHeader from '../components/GlobalHeader';

const TacticalStep = ({ title, desc, active, delay }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className={`p-4 rounded-xl border flex items-start gap-4 transition-all duration-300 ${active ? 'bg-cyber-blue/5 border-cyber-blue/30 backdrop-blur-sm shadow-[0_0_15px_rgba(0,71,255,0.05)]' : 'bg-transparent border-white/5 opacity-50'}`}
  >
    <div className={`mt-0.5 p-1 rounded bg-black flex-shrink-0 ${active ? 'text-cyber-blue' : 'text-gray-600'}`}>
      <Zap size={14} />
    </div>
    <div>
      <h4 className={`text-sm font-bold mb-1 ${active ? 'text-white' : 'text-gray-500'}`}>{title}</h4>
      <p className="text-xs text-gray-400/80 leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const GraphNode = ({ node, isHighlighted, status, onClick }) => (
  <motion.div
    layoutId={node.id}
    onClick={() => onClick(node)}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: status === 'pending' ? 0.8 : 1, 
      opacity: status === 'pending' ? 0.3 : 1 
    }}
    whileHover={{ scale: 1.1 }}
    className={`absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-all duration-300
      ${status === 'active' ? 'ring-4 ring-red-500/50 rounded-full animate-pulse' : ''}`}
    style={{ left: `${node.x}%`, top: `${node.y}%` }}
  >
    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-black/20 shadow-2xl transition-colors duration-500
      ${status === 'pending' ? 'bg-gray-800 grayscale' : ''}
      ${status === 'active' || status === 'compromised' ? (
        node.type === 'Host' ? 'bg-cyber-blue' :
        node.type === 'Service' ? 'bg-cyber-neon' :
        node.type === 'Vulnerability' ? 'bg-orange-500' :
        'bg-red-500'
      ) : ''}
      ${status === 'compromised' ? 'opacity-60 brightness-75' : ''}
    `}>
      <Zap size={14} className={status === 'pending' ? 'text-gray-600' : 'text-white'} />
    </div>
    <span className={`mt-2 text-[8px] font-black tracking-widest uppercase bg-black/80 px-2 py-0.5 rounded border border-white/5 whitespace-nowrap transition-opacity duration-500
      ${status === 'pending' ? 'opacity-30' : 'opacity-100'}
      ${status === 'active' ? 'text-white border-red-500/50' : 'text-gray-400'}
    `}>
      {node.label}
    </span>
  </motion.div>
);

const TargetNode = ({ findings, target }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [speed, setSpeed] = useState(2000);

  useEffect(() => {
    const nodes = [
      { id: 'h1', label: target, type: 'Host', x: 20, y: 50, desc: "Step 1: Attacker identifies target infrastructure via reconnaissance." },
      { id: 's1', label: 'HTTP (80)', type: 'Service', x: 40, y: 35, desc: "Step 2: Service discovery confirms active listeners on port 80." },
      { id: 'v1', label: 'CVE-2021-44228', type: 'Vulnerability', x: 65, y: 35, desc: "Step 3: Identification of high-criticality Log4Shell vulnerability." },
      { id: 'i1', label: 'RCE / System Access', type: 'Impact', x: 85, y: 35, desc: "Step 4: Full Remote Code Execution achieved. Target compromised." }
    ];
    const links = [
      { source: 'h1', target: 's1' },
      { source: 's1', target: 'v1' },
      { source: 'v1', target: 'i1' }
    ];
    setGraphData({ nodes, links });
    setLoading(false);
  }, [target]);

  // Simulation Logic
  useEffect(() => {
    let timer;
    if (isPlaying && currentStep < graphData.nodes.length - 1) {
      timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, speed);
    } else if (currentStep >= graphData.nodes.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, graphData.nodes.length, speed]);

  const getStatus = (nodeId) => {
    const idx = graphData.nodes.findIndex(n => n.id === nodeId);
    if (idx === currentStep) return 'active';
    if (idx < currentStep) return 'compromised';
    return 'pending';
  };

  const activeNode = graphData.nodes[currentStep];

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500 lg:p-8 overflow-y-auto">
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Left: Interactive Graph Surface */}
        <div className="flex-[2] cyber-panel bg-black/40 border border-white/5 relative overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyber-neon animate-pulse' : 'bg-gray-600'}`}></div>
                <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400">Attack Graph Simulation: Tactical Journey</h3>
             </div>
             <div className="flex gap-2">
                <span className="text-[8px] bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20 px-2 py-0.5 rounded font-bold uppercase">
                  Step {Math.max(0, currentStep + 1)} / {graphData.nodes.length}
                </span>
             </div>
          </div>

          <div className="flex-1 relative w-full h-full">
             <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {graphData.links.map((link, idx) => {
                  const sourceNode = graphData.nodes.find(n => n.id === link.source);
                  const targetNode = graphData.nodes.find(n => n.id === link.target);
                  const sourceIdx = graphData.nodes.findIndex(n => n.id === link.source);
                  
                  // Only show link if source node is at least active
                  if (!sourceNode || !targetNode || sourceIdx > currentStep) return null;
                  
                  return (
                    <motion.line
                      key={idx}
                      x1={`${sourceNode.x}%`} y1={`${sourceNode.y}%`}
                      x2={`${targetNode.x}%`} y2={`${targetNode.y}%`}
                      stroke={getStatus(link.target) !== 'pending' ? '#00FF66' : 'rgba(255,255,255,0.05)'}
                      strokeWidth={1}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                    />
                  );
                })}
             </svg>

             {graphData.nodes.map(node => (
               <GraphNode 
                  key={node.id} 
                  node={node} 
                  status={getStatus(node.id)}
                  onClick={setSelectedNode}
               />
             ))}
          </div>
          
          {/* Simulation Narrative bar */}
          <div className="bg-black/60 backdrop-blur-md border-t border-white/10 p-6">
             <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex gap-2">
                   <button 
                      onClick={() => {
                        if (currentStep === -1) setCurrentStep(0);
                        setIsPlaying(!isPlaying);
                      }}
                      className="p-3 rounded-lg bg-cyber-blue hover:bg-blue-600 text-white transition-all shadow-lg active:scale-95"
                   >
                      {isPlaying ? <Shield size={18} /> : <Zap size={18} />}
                   </button>
                   <button 
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentStep(-1);
                      }}
                      className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all border border-white/5"
                   >
                      <Loader2 size={18} />
                   </button>
                </div>

                <div className="flex-1">
                   {activeNode ? (
                     <motion.div
                       key={currentStep}
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       className="space-y-1"
                     >
                        <h4 className="text-[10px] font-black text-cyber-blue uppercase tracking-widest">Tactical Insight</h4>
                        <p className="text-sm font-medium text-white line-clamp-1">{activeNode.desc}</p>
                     </motion.div>
                   ) : (
                     <p className="text-sm text-gray-500 font-mono italic">SYSTEM READY: INITIALIZE SIMULATION TO ANALYZE INVASION VECTORS</p>
                   )}
                </div>

                <div className="flex gap-2">
                   {[1, 2, 5].map(s => (
                     <button
                        key={s}
                        onClick={() => setSpeed(2000 / s)}
                        className={`text-[9px] font-black px-3 py-1 rounded border transition-all ${speed === 2000 / s ? 'bg-cyber-neon/10 border-cyber-neon text-cyber-neon' : 'bg-transparent border-white/10 text-gray-600'}`}
                     >
                        {s}X
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Right: intelligence sidebar */}
        <div className="flex-[1] flex flex-col gap-6 lg:min-h-full">
          <div className="cyber-panel bg-black/40 border border-white/5 flex flex-col h-full p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Node Intelligence</h3>
                <Shield className="text-cyber-blue" size={20} />
             </div>

             {selectedNode ? (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-6"
               >
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                     <h4 className="text-xs font-black tracking-widest text-cyber-neon uppercase mb-2">Detailed Telemetry</h4>
                     <p className="text-xl font-bold text-white">{selectedNode.label}</p>
                     <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30 uppercase">
                       {selectedNode.type} Entity
                     </span>
                  </div>

                  <div className="space-y-4">
                     <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Simulation Context</h5>
                     <div className="p-4 rounded-xl border border-white/5 bg-black/20 space-y-3">
                        <div className="flex justify-between">
                           <span className="text-xs text-gray-400">Current Phase</span>
                           <span className={`text-xs font-bold uppercase ${getStatus(selectedNode.id) === 'active' ? 'text-cyber-neon' : 'text-gray-500'}`}>
                             {getStatus(selectedNode.id)}
                           </span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-xs text-gray-400">Path Criticality</span>
                           <span className="text-xs font-bold text-red-500 uppercase">Strategic</span>
                        </div>
                     </div>
                  </div>
                  
                  <button 
                     onClick={() => setSelectedNode(null)}
                     className="w-full py-2 rounded-lg border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors"
                  >
                    Clear Focus
                  </button>
               </motion.div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 p-10">
                  <AlertCircle size={40} className="mb-4 text-gray-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Monitor nodes during simulation<br/>to extract tactical intel</p>
               </div>
             )}

             <div className="mt-auto pt-8 border-t border-white/5">
                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Historical Replay</h5>
                <div className="grid grid-cols-2 gap-2">
                   <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-1">
                      <span className="text-[8px] text-gray-600 font-bold uppercase">Success Rate</span>
                      <span className="text-sm font-bold text-cyber-neon">94.2%</span>
                   </div>
                   <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-1">
                      <span className="text-[8px] text-gray-600 font-bold uppercase">Mean Path Time</span>
                      <span className="text-sm font-bold text-cyber-blue">8.4s</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}


const AttackPathView = ({ headerTitle, headerSubtitle }) => {
  const { vulnResults: findings, setVulnResults: setFindings, activeTarget } = useSecurity();
  const [loading, setLoading] = useState(!findings);
  const [target, setTarget] = useState(activeTarget || 'google.com'); // Fallback for visual fidelity

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const res = await vulnService.getAllFindings();
        setFindings(res.data || []);
        // Find unique target if available
        if (res.data && res.data.length > 0 && res.data[0].target) {
           setTarget(res.data[0].target);
        }
      } catch (err) {
        console.error("Path analysis error", err);
        setFindings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFindings();
  }, [setFindings]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-cyber-blue" size={40} />
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">MAP-GEN: ANALYZING NETWORK TOPOLOGY...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GlobalHeader 
        title={headerTitle} 
        subtitle={headerSubtitle} 
      />
      <main className="flex-1 overflow-hidden">
         <TargetNode findings={findings} target={target} />
      </main>
    </div>
  );
};

export default AttackPathView;
