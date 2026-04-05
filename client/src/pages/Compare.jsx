import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";

import { fetchProfileReport } from "../api/http.js";
import ReportLayout from "../components/ReportLayout.jsx";

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
  ["#8b5cf6", "rgba(139, 92, 246, 0.2)"],
  ["#ec4899", "rgba(236, 72, 153, 0.2)"],
  ["#14b8a6", "rgba(20, 184, 166, 0.2)"],
  ["#3b82f6", "rgba(59, 130, 246, 0.2)"],
  ["#f59e0b", "rgba(245, 158, 11, 0.2)"],
  ["#10b981", "rgba(16, 185, 129, 0.2)"],
  ["#ef4444", "rgba(239, 68, 68, 0.2)"],
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

// Custom elegant resize handle for resizable panels
const ResizeHandle = () => (
  <PanelResizeHandle className="w-4 flex flex-col justify-center items-center group cursor-col-resize outline-none z-20">
    <div className="w-1 h-12 bg-slate-700/50 rounded-full group-hover:bg-blue-500 group-active:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-200" />
  </PanelResizeHandle>
);

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
  
  // Toggles for compare views
  const [sortByCategory, setSortByCategory] = useState(true);
  const [showOnlyScores, setShowOnlyScores] = useState(false); // Default to false to show the dynamic resizable windows
  
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    setUsers(queryUsers);
  }, [queryUsers]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
      if (!raw) return;

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
        pointBackgroundColor: borderColor,
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
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
        ticks: { stepSize: 20, display: false },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        angleLines: { color: "rgba(255, 255, 255, 0.1)" },
        pointLabels: {
          color: "#cbd5e1",
          font: { family: "Inter", size: 12 },
        },
      },
    },
    plugins: {
      legend: { position: "bottom", labels: { color: "#e2e8f0" } },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
      },
    },
  };

  const handleAddUser = (event) => {
    event.preventDefault();
    const next = inputUser.trim().toLowerCase();
    if (!next || users.includes(next)) return;
    setInputUser("");
    syncUsersToUrl([...users, next]);
  };

  const removeUser = (username) => {
    syncUsersToUrl(users.filter((entry) => entry !== username));
  };

  const savePreset = () => {
    const normalizedName = presetName.trim();
    if (!normalizedName || users.length < 2) return;

    const preset = { id: `${Date.now()}`, name: normalizedName, users };
    setPresets((prev) => [preset, ...prev].slice(0, 8));
    setPresetName("");
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
    <>
      <Helmet>
        <title>Compare Mode — Portfolio Evaluator</title>
      </Helmet>

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8 min-h-screen relative">
        <header className="flex flex-col xl:flex-row gap-8 xl:items-start justify-between">
          <div className="flex-1 max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-indigo-500 font-bold mb-2">Compare Mode</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 mb-3 tracking-tight">Compare multiple GitHub profiles</h1>
            <p className="text-slate-400 text-sm sm:text-base mb-6 leading-relaxed">
              Add any number of usernames, dynamically resize their windows, and compare all
              score categories side by side.
            </p>
            
            <form className="flex flex-col sm:flex-row gap-3 mb-4" onSubmit={handleAddUser}>
              <input
                className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-[200px]"
                value={inputUser}
                placeholder="Add GitHub username..."
                onChange={(event) => setInputUser(event.target.value)}
                disabled={loading}
              />
              <button 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl px-6 py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                type="submit" 
                disabled={loading}
              >
                {loading ? "Loading..." : "Add User"}
              </button>
            </form>
            <p className="text-slate-500 text-xs flex gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium hover:text-white transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-indigo-500 bg-slate-800 border-slate-600 focus:ring-indigo-500/50 cursor-pointer"
                  checked={showOnlyScores}
                  onChange={(e) => setShowOnlyScores(e.target.checked)}
                />
                Show only scores 
              </label>
              <span className="opacity-50">|</span>
              Drag cards to reorder panes
            </p>
          </div>

          <section className="flex-shrink-0 w-full xl:w-[450px] bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-slate-200 font-semibold mb-3 text-sm tracking-wide uppercase">Saved Compare Presets</h2>
            <div className="flex gap-2 mb-4">
              <input
                className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 flex-1"
                placeholder="Preset name"
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
              />
              <button
                className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                type="button"
                onClick={savePreset}
                disabled={users.length < 2 || !presetName.trim()}
              >
                Save Current
              </button>
            </div>
            {!presets.length ? (
              <p className="text-slate-500 text-sm italic">No presets saved yet.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                {presets.map((preset) => (
                  <article key={preset.id} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 flex justify-between items-center group">
                    <div className="min-w-0 pr-3">
                      <strong className="block text-slate-200 text-sm truncate">{preset.name}</strong>
                      <p className="text-slate-500 text-xs truncate">{preset.users.join(", ")}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300" onClick={() => syncUsersToUrl(preset.users)}>Load</button>
                      <button className="text-xs font-semibold text-rose-400 hover:text-rose-300" onClick={() => deletePreset(preset.id)}>Del</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </header>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl">
             {error}
          </div>
        )}

        {!!failedUsers.length && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 rounded-xl">
             Could not load: {failedUsers.join(", ")}
          </div>
        )}

        {!!users.length && (
          <section className="flex flex-wrap gap-3">
            {users.map((username, index) => (
              <article
                key={username}
                className="bg-slate-800/80 border border-slate-700 hover:border-slate-500 rounded-full pl-5 pr-2 py-2 flex items-center justify-between gap-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all"
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(index)}
              >
                <div>
                  <strong className="text-slate-200 text-sm font-semibold">{username}</strong>
                </div>
                <button
                  className="w-6 h-6 rounded-full bg-slate-700/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
                  type="button"
                  onClick={() => removeUser(username)}
                  disabled={loading}
                >
                  <span className="text-lg leading-none -mt-0.5">&times;</span>
                </button>
              </article>
            ))}
          </section>
        )}

        {!error && loading && reports.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-indigo-400 mt-4 font-medium tracking-wide">Loading comparison...</p>
            </div>
          </div>
        )}

        {!error && reports.length >= 2 && (
          <div className="flex-1 flex flex-col gap-8 outline-none mt-4">
            
            {!showOnlyScores ? (
               // Dynamic Resizable Windows (Leetcode style)
               <div className="h-[auto] w-full border border-slate-800/80 rounded-3xl bg-slate-900/20 p-2 sm:p-4 shadow-2xl relative">
                  <PanelGroup direction="horizontal" className="min-h-[800px] w-full rounded-2xl overflow-hidden">
                    {reports.map((report, index) => (
                      <React.Fragment key={report.username}>
                        {index > 0 && <ResizeHandle />}
                        <Panel minSize={20} defaultSize={100 / reports.length}>
                          <div className="h-full w-full bg-slate-950/60 overflow-y-auto overflow-x-hidden relative custom-scrollbar px-2 pb-8 rounded-xl border border-slate-800/50">
                            {/* Panel header acting as dragger hint */}
                            <div className="sticky top-0 z-50 pt-4 pb-2 bg-slate-950/90 backdrop-blur-md mb-2 flex justify-between items-center border-b border-slate-800/60">
                               <h3 className="font-bold text-slate-200 flex items-center gap-2">
                                  <img src={report.avatarUrl} className="w-6 h-6 rounded-full" alt="avatar" />
                                  {report.username}
                               </h3>
                               <span className="text-[10px] uppercase text-slate-500 tracking-widest font-semibold bg-slate-800 px-2 py-0.5 rounded">Profile View</span>
                            </div>
                            <ReportLayout report={report} />
                          </div>
                        </Panel>
                      </React.Fragment>
                    ))}
                  </PanelGroup>
               </div>
            ) : (
               // Matrix and Radar View (Show Only Scores)
               <div className="grid xl:grid-cols-2 gap-8">
                  <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col">
                    <h2 className="text-xl font-bold text-slate-200 mb-2 flex items-center gap-2">
                       <span className="w-2 h-6 bg-purple-500 rounded-full inline-block"></span>
                       Multi-User Radar Overlay
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">
                      Visually scan for strongest profile across all vectors.
                    </p>
                    <div className="flex-1 min-h-[400px] relative">
                      <Radar data={radarData} options={radarOptions} />
                    </div>
                  </section>

                  <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-6 bg-emerald-500 rounded-full inline-block"></span>
                        Comparison Matrix
                      </h2>
                      <label className="flex items-center gap-2 text-sm text-slate-300 font-medium cursor-pointer hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-600 focus:ring-emerald-500/50"
                          checked={sortByCategory}
                          onChange={(event) => setSortByCategory(event.target.checked)}
                        />
                        Target-sorted rows
                      </label>
                    </div>

                    <div className="flex flex-col gap-3 flex-1 overflow-x-auto">
                      {scoreRows.map(([label, key]) => {
                        const winners = categoryWinners[key] || [];
                        const winnerText = winners.length > 1 ? winners.join(", ") : winners[0] || "n/a";

                        const rowReports = sortByCategory
                          ? [...reports].sort((a, b) => (b.scores?.[key] ?? 0) - (a.scores?.[key] ?? 0))
                          : reports;

                        return (
                          <article key={key} className="flex flex-col xl:flex-row gap-4 items-center bg-slate-800/40 hover:bg-slate-800/80 transition-colors border border-slate-700/50 rounded-2xl p-4">
                            <span className="text-slate-300 font-bold w-full xl:w-32 flex-shrink-0 text-sm xl:text-base uppercase tracking-wider">{label}</span>
                            <div className="flex-1 flex flex-wrap gap-2 w-full">
                              {rowReports.map((report) => {
                                const score = report.scores?.[key] ?? 0;
                                const isWinner = winners.includes(report.username);

                                return (
                                  <div
                                    key={`${key}-${report.username}`}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700/50 text-sm font-medium transition-all ${
                                      isWinner 
                                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                                        : "bg-slate-800 text-slate-400"
                                    }`}
                                  >
                                    <span className="opacity-80">{report.username}</span>
                                    <strong className={isWinner ? "text-emerald-400" : "text-slate-200"}>{score}</strong>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="w-full xl:w-32 flex-shrink-0 text-left xl:text-right">
                               <span className="text-xs text-slate-500 uppercase font-semibold">Winner</span>
                               <p className="text-indigo-400 font-bold text-sm truncate">{winnerText}</p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
               </div>
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default Compare;
