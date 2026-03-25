const LanguageBars = ({ languages = [] }) => {
  return (
    <section className="panel">
      <h2>Language Distribution</h2>
      {!languages.length ? (
        <p className="muted">No language data available.</p>
      ) : (
        <div className="language-stack">
          {languages.map((language) => (
            <article key={language.name} className="language-row">
              <div className="language-label-row">
                <span>{language.name}</span>
                <strong>{language.percent}%</strong>
              </div>
              <div className="language-track">
                <div
                  className="language-fill"
                  style={{ width: `${language.percent}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default LanguageBars;
