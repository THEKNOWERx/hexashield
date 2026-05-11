import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { Shield, Zap, Target, Activity, AlertCircle, ChevronRight, Play } from 'lucide-react';
import { attackPathService } from '../services/apiClient';

const AttackPathVisualizer = ({ scanId }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    const fetchPathData = async () => {
      try {
        const res = await attackPathService.getAnalysis(scanId);
        setData(res.data);
      } catch (err) {
        console.error("Path analysis failed", err);
      } finally {
        setLoading(false);
      }
    };
    if (scanId) fetchPathData();
  }, [scanId]);

  useEffect(() => {
    if (!data || !data.graph || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 500;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    const g = svg.append("g");

    // Simulation
    const simulation = d3.forceSimulation(data.graph.nodes)
      .force("link", d3.forceLink(data.graph.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));

    // Links
    const link = g.append("g")
      .attr("stroke", "#1e293b")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.graph.links)
      .join("line")
      .attr("stroke-width", 2);

    // Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(data.graph.nodes)
      .join("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (e, d) => setSelectedNode(d));

    // Node circles with neon glow
    node.append("circle")
      .attr("r", d => d.type === 'Entry' || d.type === 'Host' ? 12 : 8)
      .attr("fill", d => d.type === 'Entry' ? '#0047ff' : (d.type === 'Impact' ? '#ff003c' : (d.type === 'Vulnerability' ? '#f97316' : '#39ff14')))
      .attr("stroke", "#000")
      .attr("stroke-width", 1.5)
      .style("filter", d => `drop-shadow(0 0 5px ${d.color || '#39ff14'})`);

    // Node labels
    node.append("text")
      .text(d => d.label)
      .attr("x", 12)
      .attr("y", 4)
      .attr("fill", "#94a3b8")
      .style("font-size", "10px")
      .style("font-weight", "black")
      .style("text-transform", "uppercase")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Zoom
    svg.call(d3.zoom().on("zoom", (event) => g.attr("transform", event.transform)));

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [data]);

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-500 animate-pulse uppercase text-[10px] font-black italic">Orchestrating Path Intelligence...</div>;
  if (!data) return <div className="h-64 flex items-center justify-center text-cyber-alert uppercase text-[10px] font-black italic">Failure to Derive Tactical Graph</div>;

  return (
    <div ref={containerRef} className="relative w-full h-[600px] border border-white/5 rounded-3xl overflow-hidden bg-black/20">
      <svg ref={svgRef} className="w-full h-full cursor-crosshair" />

      {/* TACTICAL OVERLAY */}
      <div className="absolute top-6 left-6 p-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl max-w-xs shadow-2xl">
         <div className="flex items-center gap-3 mb-4">
            <Activity size={18} className="text-cyber-blue" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Neural Attack Graph</span>
         </div>
         <div className="space-y-3">
            <p className="text-[10px] text-gray-400 leading-relaxed italic">
               {data.summary.ai_insight}
            </p>
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
               <span className="text-[9px] font-black text-gray-500 uppercase">Risk Level</span>
               <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-[9px] font-black uppercase">{data.summary.highest_risk}</span>
            </div>
         </div>
      </div>

      {/* NODE INTELLIGENCE PANEL */}
      {selectedNode && (
        <motion.div 
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          className="absolute top-0 right-0 h-full w-80 bg-[#0a0a0b] border-l border-white/10 p-8 shadow-2xl overflow-y-auto"
        >
           <button onClick={() => setSelectedNode(null)} className="mb-8 text-gray-500 hover:text-white transition-colors">
              <ChevronRight size={20} />
           </button>

           <div className="flex items-center gap-4 mb-6">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color || '#39ff14' }} />
              <h4 className="text-sm font-black uppercase text-white">{selectedNode.label}</h4>
           </div>

           <div className="space-y-6">
              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                 <span className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-2">Node Classification</span>
                 <span className="text-xs font-black text-cyber-blue uppercase">{selectedNode.type} Intelligence</span>
              </div>

              {selectedNode.cvss && (
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Risk Projection</span>
                      <span className="text-[10px] font-black text-cyber-alert uppercase">{selectedNode.risk}</span>
                   </div>
                   <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyber-alert" style={{ width: `${selectedNode.cvss * 10}%` }} />
                   </div>
                </div>
              )}

              {selectedNode.mitre && (
                <div className="p-4 bg-cyber-blue/10 border border-cyber-blue/30 rounded-xl">
                   <span className="block text-[8px] font-black text-cyber-blue uppercase tracking-widest mb-1">MITRE ATT&CK Matrix</span>
                   <span className="text-xs font-black text-white">{selectedNode.mitre}</span>
                </div>
              )}

              {selectedNode.source && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                   <span className="block text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1">Exploit-DB Record</span>
                   <span className="text-[10px] font-black text-white font-mono">{selectedNode.source}</span>
                </div>
              )}
           </div>

           {/* TASK 6: SAFE EXPLOIT PREVIEW */}
           {selectedNode.type === 'Exploit' && (
             <div className="mt-12 pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 mb-6">
                   <Zap size={16} className="text-cyber-neon" />
                   <span className="text-[10px] font-black uppercase text-cyber-neon tracking-widest">Tactical Preview</span>
                </div>
                <div className="bg-black/60 rounded-xl p-4 font-mono text-[10px] text-cyber-neon border border-cyber-neon/20 leading-relaxed">
                   # PREVIEW ONLY - NON-EXECUTABLE<br/>
                   msfconsole -q<br/>
                   use {selectedNode.source}
                </div>
             </div>
           )}
        </motion.div>
      )}

      {/* LEGEND */}
      <div className="absolute bottom-6 left-6 flex items-center gap-6 px-6 py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0047ff]" />
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Entry</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#39ff14]" />
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Host</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#f97316]" />
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Vuln</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ff003c]" />
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Impact</span>
         </div>
      </div>
    </div>
  );
};

export default AttackPathVisualizer;
