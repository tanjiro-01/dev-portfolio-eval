const scoringRules = [
  {
    title: "Activity (25%)",
    points: "Uses recent push activity and consistency over the last 90 days.",
  },
  {
    title: "Code Quality (20%)",
    points: "Rewards repos with README, license, topics, and test structure.",
  },
  {
    title: "Diversity (20%)",
    points: "Measures language spread and project type variety.",
  },
  {
    title: "Community (20%)",
    points: "Looks at stars, forks, and follower signals.",
  },
  {
    title: "Hiring Ready (15%)",
    points:
      "Checks profile completeness such as bio, links, and contact visibility.",
  },
];

const ScoringMethodology = () => {
  return (
    <section className="panel">
      <h2>How The Scoring Works</h2>
      <p className="muted">
        The report is deterministic and based only on public GitHub signals. No
        AI or manual override is used.
      </p>
      <div className="scoring-grid">
        {scoringRules.map((rule) => (
          <article key={rule.title} className="score-rule">
            <strong>{rule.title}</strong>
            <p className="muted">{rule.points}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ScoringMethodology;
