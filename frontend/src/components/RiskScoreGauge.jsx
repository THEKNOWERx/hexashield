/* eslint-disable no-unused-vars */
"use client";

import React from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const RiskScoreGauge = ({ score = 8.0, monitored = 1, criticals = 1, integrity = 28 }) => {
  const percentage = (score / 10) * 100;
  // For a half-circle, we use strokeDasharray where half is the circumference.
  // r = 70, circumference = 2 * PI * 70 = 439.8. Half = 219.9
  const radius = 70;
  const circumference = Math.PI * radius; 
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = (s) => {
    if (s >= 8) return '#ff003c'; // Alert Red
    if (s >= 5) return '#ffb800'; // Warning Yellow
    return '#39ff14'; // Neon Green
  };

  return (
    <div className="flex flex-col items-center h-full">
      <div className="flex items-center justify-between w-full mb-8">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-cyber-blue" />
           <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Security Posture</h4>
        </div>
        <Shield size={16} className="text-cyber-blue opacity-50" />
      </div>

      <div className="relative flex items-center justify-center mb-8">
        <svg className="w-64 h-32" viewBox="0 0 160 80">
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="#141416"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <motion.path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke={getColor(score)}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: percentage / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="filter drop-shadow-[0_0_10px_rgba(255,0,60,0.3)]"
          />
        </svg>
        
        <div className="absolute top-12 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl font-black font-mono tracking-tighter"
          >
            {score.toFixed(1)}
          </motion.span>
          <span className="text-[10px] text-cyber-alert font-black uppercase tracking-widest mt-1">Critical Risk</span>
        </div>
      </div>

      <div className="grid grid-cols-3 w-full border-t border-white/5 pt-6 mt-auto">
        <div className="flex flex-col items-center border-r border-white/5">
          <span className="text-lg font-black font-mono">{monitored}</span>
          <span className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Monitored</span>
        </div>
        <div className="flex flex-col items-center border-r border-white/5 text-cyber-alert">
          <span className="text-lg font-black font-mono">{criticals}</span>
          <span className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Criticals</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-black font-mono">{integrity}%</span>
          <span className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Integrity</span>
        </div>
      </div>
    </div>
  );
};

export default RiskScoreGauge;

