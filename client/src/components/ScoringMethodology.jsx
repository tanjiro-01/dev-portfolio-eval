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
    points: "Checks profile completeness such as bio, links, and contact visibility.",
  },
];

const ScoringMethodology = () => {
  return (
    <section className="@container bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-slate-200">
        <span className="w-2 h-6 bg-fuchsia-500 rounded-full inline-block"></span>
        How Scoring Works
      </h2>
      <p className="text-sm text-slate-400 mb-6">
        Deterministic and based exclusively on public GitHub signals.
      </p>
      <div className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-4">
        {scoringRules.map((rule) => (
          <article key={rule.title} className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-colors">
            <strong className="block text-slate-200 text-sm mb-1">{rule.title}</strong>
            <p className="text-xs text-slate-400 leading-relaxed">{rule.points}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ScoringMethodology;
