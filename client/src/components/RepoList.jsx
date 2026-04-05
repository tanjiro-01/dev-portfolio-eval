// Map programming languages to colors (GitHub-style)
const languageColors = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00add8",
  Rust: "#ce422b",
  PHP: "#777bb4",
  Ruby: "#cc342d",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#239120",
  Swift: "#FA7343",
  Kotlin: "#7F52FF",
  Shell: "#89e051",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Vue: "#2c3e50",
  React: "#61dafb",
};

const getLanguageColor = (language) => {
  return languageColors[language] || "#ccc";
};

const RepoList = ({ repos = [] }) => {
  return (
    <section className="@container bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-200">
        <span className="w-2 h-6 bg-rose-500 rounded-full inline-block"></span>
        Top Repositories
      </h2>
      {!repos.length ? (
        <p className="text-sm text-slate-400">No repositories available.</p>
      ) : (
        <ul className="grid grid-cols-1 @md:grid-cols-2 gap-4">
          {repos.map((repo) => (
            <li key={repo.url} className="flex flex-col bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-800 hover:border-slate-600 transition duration-300 shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-700/50 group-hover:bg-rose-500 transition duration-300"></div>
              <a href={repo.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 font-semibold text-[15px] hover:underline flex items-center gap-2">
                <span>{repo.name}</span>
                <svg className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <p className="text-sm text-slate-400 mt-2 mb-4 line-clamp-2 leading-relaxed flex-1">{repo.description || "No description provided."}</p>
              
              <div className="flex items-center flex-wrap gap-4 mt-auto">
                {repo.language && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700/50 px-2 py-1 rounded-md">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: getLanguageColor(repo.language) }}
                    />
                    {repo.language}
                  </span>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1" title="Stars">
                    ⭐ {repo.stars}
                  </span>
                  <span className="flex items-center gap-1" title="Forks">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"></path></svg>
                    {repo.forks}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RepoList;
