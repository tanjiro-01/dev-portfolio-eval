import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { fetchProfileReport } from "../api/http.js";
import SearchForm from "../components/SearchForm.jsx";
import ScoreSummary from "../components/ScoreSummary.jsx";
import RepoList from "../components/RepoList.jsx";

const Report = () => {
  const { username = "" } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizedUsername = useMemo(() => username.trim().toLowerCase(), [username]);

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

  return (
    <main className="page">
      <header className="report-header">
        <div>
          <p className="eyebrow">Report</p>
          <h1>{normalizedUsername || "Unknown User"}</h1>
        </div>
        <SearchForm defaultValue={normalizedUsername} onSubmit={handleSearch} loading={loading} />
      </header>

      {loading && <p className="status">Loading profile report...</p>}
      {!loading && error && <p className="status error">{error}</p>}

      {!loading && !error && report && (
        <section className="report-layout">
          <section className="panel profile-panel">
            <img src={report.avatarUrl} alt={`${report.username} avatar`} className="avatar" />
            <div>
              <h2>{report.name || report.username}</h2>
              <p className="muted">Followers: {report.followers} · Public repos: {report.publicRepos}</p>
              <p>{report.bio || "No bio available."}</p>
              <p className="muted">
                Cache: {report.cache?.hit ? "hit" : "miss"}
              </p>
            </div>
          </section>

          <ScoreSummary scores={report.scores} />
          <RepoList repos={report.topRepos} />
        </section>
      )}
    </main>
  );
};

export default Report;
