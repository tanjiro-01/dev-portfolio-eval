import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";

const navLinkClass = (active) =>
  `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
    active
      ? "bg-amber-500/15 text-amber-200 border border-amber-400/40"
      : "text-slate-300 border border-slate-700 hover:text-amber-200 hover:border-amber-500/40"
  }`;

const TopNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLight, toggleTheme } = useTheme();

  const onHome = location.pathname === "/";
  const onCompare = location.pathname.startsWith("/compare");
  const onReport = location.pathname.startsWith("/report/");

  return (
    <nav className="w-full flex flex-wrap items-center justify-between gap-3 pb-2">
      <div className="flex items-center gap-2">
        <Link to="/" className={navLinkClass(onHome)}>
          Home
        </Link>
        <Link to="/compare" className={navLinkClass(onCompare)}>
          Compare
        </Link>
        {onReport && (
          <span className="px-3 py-1.5 rounded-lg text-sm font-semibold text-amber-100 border border-amber-500/30 bg-amber-500/10">
            Report
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-200 border border-slate-700 hover:border-amber-500/40 hover:text-amber-200 transition-colors"
          title="Toggle light/dark mode"
        >
          {isLight ? "Dark" : "Light"}
        </button>

        {!onHome && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-200 border border-slate-700 hover:border-amber-500/40 hover:text-amber-200 transition-colors"
          >
            Back
          </button>
        )}
      </div>
    </nav>
  );
};

export default TopNav;
