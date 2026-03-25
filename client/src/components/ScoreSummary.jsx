const scoreItems = [
  ["Activity", "activity"],
  ["Code Quality", "codeQuality"],
  ["Diversity", "diversity"],
  ["Community", "community"],
  ["Hiring Ready", "hiringReady"],
];

const ScoreSummary = ({ scores }) => {
  return (
    <section className="panel">
      <h2>Score Summary</h2>
      <p className="muted">Overall: {scores.overall}/100</p>
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
