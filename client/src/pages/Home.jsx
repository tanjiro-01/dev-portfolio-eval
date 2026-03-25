import { useNavigate } from "react-router-dom";

import SearchForm from "../components/SearchForm.jsx";

const Home = () => {
  const navigate = useNavigate();

  const handleSubmit = (username) => {
    navigate(`/report/${username}`);
  };

  return (
    <main className="page page-home">
      <header>
        <p className="eyebrow">Developer Portfolio Evaluator</p>
        <h1>Score any GitHub profile in seconds</h1>
        <p className="muted">
          Enter a username to generate a report with activity, quality, diversity,
          community, and hiring-readiness scores.
        </p>
      </header>
      <SearchForm onSubmit={handleSubmit} />
    </main>
  );
};

export default Home;
