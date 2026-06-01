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
      .attr("fill", d => {
        if (d.type === 'Entry') return '#0047ff';
        if (d.type === 'Host') return '#39ff14';
        if (d.type === 'Service') return '#06b6d4';
        if (d.type === 'Vulnerability') return '#f97316';
        if (d.type === 'Impact') return '#ff003c';
        if (d.type === 'Objective') return '#b91c1c';
        return '#64748b';
      })
      .attr("stroke", "#000")
      .attr("stroke-width", 1.5)
      .style("filter", d => {
        const color = d.type === 'Entry' ? '#0047ff' : (d.type === 'Host' ? '#39ff14' : (d.type === 'Service' ? '#06b6d4' : (d.type === 'Vulnerability' ? '#f97316' : (d.type === 'Impact' ? '#ff003c' : (d.type === 'Objective' ? '#b91c1c' : '#64748b')))));
        return `drop-shadow(0 0 5px ${color})`;
      });

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

  if (loading) return <div className="h-64 flex items-center justify-center text-gray-500 text-sm">Building attack graph…</div>;
  if (!data) return <div className="h-64 flex items-center justify-center text-cyber-alert text-sm">Unable to build attack graph</div>;

  return (
    <div ref={containerRef} className="relative w-full h-[600px] border border-white/5 rounded-3xl overflow-hidden bg-black/20">
      <svg ref={svgRef} className="w-full h-full cursor-crosshair" />

      {/* TACTICAL OVERLAY */}
      <div className="absolute top-6 left-6 p-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl max-w-xs shadow-2xl">
         <div className="flex items-center gap-3 mb-4">
            <Activity size={18} className="text-cyber-blue" />
            <span className="text-sm font-semibold text-white">Attack Graph</span>
         </div>
         <div className="space-y-3">
            <p className="text-xs text-gray-400 leading-relaxed">
               {data.summary?.ai_insight || 'No analysis available for this graph.'}
            </p>
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
               <span className="text-xs font-medium text-gray-500">Risk Level</span>
               <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-xs font-medium">{data.summary?.highest_risk || 'N/A'}</span>
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
               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.type === 'Entry' ? '#0047ff' : (selectedNode.type === 'Host' ? '#39ff14' : (selectedNode.type === 'Service' ? '#06b6d4' : (selectedNode.type === 'Vulnerability' ? '#f97316' : (selectedNode.type === 'Impact' ? '#ff003c' : (selectedNode.type === 'Objective' ? '#b91c1c' : '#64748b'))))) }} />
               <h4 className="text-sm font-semibold text-white">{selectedNode.label}</h4>
            </div>

            <div className="space-y-6">
               <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                  <span className="block text-xs font-medium text-gray-500 mb-2">Node Classification</span>
                  <span className="text-xs font-semibold text-cyber-blue">{selectedNode.type}</span>
               </div>

               {selectedNode.cvss && (
                 <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-medium text-gray-500">Risk Projection</span>
                       <span className="text-xs font-semibold text-cyber-alert">{selectedNode.risk}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-cyber-alert" style={{ width: `${selectedNode.cvss * 10}%` }} />
                    </div>
                 </div>
               )}

               {selectedNode.mitre && (
                 <div className="p-4 bg-cyber-blue/10 border border-cyber-blue/30 rounded-xl">
                    <span className="block text-xs font-medium text-cyber-blue mb-1">MITRE ATT&CK</span>
                    <span className="text-xs font-semibold text-white">{selectedNode.mitre}</span>
                 </div>
               )}

               {selectedNode.tool && (
                 <div className="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
                    <span className="block text-xs font-medium text-gray-500 mb-1">Tool Employed</span>
                    <span className="text-xs font-semibold text-cyan-400">{selectedNode.tool}</span>
                 </div>
               )}
            </div>

            {selectedNode.command && (
              <div className="mt-6 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Execution Command</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedNode.command)}
                    className="text-[9px] font-mono text-cyber-blue hover:text-white cursor-pointer"
                  >
                    [COPY]
                  </button>
                </div>
                <div className="font-mono text-[9px] bg-black/60 p-3 rounded-lg border border-white/5 text-gray-300 break-all select-all font-bold">
                  {selectedNode.command}
                </div>
              </div>
            )}

            {selectedNode.terminal_output && (
              <div className="mt-6 space-y-1">
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">DIAGNOSTIC FEED</span>
                <div className="font-mono text-[9px] text-emerald-500/80 bg-black/60 p-3 rounded-lg border border-emerald-500/10 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto font-bold">
                  <span className="text-white/40">HEXASHIELD_LOG$</span> output_stream:<br/>
                  <span className="text-emerald-400 font-medium">{selectedNode.terminal_output}</span>
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
             <div className="w-2 h-2 rounded-full bg-[#06b6d4]" />
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Port</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#f97316]" />
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Vuln</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#ff003c]" />
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Shell / Esc</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#b91c1c]" />
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Objective</span>
          </div>
       </div>
    </div>
  );
};

export default AttackPathVisualizer;
