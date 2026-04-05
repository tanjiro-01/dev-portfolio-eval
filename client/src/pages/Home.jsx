import { useState } from "react";
import { useNavigate } from "react-router-dom";

import SearchForm from "../components/SearchForm.jsx";

const PRESET_STORAGE_KEY = "compare-presets-v1";

const Home = () => {
  const navigate = useNavigate();
  const [compareInput, setCompareInput] = useState("");
  const [compareUsers, setCompareUsers] = useState([]);
  const [savedPresets] = useState(() => {
    try {
      const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

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


  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCompareUser();
    }
  };

  const openCompare = () => {
    if (compareUsers.length < 2) {
      return;
    }

    navigate(`/compare?users=${compareUsers.join(",")}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-3xl relative z-10 flex flex-col gap-10">
        <header className="text-center">
          <p className="text-blue-500 font-bold tracking-widest uppercase text-sm mb-4">Developer Portfolio Evaluator</p>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 mb-6 tracking-tight">
            Score any GitHub profile in seconds
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Enter a username to generate a comprehensive report with activity, quality,
            diversity, community, and hiring-readiness scores.
          </p>
        </header>

        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
           <SearchForm onSubmit={handleSubmit} />
        </div>

        <section className="bg-slate-900/30 backdrop-blur-md border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-xl text-center w-full max-w-2xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-slate-200 mb-2">Quick Compare Builder</h2>
            <p className="text-slate-400 mb-8">
              Add two or more usernames to open compare mode with all profiles
              preloaded.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <input
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-[300px]"
                placeholder="Add username"
                value={compareInput}
                onChange={(event) => setCompareInput(event.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl px-6 py-3 font-semibold transition-colors"
                type="button"
                onClick={addCompareUser}
              >
                Add
              </button>
              <button
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white rounded-xl px-6 py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                type="button"
                onClick={openCompare}
                disabled={compareUsers.length < 2}
              >
                Compare {compareUsers.length || 0}
              </button>
            </div>

            {!!compareUsers.length && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {compareUsers.map((username) => (
                  <button
                    key={username}
                    type="button"
                    className="flex items-center gap-2 bg-blue-500/10 hover:bg-rose-500/20 text-blue-400 hover:text-rose-400 border border-blue-500/20 hover:border-rose-500/30 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
                    onClick={() => removeCompareUser(username)}
                    title="Click to remove"
                  >
                    {username} <span className="text-lg leading-none">&times;</span>
                  </button>
                ))}
              </div>
            )}

            <div className="pt-6 border-t border-slate-800/50">
              <button className="text-slate-400 hover:text-blue-400 text-sm font-medium transition-colors" onClick={() => navigate("/compare")}>
                Open Empty Compare Mode &rarr;
              </button>
            </div>

            {!!savedPresets.length && (
              <div className="mt-8 pt-6 border-t border-slate-800/50 text-left">
                <h3 className="text-slate-300 font-semibold mb-4 text-sm uppercase tracking-wider">Saved Presets</h3>
                <div className="flex flex-wrap gap-2">
                  {savedPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:text-indigo-300 text-slate-300 rounded-lg px-4 py-2 text-sm transition-colors"
                      onClick={() =>
                        navigate(`/compare?users=${preset.users.join(",")}`)
                      }
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Home;
