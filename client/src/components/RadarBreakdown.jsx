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
import { useTheme } from "../context/ThemeContext.jsx";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const RadarBreakdown = ({ scores }) => {
  const { isLight } = useTheme();

  const accent = isLight ? "#8a6a45" : "#b08968";
  const data = {
    labels: ["Activity", "Quality", "Diversity", "Community", "Hiring"],
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
        borderColor: accent,
        backgroundColor: isLight
          ? "rgba(138, 106, 69, 0.18)"
          : "rgba(176, 137, 104, 0.2)",
        pointBackgroundColor: accent,
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: accent,
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
        ticks: { stepSize: 20, display: false },
        grid: {
          color: isLight
            ? "rgba(71, 85, 105, 0.2)"
            : "rgba(255, 255, 255, 0.1)",
        },
        angleLines: {
          color: isLight
            ? "rgba(71, 85, 105, 0.2)"
            : "rgba(255, 255, 255, 0.1)",
        },
        pointLabels: {
          color: isLight ? "#475569" : "#94a3b8",
          font: { family: "Inter", size: 12 },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isLight
          ? "rgba(255, 255, 255, 0.95)"
          : "rgba(15, 23, 42, 0.9)",
        titleColor: isLight ? "#111827" : "#fff",
        bodyColor: isLight ? "#334155" : "#cbd5e1",
        borderColor: isLight
          ? "rgba(148, 163, 184, 0.4)"
          : "rgba(255,255,255,0.1)",
        borderWidth: 1,
      },
    },
  };

  return (
    <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 to-stone-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 relative z-10 text-slate-200">
        <span className="w-2 h-6 bg-amber-500 rounded-full inline-block"></span>
        Radar Breakdown
      </h2>
      <div className="relative h-64 z-10">
        <Radar data={data} options={options} />
      </div>
    </section>
  );
};

export default RadarBreakdown;
