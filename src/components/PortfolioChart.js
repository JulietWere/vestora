import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export function PortfolioChart(canvasId) {
  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  canvas.className = 'w-full h-64';

  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Portfolio Value ($)',
        data: [1000, 1200, 1500, 1300, 1800, 2100],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const config = {
    type: 'line',
    data,
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#1e293b' } },
      },
      scales: {
        x: { ticks: { color: '#1e293b' }, grid: { color: '#e5e7eb' } },
        y: { ticks: { color: '#1e293b' }, grid: { color: '#e5e7eb' } },
      },
    },
  };

  new Chart(canvas, config);
  return canvas;
}
