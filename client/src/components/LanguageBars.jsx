import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { useTheme } from "../context/ThemeContext.jsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Language color palette
const languageColors = {
  JavaScript: "rgb(241, 224, 90)",
  TypeScript: "rgb(49, 120, 198)",
  Python: "rgb(53, 114, 165)",
  Java: "rgb(176, 114, 25)",
  Go: "rgb(0, 173, 216)",
  Rust: "rgb(206, 66, 43)",
  PHP: "rgb(119, 123, 180)",
  Ruby: "rgb(204, 52, 45)",
  "C++": "rgb(243, 75, 125)",
  C: "rgb(85, 85, 85)",
  "C#": "rgb(35, 145, 32)",
  Swift: "rgb(250, 115, 67)",
  Kotlin: "rgb(127, 82, 255)",
  Shell: "rgb(137, 224, 81)",
  CSS: "rgb(86, 61, 124)",
  HTML: "rgb(227, 76, 38)",
  Vue: "rgb(44, 62, 80)",
  React: "rgb(97, 218, 251)",
};

const getLanguageColor = (language) => {
  return languageColors[language] || "rgb(150, 150, 150)";
};

const LanguageBars = ({ languages = [] }) => {
  const { isLight } = useTheme();

  if (!languages.length) {
    return (
      <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-slate-200">
          <span className="w-2 h-6 bg-orange-500 rounded-full inline-block"></span>
          Language Distribution
        </h2>
        <p className="text-sm text-slate-400">No language data available.</p>
      </section>
    );
  }

  const chartData = {
    labels: languages.map((l) => l.name),
    datasets: [
      {
        label: "Percentage of Repositories",
        data: languages.map((l) => l.percent),
        backgroundColor: languages.map((l) => getLanguageColor(l.name)),
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isLight ? "rgba(255,255,255,0.95)" : "rgba(15, 23, 42, 0.9)",
        titleColor: isLight ? "#111827" : "#fff",
        bodyColor: isLight ? "#334155" : "#cbd5e1",
        borderColor: isLight ? "rgba(148, 163, 184, 0.4)" : "rgba(255,255,255,0.1)",
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.parsed.x}% of repositories`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: { color: isLight ? "rgba(148, 163, 184, 0.25)" : "rgba(255, 255, 255, 0.05)" },
        ticks: {
          color: isLight ? "#475569" : "#94a3b8",
          callback: (value) => `${value}%`,
          font: { family: "Inter" }
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: isLight ? "#334155" : "#cbd5e1",
          font: { family: "Inter", weight: "500" }
        }
      }
    },
  };

  return (
    <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative group overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 relative z-10 text-slate-200">
        <span className="w-2 h-6 bg-orange-500 rounded-full inline-block"></span>
        Language Distribution
      </h2>
      <div className="relative h-64 z-10 pl-2">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </section>
  );
};

export default LanguageBars;
