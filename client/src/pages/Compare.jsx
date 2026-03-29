import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { Radar } from "react-chartjs-2";

import { fetchProfileReport } from "../api/http.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const scoreRows = [
  ["Activity", "activity"],
  ["Code Quality", "codeQuality"],
  ["Diversity", "diversity"],
  ["Community", "community"],
  ["Hiring Ready", "hiringReady"],
  ["Overall", "overall"],
];

const PRESET_STORAGE_KEY = "compare-presets-v1";

const radarColors = [
  ["#0d6efd", "rgba(13, 110, 253, 0.14)"],
  ["#198754", "rgba(25, 135, 84, 0.14)"],
  ["#dc3545", "rgba(220, 53, 69, 0.14)"],
  ["#fd7e14", "rgba(253, 126, 20, 0.14)"],
  ["#6f42c1", "rgba(111, 66, 193, 0.14)"],
  ["#20c997", "rgba(32, 201, 151, 0.14)"],
  ["#d63384", "rgba(214, 51, 132, 0.14)"],
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
  const [sortByCategory, setSortByCategory] = useState(true);
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    setUsers(queryUsers);
  }, [queryUsers]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setPresets(parsed);
      }
    } catch {
      setPresets([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

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

  const radarData = useMemo(() => {
    const labels = scoreRows.map(([label]) => label);
    const datasets = reports.map((report, index) => {
      const [borderColor, backgroundColor] =
        radarColors[index % radarColors.length];

      return {
        label: report.username,
        data: scoreRows.map(([, key]) => report.scores?.[key] ?? 0),
        borderColor,
        backgroundColor,
        borderWidth: 2,
      };
    });

    return { labels, datasets };
  }, [reports]);

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          backdropColor: "transparent",
        },
      },
    },
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

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

  const savePreset = () => {
    const normalizedName = presetName.trim();
    if (!normalizedName || users.length < 2) {
      return;
    }

    const preset = {
      id: `${Date.now()}`,
      name: normalizedName,
      users,
    };

    setPresets((prev) => [preset, ...prev].slice(0, 8));
    setPresetName("");
  };

  const applyPreset = (presetUsers) => {
    syncUsersToUrl(presetUsers);
  };

  const deletePreset = (id) => {
    setPresets((prev) => prev.filter((preset) => preset.id !== id));
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

        <section className="panel compare-presets-panel">
          <h2>Saved Compare Presets</h2>
          <div className="compare-presets-form">
            <input
              className="search-input"
              placeholder="Preset name"
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
            />
            <button
              className="link-button"
              type="button"
              onClick={savePreset}
              disabled={users.length < 2}
            >
              Save Current Users
            </button>
          </div>
          {!presets.length ? (
            <p className="muted">No presets saved yet.</p>
          ) : (
            <div className="preset-list">
              {presets.map((preset) => (
                <article key={preset.id} className="preset-item">
                  <div>
                    <strong>{preset.name}</strong>
                    <p className="muted">{preset.users.join(", ")}</p>
                  </div>
                  <div className="preset-actions">
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => applyPreset(preset.users)}
                    >
                      Load
                    </button>
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => deletePreset(preset.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
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
        <>
          <section className="panel chart-panel">
            <h2>Multi-User Radar Overlay</h2>
            <p className="muted">
              Use this overlay for quick visual winner scanning across all score categories.
            </p>
            <div className="chart-box">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </section>

          <section className="panel">
            <div className="compare-matrix-header">
              <h2>Comparison Matrix</h2>
              <label className="compare-sort-toggle">
                <input
                  type="checkbox"
                  checked={sortByCategory}
                  onChange={(event) => setSortByCategory(event.target.checked)}
                />
                Highest-first sorting per category
              </label>
            </div>

            <div className="compare-table compare-resizable">
              {scoreRows.map(([label, key]) => {
                const winners = categoryWinners[key] || [];
                const winnerText =
                  winners.length > 1 ? winners.join(", ") : winners[0] || "n/a";

                const rowReports = sortByCategory
                  ? [...reports].sort(
                      (a, b) =>
                        (b.scores?.[key] ?? 0) - (a.scores?.[key] ?? 0),
                    )
                  : reports;

                return (
                  <article key={key} className="compare-row compare-row-rich">
                    <span className="compare-label">{label}</span>
                    <div className="compare-row-values">
                      {rowReports.map((report) => {
                        const score = report.scores?.[key] ?? 0;
                        const isWinner = winners.includes(report.username);

                        return (
                          <div
                            key={`${key}-${report.username}`}
                            className={`compare-score-chip ${isWinner ? "winner" : ""}`}
                          >
                            <span>{report.username}</span>
                            <strong>{score}</strong>
                          </div>
                        );
                      })}
                    </div>
                    <span className="compare-vs">{winnerText}</span>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default Compare;
