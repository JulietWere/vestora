import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export function AssetAllocationChart(canvasId) {
  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  canvas.className = 'w-full h-64';

  const data = {
    labels: ['Stocks', 'Bonds', 'Real Estate', 'Cash'],
    datasets: [
      {
        label: 'Asset Allocation',
        data: [50, 20, 20, 10],
        backgroundColor: [
          '#2563eb', // blue
          '#facc15', // yellow
          '#22c55e', // green
          '#f87171', // red
        ],
      },
    ],
  };

  const config = {
    type: 'pie',
    data,
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#1e293b' } },
      },
    },
  };

  new Chart(canvas, config);
  return canvas;
}
