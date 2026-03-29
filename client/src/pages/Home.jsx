import { useState } from "react";
import { useNavigate } from "react-router-dom";

import SearchForm from "../components/SearchForm.jsx";

const Home = () => {
  const navigate = useNavigate();
  const [compareInput, setCompareInput] = useState("");
  const [compareUsers, setCompareUsers] = useState([]);

  const handleSubmit = (username) => {
    navigate(`/report/${username}`);
  };

  const addCompareUser = () => {
    const normalized = compareInput.trim().toLowerCase();
    if (!normalized || compareUsers.includes(normalized)) {
      return;
    }

    setCompareUsers((prev) => [...prev, normalized]);
    setCompareInput("");
  };

  const removeCompareUser = (username) => {
    setCompareUsers((prev) => prev.filter((value) => value !== username));
  };

  const openCompare = () => {
    if (compareUsers.length < 2) {
      return;
    }

    navigate(`/compare?users=${compareUsers.join(",")}`);
  };

  return (
    <main className="page page-home">
      <header>
        <p className="eyebrow">Developer Portfolio Evaluator</p>
        <h1>Score any GitHub profile in seconds</h1>
        <p className="muted">
          Enter a username to generate a report with activity, quality,
          diversity, community, and hiring-readiness scores.
        </p>
      </header>
      <SearchForm onSubmit={handleSubmit} />

      <section className="panel home-compare-panel">
        <h2>Quick Compare Builder</h2>
        <p className="muted">
          Add two or more usernames to open compare mode with all profiles
          preloaded.
        </p>
        <div className="home-compare-input-row">
          <input
            className="search-input"
            placeholder="Add username"
            value={compareInput}
            onChange={(event) => setCompareInput(event.target.value)}
          />
          <button
            className="search-button"
            type="button"
            onClick={addCompareUser}
          >
            Add
          </button>
          <button
            className="link-button"
            type="button"
            onClick={openCompare}
            disabled={compareUsers.length < 2}
          >
            Compare {compareUsers.length || 0} User(s)
          </button>
        </div>

        {!!compareUsers.length && (
          <div className="chip-row">
            {compareUsers.map((username) => (
              <button
                key={username}
                type="button"
                className="chip"
                onClick={() => removeCompareUser(username)}
              >
                {username} x
              </button>
            ))}
          </div>
        )}

        <button className="link-button" onClick={() => navigate("/compare")}>
          Open Empty Compare Mode
        </button>
      </section>
    </main>
  );
};

export default Home;
