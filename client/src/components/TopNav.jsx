import { Link, useLocation, useNavigate } from "react-router-dom";

const navLinkClass = (active) =>
  `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
    active
      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
      : "text-slate-300 border border-slate-700 hover:text-cyan-300 hover:border-cyan-500/40"
  }`;

const TopNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
          <span className="px-3 py-1.5 rounded-lg text-sm font-semibold text-cyan-200 border border-cyan-500/30 bg-cyan-500/10">
            Report
          </span>
        )}
      </div>

      {!onHome && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-200 border border-slate-700 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
        >
          Back
        </button>
      )}
    </nav>
  );
};

export default TopNav;
