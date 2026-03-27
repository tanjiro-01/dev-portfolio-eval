import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { fetchCompareReports } from "../api/http.js";

const scoreRows = [
  ["Activity", "activity"],
  ["Code Quality", "codeQuality"],
  ["Diversity", "diversity"],
  ["Community", "community"],
  ["Hiring Ready", "hiringReady"],
  ["Overall", "overall"],
];

const Compare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const u1 = searchParams.get("u1") || "";
  const u2 = searchParams.get("u2") || "";

  const [leftUser, setLeftUser] = useState(u1);
  const [rightUser, setRightUser] = useState(u2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const normalized = useMemo(
    () => ({ left: u1.trim().toLowerCase(), right: u2.trim().toLowerCase() }),
    [u1, u2],
  );

  useEffect(() => {
    setLeftUser(u1);
    setRightUser(u2);
  }, [u1, u2]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!normalized.left || !normalized.right) {
        setResult(null);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchCompareReports(
          normalized.left,
          normalized.right,
        );
        if (!cancelled) {
          setResult(data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setResult(null);
          setError(
            requestError?.response?.data?.message ||
              "Failed to compare users. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [normalized.left, normalized.right]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const left = leftUser.trim().toLowerCase();
    const right = rightUser.trim().toLowerCase();
    if (!left || !right) {
      return;
    }

    navigate(`/compare?u1=${left}&u2=${right}`);
  };

  const left = result?.users?.[0];
  const right = result?.users?.[1];

  return (
    <main className="page">
      <header className="report-header">
        <div>
          <p className="eyebrow">Compare Mode</p>
          <h1>Compare two GitHub profiles</h1>
          <p className="muted">
            Enter two usernames to compare score categories and detect winners.
          </p>
        </div>
        <form className="compare-form" onSubmit={handleSubmit}>
          <input
            className="search-input"
            value={leftUser}
            placeholder="First username"
            onChange={(event) => setLeftUser(event.target.value)}
            disabled={loading}
          />
          <input
            className="search-input"
            value={rightUser}
            placeholder="Second username"
            onChange={(event) => setRightUser(event.target.value)}
            disabled={loading}
          />
          <button className="search-button" type="submit" disabled={loading}>
            {loading ? "Comparing..." : "Compare"}
          </button>
        </form>
      </header>

      {error && <p className="status error">{error}</p>}

      {!error && loading && <p className="status">Loading comparison...</p>}

      {!error && !loading && left && right && (
        <section className="panel">
          <h2>
            {left.username} vs {right.username}
          </h2>
          <div className="compare-grid">
            <article className="compare-user-card">
              <img
                className="avatar"
                src={left.avatarUrl}
                alt={`${left.username} avatar`}
              />
              <strong>{left.username}</strong>
            </article>
            <article className="compare-user-card">
              <img
                className="avatar"
                src={right.avatarUrl}
                alt={`${right.username} avatar`}
              />
              <strong>{right.username}</strong>
            </article>
          </div>

          <div className="compare-table">
            {scoreRows.map(([label, key]) => {
              const winner = result?.winners?.[key] || "tie";
              const leftWinner = winner === left.username;
              const rightWinner = winner === right.username;
              const tie = winner === "tie";

              return (
                <article key={key} className="compare-row">
                  <span className="compare-label">{label}</span>
                  <span
                    className={`compare-score ${leftWinner ? "winner" : ""}`}
                  >
                    {left.scores[key]}
                  </span>
                  <span className="compare-vs">{tie ? "Tie" : winner}</span>
                  <span
                    className={`compare-score ${rightWinner ? "winner" : ""}`}
                  >
                    {right.scores[key]}
                  </span>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
};

export default Compare;
