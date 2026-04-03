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
    <section className="panel">
      <h2>Top Repositories</h2>
      {!repos.length ? (
        <p className="muted">No repositories available.</p>
      ) : (
        <ul className="repo-list">
          {repos.map((repo) => (
            <li key={repo.url} className="repo-item">
              <a href={repo.url} target="_blank" rel="noreferrer">
                {repo.name}
              </a>
              <p>{repo.description || "No description"}</p>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {repo.language && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      backgroundColor: getLanguageColor(repo.language),
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "#fff",
                        opacity: 0.7,
                      }}
                    />
                    {repo.language}
                  </span>
                )}
                <small style={{ color: "#666" }}>
                  ⭐ {repo.stars} · Forks {repo.forks}
                </small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RepoList;
