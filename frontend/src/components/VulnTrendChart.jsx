import React from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const VulnTrendChart = ({ findings }) => {
  // Generate mock trend data based on current findings for visualization
  const labels = ['T-60', 'T-45', 'T-30', 'T-15', 'T-05', 'T-Now'];
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Trend Index',
        data: [12, 19, 15, 25, 22, (findings || []).length],
        fill: true,
        borderColor: '#0066FF',
        backgroundColor: 'rgba(0, 102, 255, 0.05)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#0066FF',
        borderWidth: 2,
      }
    ],
  };

  const options = {
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
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.02)', borderColor: 'transparent' },
        ticks: { color: '#444', font: { size: 9, family: 'JetBrains Mono' } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#444', font: { size: 9, family: 'JetBrains Mono' } }
      }
    }
  };

  return (
    <div className="h-[250px]">
      <Line data={data} options={options} />
    </div>
  );
};

export default VulnTrendChart;
