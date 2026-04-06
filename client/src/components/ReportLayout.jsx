import ScoreSummary from "./ScoreSummary.jsx";
import RepoList from "./RepoList.jsx";
import RadarBreakdown from "./RadarBreakdown.jsx";
import LanguageBars from "./LanguageBars.jsx";
import HeatMap from "./HeatMap.jsx";
import ScoringMethodology from "./ScoringMethodology.jsx";

const ReportLayout = ({ report }) => {
  if (!report) return null;

  return (
    <div className="@container w-full">
      <section className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col @2xl:flex-row items-center @2xl:items-start gap-6 shadow-xl relative overflow-hidden group mt-6 mb-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
        <img
          src={report.avatarUrl}
          alt={`${report.username} avatar`}
          className="w-24 h-24 @2xl:w-32 @2xl:h-32 rounded-full border-[3px] border-slate-700 shadow-lg relative z-10"
        />
        <div className="flex-1 text-center @2xl:text-left relative z-10">
          <h2 className="text-2xl @2xl:text-3xl font-bold text-slate-100 mb-1">{report.name || report.username}</h2>
          <div className="text-sm font-medium text-slate-400 mb-2 flex flex-wrap justify-center @2xl:justify-start gap-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              {report.followers} Followers
            </span>
            <span className="flex items-center gap-1">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              {report.publicRepos} Public repos
            </span>
            <span className="flex items-center gap-1">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              {report.pinnedReposCount ?? 0} Pinned
            </span>
            {report.createdAt && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Joined {new Date(report.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-slate-300 text-[15px] leading-relaxed max-w-2xl">{report.bio || "No bio available."}</p>
          <div className="mt-3 text-[11px] font-mono font-medium tracking-wider text-slate-500 uppercase px-2 py-1 bg-slate-800 inline-block rounded border border-slate-700">
            Cache {report.cache?.hit ? "Hit" : "Miss"}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <ScoreSummary scores={report.scores} />
          <ScoringMethodology />
          <HeatMap heatmapData={report.heatmapData} />
        </div>
        <div className="flex flex-col gap-6">
          <RadarBreakdown scores={report.scores} />
          <LanguageBars languages={report.languages} />
          <RepoList repos={report.topRepos} />
        </div>
      </div>
    </div>
  );
};

export default ReportLayout;
