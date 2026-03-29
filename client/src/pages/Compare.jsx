import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { fetchProfileReport } from "../api/http.js";

const scoreRows = [
  ["Activity", "activity"],
  ["Code Quality", "codeQuality"],
  ["Diversity", "diversity"],
  ["Community", "community"],
  ["Hiring Ready", "hiringReady"],
  ["Overall", "overall"],
];

const parseUsersFromParams = (searchParams) => {
  const usersParam = searchParams.get("users") || "";
  const legacy = [searchParams.get("u1") || "", searchParams.get("u2") || ""];

  const raw = usersParam ? usersParam.split(",") : legacy.filter(Boolean);

  return [
    ...new Set(raw.map((value) => value.trim().toLowerCase()).filter(Boolean)),
  ];
};

const reorder = (items, from, to) => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

const Compare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryUsers = useMemo(
    () => parseUsersFromParams(searchParams),
    [searchParams],
  );

  const [inputUser, setInputUser] = useState("");
  const [users, setUsers] = useState(queryUsers);
  const [dragIndex, setDragIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reports, setReports] = useState([]);
  const [failedUsers, setFailedUsers] = useState([]);

  useEffect(() => {
    setUsers(queryUsers);
  }, [queryUsers]);

  const syncUsersToUrl = (nextUsers) => {
    const normalized = [
      ...new Set(
        nextUsers.map((value) => value.trim().toLowerCase()).filter(Boolean),
      ),
    ];
    const nextQuery = normalized.join(",");
    navigate(nextQuery ? `/compare?users=${nextQuery}` : "/compare");
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (queryUsers.length < 2) {
        setReports([]);
        setFailedUsers([]);
        setError("");
        return;
      }

      setLoading(true);
      setError("");
      setFailedUsers([]);

      try {
        const responses = await Promise.allSettled(
          queryUsers.map((username) => fetchProfileReport(username)),
        );

        if (!cancelled) {
          const loadedReports = [];
          const failed = [];

          responses.forEach((response, index) => {
            if (response.status === "fulfilled") {
              loadedReports.push(response.value);
              return;
            }

            failed.push(queryUsers[index]);
          });

          setReports(loadedReports);
          setFailedUsers(failed);

          if (loadedReports.length < 2) {
            setError("Need at least two valid users to compare.");
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setReports([]);
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
  }, [queryUsers]);

  const categoryWinners = useMemo(() => {
    const winners = {};

    scoreRows.forEach(([, key]) => {
      const values = reports
        .map((report) => ({
          username: report.username,
          score: report.scores?.[key] ?? 0,
        }))
        .sort((a, b) => b.score - a.score);

      if (!values.length) {
        winners[key] = [];
        return;
      }

      const topScore = values[0].score;
      winners[key] = values
        .filter((entry) => entry.score === topScore)
        .map((entry) => entry.username);
    });

    return winners;
  }, [reports]);

  const matrixColumns = useMemo(
    () =>
      `minmax(120px, 1fr) repeat(${Math.max(reports.length, 1)}, minmax(72px, 1fr)) minmax(140px, 1fr)`,
    [reports.length],
  );

  const handleAddUser = (event) => {
    event.preventDefault();

    const next = inputUser.trim().toLowerCase();
    if (!next || users.includes(next)) {
      return;
    }

    setInputUser("");
    syncUsersToUrl([...users, next]);
  };

  const removeUser = (username) => {
    syncUsersToUrl(users.filter((entry) => entry !== username));
  };

  const handleDrop = (toIndex) => {
    if (dragIndex < 0 || dragIndex === toIndex) {
      setDragIndex(-1);
      return;
    }

    const nextUsers = reorder(users, dragIndex, toIndex);
    setDragIndex(-1);
    syncUsersToUrl(nextUsers);
  };

  return (
    <main className="page">
      <header className="report-header">
        <div>
          <p className="eyebrow">Compare Mode</p>
          <h1>Compare multiple GitHub profiles</h1>
          <p className="muted">
            Add any number of usernames, drag cards to reorder, and compare all
            score categories side by side.
          </p>
        </div>
        <form className="compare-form" onSubmit={handleAddUser}>
          <input
            className="search-input"
            value={inputUser}
            placeholder="Add GitHub username"
            onChange={(event) => setInputUser(event.target.value)}
            disabled={loading}
          />
          <button className="search-button" type="submit" disabled={loading}>
            {loading ? "Loading..." : "Add User"}
          </button>
        </form>
        <p className="muted">
          Tip: drag cards below to reorder columns. Cards and table can be
          manually resized.
        </p>
      </header>

      {error && <p className="status error">{error}</p>}

      {!!failedUsers.length && (
        <p className="status error">Could not load: {failedUsers.join(", ")}</p>
      )}

      {!error && loading && <p className="status">Loading comparison...</p>}

      {!!users.length && (
        <section className="compare-grid">
          {users.map((username, index) => (
            <article
              key={username}
              className="compare-user-card compare-resizable"
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(index)}
            >
              <div>
                <strong>{username}</strong>
                <p className="muted">Drag to reorder</p>
              </div>
              <button
                className="link-button"
                type="button"
                onClick={() => removeUser(username)}
                disabled={loading}
              >
                Remove
              </button>
            </article>
          ))}
        </section>
      )}

      {!error && !loading && reports.length >= 2 && (
        <section className="panel">
          <h2>Comparison Matrix</h2>

          <div className="compare-table compare-resizable">
            <article
              className="compare-row compare-row-header"
              style={{ gridTemplateColumns: matrixColumns }}
            >
              <span className="compare-label">Category</span>
              {reports.map((report) => (
                <span key={report.username} className="compare-score">
                  {report.username}
                </span>
              ))}
              <span className="compare-vs">Winner(s)</span>
            </article>

            {scoreRows.map(([label, key]) => {
              const winners = categoryWinners[key] || [];
              const winnerText =
                winners.length > 1 ? winners.join(", ") : winners[0] || "n/a";

              return (
                <article
                  key={key}
                  className="compare-row"
                  style={{ gridTemplateColumns: matrixColumns }}
                >
                  <span className="compare-label">{label}</span>
                  {reports.map((report) => {
                    const score = report.scores?.[key] ?? 0;
                    const isWinner = winners.includes(report.username);

                    return (
                      <span
                        key={`${key}-${report.username}`}
                        className={`compare-score ${isWinner ? "winner" : ""}`}
                      >
                        {score}
                      </span>
                    );
                  })}
                  <span className="compare-vs">{winnerText}</span>
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
