const toneClass = (count) => {
  if (count >= 8) return "tone-4";
  if (count >= 5) return "tone-3";
  if (count >= 2) return "tone-2";
  if (count >= 1) return "tone-1";
  return "tone-0";
};

const HeatMap = ({ heatmapData = [] }) => {
  const recent = heatmapData.slice(-84);

  if (!recent.length) {
    return (
      <section className="panel">
        <h2>Contribution Calendar (Last 12 Weeks)</h2>
        <p className="muted">No contribution data available.</p>
      </section>
    );
  }

  // Group data into weeks (7 days per week, Sun-Sat)
  const weeks = [];
  for (let i = 0; i < recent.length; i += 7) {
    weeks.push(recent.slice(i, i + 7));
  }

  // Get date range for month labels
  const firstDate = new Date(recent[0].date);
  const monthLabels = [];
  let currentMonth = firstDate.getMonth();
  let monthStartWeek = 0;
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (let w = 0; w < weeks.length; w++) {
    const weekStartDate = new Date(weeks[w][0].date);
    if (weekStartDate.getMonth() !== currentMonth) {
      if (
        monthLabels.length === 0 ||
        monthLabels[monthLabels.length - 1].week !== w
      ) {
        monthLabels.push({
          month: monthNames[currentMonth],
          week: w,
        });
      }
      currentMonth = weekStartDate.getMonth();
    }
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section className="panel">
      <h2>Contribution Calendar (Last 12 Weeks)</h2>
      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        {/* Day labels on left */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ height: "20px" }} /> {/* Space for month labels */}
          {dayNames.map((day) => (
            <div
              key={day}
              style={{
                fontSize: "11px",
                color: "#666",
                height: "20px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div>
          {/* Month labels */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
            {weeks.map((_, weekIdx) => {
              const label = monthLabels.find((m) => m.week === weekIdx);
              return (
                <div
                  key={weekIdx}
                  style={{
                    fontSize: "11px",
                    color: "#666",
                    textAlign: "center",
                    width: "24px",
                    height: "16px",
                  }}
                >
                  {label ? label.month : ""}
                </div>
              );
            })}
          </div>

          {/* Grid of cells */}
          <div style={{ display: "flex", gap: "4px" }}>
            {weeks.map((week, weekIdx) => (
              <div
                key={weekIdx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {week.map((entry, dayIdx) => (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    className={`heat-cell heat-cell-compact ${toneClass(entry.count)}`}
                    title={`${entry.date}: ${entry.count} contributions`}
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "2px",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="muted" style={{ marginTop: "12px" }}>
        Lighter blocks = less activity, darker blocks = more activity
      </p>
    </section>
  );
};

export default HeatMap;
