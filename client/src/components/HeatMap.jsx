const toneClass = (count) => {
  if (count >= 8) return "bg-blue-400 border-blue-300/30";
  if (count >= 5) return "bg-blue-500/80 border-blue-400/30";
  if (count >= 2) return "bg-blue-700/60 border-blue-600/30";
  if (count >= 1) return "bg-blue-900/50 border-blue-800/30";
  return "bg-slate-800 border-slate-700/50";
};

const HeatMap = ({ heatmapData = [] }) => {
  const recent = heatmapData.slice(-84);

  if (!recent.length) {
    return (
      <section className="@container bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-slate-200">
          <span className="w-2 h-6 bg-teal-500 rounded-full inline-block"></span>
          Contribution Calendar (Last 12 Weeks)
        </h2>
        <p className="text-slate-400 text-sm">No contribution data available.</p>
      </section>
    );
  }

  // Group data into weeks (7 days per week, Sun-Sat)
  const weeks = [];
  for (let i = 0; i < recent.length; i += 7) {
    weeks.push(recent.slice(i, i + 7));
  }

  // Label the first week of each month so labels align with month starts.
  const monthLabels = [];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  for (let w = 0; w < weeks.length; w++) {
    const weekStartDate = new Date(weeks[w][0].date);
    const weekMonth = weekStartDate.getMonth();
    const lastLabeledMonth = monthLabels[monthLabels.length - 1]?.month;
    if (!lastLabeledMonth || lastLabeledMonth !== monthNames[weekMonth]) {
      monthLabels.push({
        month: monthNames[weekMonth],
        week: w,
      });
    }
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section className="@container bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative group overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
      
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 relative z-10 text-slate-200">
        <span className="w-2 h-6 bg-teal-500 rounded-full inline-block"></span>
        Contribution Calendar (Last 12 Weeks)
      </h2>
      
      <div className="flex gap-4 items-start relative z-10 overflow-x-auto pb-2">
        {/* Day labels on left */}
        <div className="flex flex-col gap-1 mt-6">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-[10px] @sm:text-[11px] text-slate-500 h-[14px] @sm:h-[18px] flex items-center pr-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div>
          {/* Month labels */}
          <div className="flex gap-1 mb-2">
            {weeks.map((_, weekIdx) => {
              const label = monthLabels.find((m) => m.week === weekIdx);
              return (
                <div
                  key={weekIdx}
                  className="text-[10px] @sm:text-[11px] text-slate-500 text-center w-[14px] @sm:w-[18px] flex-shrink-0"
                >
                  {label ? label.month : ""}
                </div>
              );
            })}
          </div>

          {/* Grid of cells */}
          <div className="flex gap-1">
            {weeks.map((week, weekIdx) => (
              <div
                key={weekIdx}
                className="flex flex-col gap-1"
              >
                {week.map((entry, dayIdx) => (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    className={`w-[14px] h-[14px] @sm:w-[18px] @sm:h-[18px] rounded-[3px] border ${toneClass(entry.count)} transition-all hover:scale-110 hover:z-10`}
                    title={`${entry.date}: ${entry.count} contributions`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6 relative z-10">
        <span className="text-xs text-slate-500">Less</span>
        <div className="flex gap-1">
           <div className="w-3 h-3 rounded-sm border bg-slate-800 border-slate-700/50"></div>
           <div className="w-3 h-3 rounded-sm border bg-blue-900/50 border-blue-800/30"></div>
           <div className="w-3 h-3 rounded-sm border bg-blue-700/60 border-blue-600/30"></div>
           <div className="w-3 h-3 rounded-sm border bg-blue-500/80 border-blue-400/30"></div>
           <div className="w-3 h-3 rounded-sm border bg-blue-400 border-blue-300/30"></div>
        </div>
        <span className="text-xs text-slate-500">More</span>
      </div>
    </section>
  );
};

export default HeatMap;
