"use client";
﻿/* eslint-disable no-unused-vars */
import React from 'react';
import { motion } from 'framer-motion';

const CyberCard = ({ children, title, icon: Icon, className = "" }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`cyber-panel relative overflow-hidden group ${className}`}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-cyber-blue opacity-50 group-hover:bg-cyber-neon transition-colors duration-300" />
      
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold tracking-tight text-white/90">{title}</h3>
          {Icon && <Icon className="text-cyber-blue group-hover:text-cyber-neon transition-colors duration-300" size={20} />}
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Decorative corner glow */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-cyber-blue/10 blur-3xl rounded-full group-hover:bg-cyber-neon/20 transition-colors duration-500" />
    </motion.div>
  );
};

export default CyberCard;

