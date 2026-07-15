import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = ['#4f46e5', '#818cf8', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899'];

const BreakdownDonutChart = ({ data = [] }) => {
  if (data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-ink-400 text-sm">No data yet</div>;
  }

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: PALETTE,
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 10, boxHeight: 10, padding: 12, font: { size: 12 }, color: '#334155' } },
      tooltip: { backgroundColor: '#0f172a', padding: 10, cornerRadius: 8 },
    },
  };

  return (
    <div className="h-56">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default BreakdownDonutChart;
