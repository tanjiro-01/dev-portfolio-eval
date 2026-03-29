const toneClass = (count) => {
  if (count >= 8) return "tone-4";
  if (count >= 5) return "tone-3";
  if (count >= 2) return "tone-2";
  if (count >= 1) return "tone-1";
  return "tone-0";
};

const HeatMap = ({ heatmapData = [] }) => {
  const recent = heatmapData.slice(-84);

  return (
    <section className="panel">
      <h2>Contribution Heatmap (Last 12 Weeks)</h2>
      {!recent.length ? (
        <p className="muted">No contribution data available.</p>
      ) : (
        <>
          <div className="heatmap-grid heatmap-grid-compact">
            {recent.map((entry) => (
              <div
                key={entry.date}
                className={`heat-cell heat-cell-compact ${toneClass(entry.count)}`}
                title={`${entry.date}: ${entry.count} commits`}
              />
            ))}
          </div>
          <p className="muted heatmap-legend">
            Lighter blocks mean lower activity, darker blocks mean higher
            activity.
          </p>
        </>
      )}
    </section>
  );
};

export default HeatMap;
