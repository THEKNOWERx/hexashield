import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="cyber-panel flex flex-col justify-between h-44 group transition-all duration-500 relative overflow-hidden"
    >
      {/* Decorative background glow */}
      <div className="flex justify-between items-start relative z-10">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-black/40 border border-white/5 transition-all duration-300 group-hover:border-cyber-blue/40 shadow-2xl ${colorClass}`}>
          <Icon size={28} />
        </div>
        
        <div className="text-right flex flex-col">
          <span className="text-4xl font-black tracking-tighter text-white italic">
            {value}
          </span>
          <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest mt-1">
            Live Stream
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-6">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2 group-hover:text-white transition-colors">
          {title}
        </h4>
        <p className="text-[10px] text-gray-600 font-medium leading-tight h-8 overflow-hidden">
          {subtext}
        </p>
      </div>
      
      <div className={`absolute bottom-0 left-0 h-[3px] w-0 group-hover:w-full transition-all duration-700 ${colorClass.replace('text-', 'bg-')}`} />
    </motion.div>
  );
};

export default StatCard;
