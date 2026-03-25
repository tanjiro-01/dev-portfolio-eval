import {
  Chart as ChartJS,
  Filler,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const RadarBreakdown = ({ scores }) => {
  const data = {
    labels: ["Activity", "Code Quality", "Diversity", "Community", "Hiring"],
    datasets: [
      {
        label: "Score",
        data: [
          scores.activity,
          scores.codeQuality,
          scores.diversity,
          scores.community,
          scores.hiringReady,
        ],
        borderColor: "#0d6efd",
        backgroundColor: "rgba(13, 110, 253, 0.18)",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <section className="panel chart-panel">
      <h2>Radar Breakdown</h2>
      <div className="chart-box">
        <Radar data={data} options={options} />
      </div>
    </section>
  );
};

export default RadarBreakdown;
