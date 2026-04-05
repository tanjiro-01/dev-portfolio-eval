const Skeleton = ({ className = "" }) => (
  <div className={`bg-slate-800/50 animate-pulse rounded-md ${className}`} />
);

const ReportSkeleton = () => {
  return (
    <section className="@container w-full mx-auto flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <header className="grid gap-4 mt-8">
        <div>
          <Skeleton className="w-16 h-4 mb-2" />
          <Skeleton className="w-48 h-10 rounded-lg" />
        </div>
        <Skeleton className="w-full max-w-sm h-12 rounded-xl" />
      </header>

      <div className="grid gap-4 @2xl:gap-6 grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3 @6xl:grid-cols-4 mt-4">
        {/* Profile Panel Skeleton */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 col-span-full flex flex-col @2xl:flex-row items-center gap-6">
          <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
          <div className="flex-1 w-full space-y-3">
            <Skeleton className="w-48 h-7" />
            <Skeleton className="w-3/4 max-w-md h-4" />
            <Skeleton className="w-2/3 max-w-sm h-4" />
            <Skeleton className="w-1/2 max-w-xs h-4" />
          </div>
        </section>

        {/* Score Summary Skeleton */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 col-span-full @6xl:col-span-2">
          <Skeleton className="w-40 h-6 mb-8" />
          <div className="flex justify-center mb-8">
            <Skeleton className="w-32 h-32 rounded-full" />
          </div>
          <div className="grid grid-cols-2 @sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 h-16">
                 <Skeleton className="w-16 h-3 mb-2" />
                 <Skeleton className="w-8 h-5" />
              </div>
            ))}
          </div>
        </section>

        {/* Radar Chart Skeleton */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 col-span-full @2xl:col-span-1 @6xl:col-span-2">
          <Skeleton className="w-40 h-6 mb-6" />
          <Skeleton className="w-full h-64 rounded-xl" />
        </section>

        {/* Methodology Skeleton */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 col-span-full @6xl:col-span-1">
          <Skeleton className="w-40 h-6 mb-4" />
          <Skeleton className="w-full h-4 mb-6" />
          <div className="hidden @6xl:flex flex-col gap-4">
            <Skeleton className="w-full h-16 rounded-xl" />
            <Skeleton className="w-full h-16 rounded-xl" />
            <Skeleton className="w-full h-16 rounded-xl" />
          </div>
        </section>

        {/* Language Distribution Skeleton */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 col-span-full @6xl:col-span-3">
          <Skeleton className="w-48 h-6 mb-6" />
          <Skeleton className="w-full h-64 rounded-xl" />
        </section>

        {/* Heatmap Skeleton */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 col-span-full @6xl:col-span-2">
          <Skeleton className="w-56 h-6 mb-6" />
          <Skeleton className="w-full h-40 rounded-xl" />
        </section>

        {/* Repos Skeleton */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 col-span-full @6xl:col-span-2">
          <Skeleton className="w-48 h-6 mb-6" />
          <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-5 h-32 flex flex-col justify-between">
                <Skeleton className="w-32 h-5" />
                <Skeleton className="w-full h-8" />
                <div className="flex gap-4">
                  <Skeleton className="w-16 h-4" />
                  <Skeleton className="w-16 h-4" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};

export default ReportSkeleton;
