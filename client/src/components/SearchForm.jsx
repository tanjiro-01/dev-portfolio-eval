import { useState } from "react";

const SearchForm = ({ defaultValue = "", onSubmit, loading }) => {
  const [username, setUsername] = useState(defaultValue);

  const handleSubmit = (event) => {
    event.preventDefault();

    const value = username.trim();
    if (!value) {
      return;
    }

    onSubmit(value);
  };

  return (
    <form
      className="w-full grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3"
      onSubmit={handleSubmit}
    >
      <input
        className="w-full bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl text-base px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-inner disabled:opacity-50"
        placeholder="Enter GitHub username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        disabled={loading}
      />
      <button
        className="flex items-center justify-center gap-2 bg-gradient-to-r from-stone-700 to-zinc-600 hover:from-stone-600 hover:to-zinc-500 text-amber-100 font-semibold rounded-xl px-6 py-3 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/25 disabled:opacity-50 disabled:pointer-events-none border border-stone-500/60"
        type="submit"
        disabled={loading}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          "Analyze Profile"
        )}
      </button>
    </form>
  );
};

export default SearchForm;
