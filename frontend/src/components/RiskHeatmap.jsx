"use client";
import React from 'react';
import { motion } from 'framer-motion';

const RiskHeatmap = ({ data }) => {
  // Generate a 10x4 tactical grid for the heatmap
  const grid = Array.from({ length: 40 });
  
  // Custom colors index for risk levels
  const getCellColor = (index) => {
    if (index % 7 === 0) return 'bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
    if (index % 5 === 0) return 'bg-orange-500/60 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
    if (index % 3 === 0) return 'bg-cyber-blue/40 shadow-[0_0_10px_rgba(0,113,255,0.2)]';
    return 'bg-white/[0.03] border border-white/5';
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Global Heatmap Matrix</span>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-sm bg-red-500"/><span className="text-[7px] text-gray-500 font-bold uppercase">Critical</span></div>
           <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-sm bg-cyber-blue"/><span className="text-[7px] text-gray-500 font-bold uppercase">Stable</span></div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-10 gap-1.5">
        {grid.map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.01, duration: 0.5 }}
            className={`rounded-sm transition-all duration-500 hover:scale-110 cursor-crosshair ${getCellColor(i)}`}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-between items-end border-t border-white/5 pt-4">
         <div className="space-y-1">
            <div className="text-[8px] font-black text-gray-700 uppercase">Surface Vulnerability Index</div>
            <div className="text-xl font-black text-white italic tracking-tighter">74.8<span className="text-[10px] text-cyber-blue ml-1.5 uppercase not-italic">PHI</span></div>
         </div>
         <div className="w-24 h-6 bg-white/[0.02] border border-white/5 rounded-full overflow-hidden relative">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: '74%' }}
               transition={{ duration: 1.5, ease: "easeOut" }}
               className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyber-blue to-cyber-neon"
            />
         </div>
      </div>
    </div>
  );
};

export default RiskHeatmap;
