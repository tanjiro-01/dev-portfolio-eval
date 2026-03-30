const scoreItems = [
  ["Activity", "activity"],
  ["Code Quality", "codeQuality"],
  ["Diversity", "diversity"],
  ["Community", "community"],
  ["Hiring Ready", "hiringReady"],
];

const CircularProgress = ({ score, max = 100 }) => {
  const percentage = (score / max) * 100;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        {/* Background circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#4CAF50"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: "bold", color: "#333" }}>
          {score}
        </div>
        <div style={{ fontSize: 12, color: "#999" }}>out of 100</div>
      </div>
    </div>
  );
};

const ScoreSummary = ({ scores }) => {
  return (
    <section className="panel">
      <h2>Score Summary</h2>
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}
      >
        <CircularProgress score={scores.overall} />
      </div>
      <div className="scores-grid">
        {scoreItems.map(([label, key]) => (
          <article key={key} className="score-item">
            <span>{label}</span>
            <strong>{scores[key]}</strong>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ScoreSummary;
