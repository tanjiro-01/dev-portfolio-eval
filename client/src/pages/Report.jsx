import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { fetchProfileReport } from "../api/http.js";
import SearchForm from "../components/SearchForm.jsx";
import ReportSkeleton from "../components/ReportSkeleton.jsx";
import ReportLayout from "../components/ReportLayout.jsx";
import TopNav from "../components/TopNav.jsx";

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

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 min-h-screen">
        <TopNav />
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-500 font-bold mb-2">
              Report
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
                {normalizedUsername || "Unknown User"}
              </h1>
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all border ${
                  copied
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/50 hover:bg-blue-500/20"
                }`}
                title="Copy report link to clipboard"
              >
                {copied ? "✓ Copied!" : "📋 Copy Link"}
              </button>
            </div>
          </div>
          <div className="w-full md:w-auto md:min-w-[360px]">
            <SearchForm
              defaultValue={normalizedUsername}
              onSubmit={handleSearch}
              loading={loading}
            />
          </div>
        </header>

        {loading && <ReportSkeleton />}
        {!loading && error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl flex items-center gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && report && <ReportLayout report={report} />}
      </main>
    </>
  );
};

export default Report;
