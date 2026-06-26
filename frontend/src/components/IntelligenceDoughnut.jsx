"use client";
 
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Target, Activity } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const IntelligenceDoughnut = ({ findings = [] }) => {
  const safeFindings = Array.isArray(findings) ? findings : [];
  const counts = {
    Critical: safeFindings.filter(f => f.severity === 'Critical' || f.severity === 'CRITICAL').length,
    High: safeFindings.filter(f => f.severity === 'High' || f.severity === 'HIGH').length,
    Medium: safeFindings.filter(f => f.severity === 'Medium' || f.severity === 'MEDIUM').length,
    Low: safeFindings.filter(f => f.severity === 'Low' || f.severity === 'LOW').length
  };

  const data = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [counts.Critical, counts.High, counts.Medium, counts.Low],
      backgroundColor: [
        '#ff003c', // Critical Red
        '#ffb800', // High Orange
        '#f59e0b', // Medium Yellow (Darker)
        '#0047ff'  // Low Blue
      ],
      borderColor: '#0d0d0f',
      borderWidth: 4,
      hoverOffset: 12,
      cutout: '75%'
    }]
  };

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    maintainAspectRatio: false,
    responsive: true
  };

  const total = findings.length;

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="relative flex-1 flex items-center justify-center p-2">
        <div className="w-full h-full max-h-32">
          <Doughnut data={data} options={options} />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black font-mono tracking-tighter">{total}</span>
          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Total</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2 border-t border-white/5 pt-3">
        {Object.entries(counts).map(([label, count]) => (
          <div key={label} className="flex items-center gap-2">
             <div className={`w-1.5 h-1.5 rounded-full ${
               label === 'Critical' ? 'bg-cyber-alert' : 
               label === 'High' ? 'bg-cyber-warning' : 
               label === 'Medium' ? 'bg-yellow-600' : 'bg-cyber-blue'
             }`} />
             <div className="flex flex-col">
               <span className="text-[8px] text-gray-600 uppercase font-black tracking-widest">{label}</span>
               <span className="text-xs font-bold text-gray-300">{count} Findings</span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntelligenceDoughnut;
