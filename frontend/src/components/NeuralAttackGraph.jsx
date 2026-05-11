import React, { useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Globe } from 'lucide-react';

const NeuralAttackGraph = ({ data, height = 600 }) => {
  const fgRef = useRef();

  const graphData = useMemo(() => {
    if (!data || !data.nodes) return { nodes: [], links: [] };
    return {
      nodes: data.nodes.map(n => ({
        id: n.id,
        name: n.label,
        type: n.type,
        risk: n.risk || 'Low',
        val: n.type === 'Host' ? 12 : n.type === 'Entry' ? 16 : 8,
        color: n.color || (
            n.type === 'Host' ? '#FFFFFF' : 
            n.type === 'Vulnerability' ? (n.risk === 'Critical' ? '#FF3366' : '#FFBB00') :
            n.type === 'Entry' ? '#0066FF' : '#00FF88'
        )
      })),
      links: data.links.map(l => ({
        source: l.source,
        target: l.target,
        name: l.label
      }))
    };
  }, [data]);

  if (!data) return null;

  return (
    <div className="relative w-full h-full bg-black/20 overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        height={height}
        backgroundColor="transparent"
        nodeLabel="name"
        nodeColor={node => node.color}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw Glow
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val + 2, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color + '15';
          ctx.fill();

          // Draw Node Core
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.fill();
          
          if (globalScale > 2) {
             ctx.fillStyle = 'rgba(255,255,255,0.5)';
             ctx.fillText(label, node.x, node.y + node.val + 8);
          }
        }}
        linkColor={() => 'rgba(255,255,255,0.05)'}
        linkWidth={1.5}
        linkDirectionalParticles={4}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={() => '#0066FF'}
        linkDirectionalParticleWidth={1.5}
        d3VelocityDecay={0.3}
      />

      {/* Legend */}
      <div className="absolute bottom-8 right-8 z-20 flex flex-col gap-4 p-6 bg-black/60 backdrop-blur-3xl border border-white/5 rounded-2xl">
         {[
           { label: 'Infrastructure', color: '#FFFFFF' },
           { label: 'Access Point', color: '#0066FF' },
           { label: 'Standard Risk', color: '#FFBB00' },
           { label: 'Critical Path', color: '#FF3366' },
         ].map(item => (
           <div key={item.label} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }} />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{item.label}</span>
           </div>
         ))}
      </div>
    </div>
  );
};

export default NeuralAttackGraph;
