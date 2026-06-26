"use client";
import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass = 'text-cyber-blue', trend }) => {
  const bgTint = colorClass.replace('text-', 'bg-') + '/10';
  const borderTint = colorClass.replace('text-', 'border-') + '/20';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="stat-card flex flex-col gap-5"
    >
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgTint} border ${borderTint} ${colorClass}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
        {trend && (
          <span className="text-xs font-semibold text-gray-500">{trend}</span>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold tracking-tight text-white tabular-nums">{value}</div>
        <h4 className="text-sm font-semibold text-gray-300 mt-1.5">{title}</h4>
        {subtext && <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>}
      </div>
    </motion.div>
  );
};

export default StatCard;
