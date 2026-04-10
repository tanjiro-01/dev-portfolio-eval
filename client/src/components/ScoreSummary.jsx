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
    <div className="relative w-40 h-40">
      <svg width="160" height="160" className="-rotate-90">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          className="stroke-slate-800"
          strokeWidth="8"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="url(#elegant-gradient)"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient
            id="elegant-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#a47149" />
            <stop offset="100%" stopColor="#d4b483" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-stone-300">
          {score}
        </div>
        <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">
          out of 100
        </div>
      </div>
    </div>
  );
};

const ScoreSummary = ({ scores }) => {
  return (
    <section className="@container bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 to-stone-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 relative z-10 text-slate-200">
        <span className="w-2 h-6 bg-amber-500 rounded-full inline-block"></span>
        Score Summary
      </h2>
      <div className="flex justify-center mb-8 relative z-10">
        <CircularProgress score={scores.overall} />
      </div>
      <div className="grid grid-cols-2 @md:grid-cols-3 gap-3 relative z-10">
        {scoreItems.map(([label, key]) => (
          <article
            key={key}
            className="flex flex-col @sm:flex-row justify-between @sm:items-center bg-slate-800/40 hover:bg-slate-800/80 transition-colors border border-slate-700/50 rounded-xl p-3 shadow-inner"
          >
            <span className="text-sm text-slate-400 mb-1 @sm:mb-0">
              {label}
            </span>
            <strong className="text-lg font-mono text-slate-200">
              {scores[key]}
            </strong>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ScoreSummary;
