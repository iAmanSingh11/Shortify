import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const BarBreakdownChart = ({ data = [] }) => {
  if (data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-ink-400 text-sm">No data yet</div>;
  }

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: '#818cf8',
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', padding: 10, cornerRadius: 8 } },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b', font: { size: 11 }, precision: 0 } },
      y: { grid: { display: false }, ticks: { color: '#334155', font: { size: 12 } } },
    },
  };

  return (
    <div style={{ height: Math.max(56 * data.length, 160) }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default BarBreakdownChart;
