import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { fetchProfileReport } from "../api/http.js";
import SearchForm from "../components/SearchForm.jsx";
import ScoreSummary from "../components/ScoreSummary.jsx";
import RepoList from "../components/RepoList.jsx";
import RadarBreakdown from "../components/RadarBreakdown.jsx";
import LanguageBars from "../components/LanguageBars.jsx";
import HeatMap from "../components/HeatMap.jsx";
import ScoringMethodology from "../components/ScoringMethodology.jsx";
import ReportSkeleton from "../components/ReportSkeleton.jsx";

const Report = () => {
  const { username = "" } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const normalizedUsername = useMemo(
    () => username.trim().toLowerCase(),
    [username],
  );

  // Update document title when username or report loads
  useEffect(() => {
    if (normalizedUsername) {
      document.title = `${normalizedUsername} — Portfolio Evaluator`;
    }
    return () => {
      document.title = "Portfolio Evaluator";
    };
  }, [normalizedUsername]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchProfileReport(normalizedUsername);
        if (!cancelled) {
          setReport(data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setReport(null);
          setError(
            requestError?.response?.data?.message ||
              "Failed to fetch report. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (normalizedUsername) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [normalizedUsername]);

  const handleSearch = (nextUsername) => {
    navigate(`/report/${nextUsername}`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the report link. Please copy it manually.");
    }
  };

  return (
    <>
      <Helmet>
        <title>{normalizedUsername} — Portfolio Evaluator</title>
        <meta
          name="description"
          content={`${normalizedUsername}'s developer portfolio evaluated on activity, code quality, diversity, and community impact.`}
        />
        <meta
          property="og:title"
          content={`${normalizedUsername}'s Developer Portfolio`}
        />
        <meta
          property="og:description"
          content={`Overall Score: ${report?.scores?.overall || 0}/100`}
        />
        {report?.avatarUrl && (
          <meta property="og:image" content={report.avatarUrl} />
        )}
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content={`${normalizedUsername}'s Portfolio`}
        />
      </Helmet>

      <main className="page">
        <header className="report-header">
          <div>
            <p className="eyebrow">Report</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1>{normalizedUsername || "Unknown User"}</h1>
              <button
                onClick={handleCopyLink}
                style={{
                  padding: "8px 12px",
                  fontSize: 14,
                  backgroundColor: copied ? "#4CAF50" : "#2196F3",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                title="Copy report link to clipboard"
              >
                {copied ? "✓ Copied" : "📋 Copy Link"}
              </button>
            </div>
          </div>
          <SearchForm
            defaultValue={normalizedUsername}
            onSubmit={handleSearch}
            loading={loading}
          />
        </header>

        {loading && <ReportSkeleton />}
        {!loading && error && <p className="status error">{error}</p>}

        {!loading && !error && report && (
          <section className="report-layout">
            <section className="panel profile-panel">
              <img
                src={report.avatarUrl}
                alt={`${report.username} avatar`}
                className="avatar"
              />
              <div>
                <h2>{report.name || report.username}</h2>
                <p className="muted">
                  Followers: {report.followers} · Public repos:{" "}
                  {report.publicRepos}
                </p>
                {report.createdAt && (
                  <p className="muted">
                    Joined: {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                )}
                <p>{report.bio || "No bio available."}</p>
                <p className="muted">
                  Cache: {report.cache?.hit ? "hit" : "miss"}
                </p>
              </div>
            </section>

            <ScoreSummary scores={report.scores} />
            <ScoringMethodology />
            <RadarBreakdown scores={report.scores} />
            <LanguageBars languages={report.languages} />
            <HeatMap heatmapData={report.heatmapData} />
            <RepoList repos={report.topRepos} />
          </section>
        )}
      </main>
    </>
  );
};

export default Report;
