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
    <form className="search-form" onSubmit={handleSubmit}>
      <input
        className="search-input"
        placeholder="Enter GitHub username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        disabled={loading}
      />
      <button className="search-button" type="submit" disabled={loading}>
        {loading ? "Loading..." : "Analyze"}
      </button>
    </form>
  );
};

export default SearchForm;
