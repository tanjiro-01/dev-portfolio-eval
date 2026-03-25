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
              <small>
                {repo.language || "Unknown"} · ⭐ {repo.stars} · Forks {repo.forks}
              </small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RepoList;
