import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const RiskDistributionChart = ({ findings }) => {
  const counts = (findings || []).reduce((acc, f) => {
    const sev = f.severity?.toUpperCase() || 'INFO';
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {});

  const data = {
    labels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
    datasets: [
      {
        data: [
          counts['CRITICAL'] || 0,
          counts['HIGH'] || 0,
          counts['MEDIUM'] || 0,
          counts['LOW'] || 0,
          counts['INFO'] || 0,
        ],
        backgroundColor: [
          '#FF3366', // Critical
          '#FF6633', // High
          '#FFBB00', // Medium
          '#0066FF', // Low
          '#666666', // Info
        ],
        borderWidth: 0,
        hoverOffset: 15,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#888',
          font: { size: 10, weight: 'bold', family: 'JetBrains Mono' },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#0A0A0A',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      }
    },
    maintainAspectRatio: false,
    cutout: '65%',
  };

  return (
    <div className="h-[250px] relative">
      <Pie data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
         <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Active</span>
         <span className="text-3xl font-black text-white italic tracking-tighter">{(findings || []).length}</span>
      </div>
    </div>
  );
};

export default RiskDistributionChart;
