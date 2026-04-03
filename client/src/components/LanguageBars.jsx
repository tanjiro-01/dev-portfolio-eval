import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

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
  if (!languages.length) {
    return (
      <section className="panel">
        <h2>Language Distribution</h2>
        <p className="muted">No language data available.</p>
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
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.x}% of repositories`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  return (
    <section className="panel">
      <h2>Language Distribution</h2>
      <div style={{ height: "300px", position: "relative" }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </section>
  );
};

export default LanguageBars;
