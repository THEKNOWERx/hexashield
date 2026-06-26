"use client";
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend
);

const ServiceRiskChart = ({ findings }) => {
  // Aggregate findings by port/service
  const serviceCounts = (findings || []).reduce((acc, f) => {
    const service = f.name?.split(' ')[0] || 'Unknown';
    acc[service] = (acc[service] || 0) + 1;
    return acc;
  }, {});

  // Sort and take top 5
  const sortedServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const data = {
    labels: sortedServices.map(s => s[0]),
    datasets: [
      {
        label: 'Risk Nodes',
        data: sortedServices.map(s => s[1]),
        backgroundColor: '#FF3366',
        borderRadius: 4,
        barThickness: 20,
      }
    ],
  };

  const options = {
    indexAxis: 'y', // Horizontal orientation
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0A0A0A',
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.02)', borderColor: 'transparent' },
        ticks: { color: '#444', font: { size: 9, family: 'JetBrains Mono' } }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#AAA', font: { size: 10, weight: 'bold', family: 'Inter' } }
      }
    }
  };

  return (
    <div className="h-[250px]">
      <Bar data={data} options={options} />
    </div>
  );
};

export default ServiceRiskChart;
