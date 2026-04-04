const Skeleton = ({
  width = "100%",
  height = "20px",
  borderRadius = "4px",
  style = {},
}) => (
  <div
    style={{
      width,
      height,
      backgroundColor: "#e0e0e0",
      borderRadius,
      animation: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      ...style,
    }}
  />
);

const ReportSkeleton = () => {
  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
      <section className="page" aria-busy="true" aria-live="polite">
        <header className="report-header">
          <div>
            <p className="eyebrow">Report</p>
            <Skeleton width="200px" height="40px" borderRadius="8px" />
          </div>
          <Skeleton width="250px" height="40px" borderRadius="8px" />
        </header>

        <div className="report-layout">
          {/* Profile Panel Skeleton */}
          <section className="panel profile-panel">
            <Skeleton width="120px" height="120px" borderRadius="50%" />
            <div style={{ flex: 1 }}>
              <Skeleton width="200px" height="28px" borderRadius="4px" />
              <Skeleton
                width="300px"
                height="16px"
                borderRadius="4px"
                style={{ marginTop: "12px" }}
              />
              <Skeleton
                width="250px"
                height="16px"
                borderRadius="4px"
                style={{ marginTop: "8px" }}
              />
              <Skeleton
                width="200px"
                height="16px"
                borderRadius="4px"
                style={{ marginTop: "8px" }}
              />
            </div>
          </section>

          {/* Score Summary Skeleton */}
          <section className="panel">
            <Skeleton width="150px" height="24px" borderRadius="4px" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                gap: "16px",
                marginTop: "24px",
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <Skeleton width="80px" height="16px" borderRadius="4px" />
                  <Skeleton
                    width="60px"
                    height="24px"
                    borderRadius="4px"
                    style={{ marginTop: "8px" }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Methodology Skeleton */}
          <section className="panel">
            <Skeleton width="200px" height="24px" borderRadius="4px" />
            <Skeleton
              width="100%"
              height="80px"
              borderRadius="4px"
              style={{ marginTop: "16px" }}
            />
          </section>

          {/* Radar Chart Skeleton */}
          <section className="panel">
            <Skeleton width="150px" height="24px" borderRadius="4px" />
            <Skeleton
              width="100%"
              height="300px"
              borderRadius="4px"
              style={{ marginTop: "16px" }}
            />
          </section>

          {/* Language Distribution Skeleton */}
          <section className="panel">
            <Skeleton width="200px" height="24px" borderRadius="4px" />
            <Skeleton
              width="100%"
              height="250px"
              borderRadius="4px"
              style={{ marginTop: "16px" }}
            />
          </section>

          {/* Heatmap Skeleton */}
          <section className="panel">
            <Skeleton width="200px" height="24px" borderRadius="4px" />
            <Skeleton
              width="100%"
              height="200px"
              borderRadius="4px"
              style={{ marginTop: "16px" }}
            />
          </section>

          {/* Repos Skeleton */}
          <section className="panel">
            <Skeleton width="180px" height="24px" borderRadius="4px" />
            <div style={{ marginTop: "16px" }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: "16px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Skeleton width="150px" height="20px" borderRadius="4px" />
                  <Skeleton
                    width="100%"
                    height="16px"
                    borderRadius="4px"
                    style={{ marginTop: "8px" }}
                  />
                  <Skeleton
                    width="200px"
                    height="16px"
                    borderRadius="4px"
                    style={{ marginTop: "8px" }}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  );
};

export default ReportSkeleton;
