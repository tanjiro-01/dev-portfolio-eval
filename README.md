# Developer Portfolio Evaluator

Developer Portfolio Evaluator is a full-stack MERN application that analyzes a public GitHub profile and generates a structured report across activity, code quality, diversity, community impact, and hiring readiness.

## Live URLs

- Frontend: https://dev-portfolio-evaluator.vercel.app
- Backend API: https://dev-portfolio-evaluator-api.onrender.com

## What Is Implemented

- GitHub username search and report generation
- Shareable report route at /report/:username
- Compare route at /compare
- Score summary and category breakdown
- Contribution heatmap
- Language distribution chart
- Top repositories module
- Cached responses with TTL and cache-version invalidation
- CORS-safe backend integration for deployed frontend

## High-Level Architecture

Browser (React + Vite, Vercel)
-> Express API (Node.js, Render)
-> GitHub APIs (REST + GraphQL)
-> MongoDB Atlas (report cache)

## End-to-End Flow

1. User submits username from frontend.
2. Frontend calls backend profile endpoint.
3. Backend cache middleware checks MongoDB for a valid cached report.
4. On cache miss, backend fetches data from GitHub APIs in parallel.
5. Scoring service computes all category scores and weighted overall score.
6. Report service builds normalized payload for frontend visualizations.
7. Backend stores report with 24-hour expiry metadata and returns JSON.

## Data Fetch Matrix

### GitHub REST sources

- GET /users/:username - Used for avatar, name, bio, followers, public repo count, account created date.

- GET /users/:username/repos?sort=updated&per_page=100 - Used for top repos, language distribution, diversity signals, code quality metadata, community stars/forks.

- GET /users/:username/events/public?per_page=100 - Used as fallback for activity scoring and fallback heatmap generation when GraphQL calendar is unavailable.

- GET /users/:username/starred?per_page=100 - Used as small additional community engagement signal.

- GET /repos/:owner/:repo/contents - Used to detect README and tests folder for quality score.

### GitHub GraphQL sources

- pinnedItems(first: 6, types: REPOSITORY) - Used for hiring readiness and pinned repo count in report.

- contributionsCollection(from, to).contributionCalendar - Used for primary activity scoring and full-year heatmap.

## Scoring Model

All categories are normalized to 0-100. Overall score is weighted.

### Category weights

- Activity: 25%
- Code Quality: 20%
- Diversity: 20%
- Community: 20%
- Hiring Ready: 15%

### Overall equation

$$
	ext{overall} = 0.25A + 0.20Q + 0.20D + 0.20C + 0.15H
$$

### Activity equation (primary calendar path)

Inputs from last 90 days and full-year streak:

- total90 = total contribution count in last 90 days
- activeDays90 = number of days with contributionCount > 0 in last 90 days
- maxStreak = longest consecutive active-day streak from contribution calendar

$$
A = \min\left(\frac{\text{total90}}{200},1\right)\cdot 40
+ \min\left(\frac{\text{activeDays90}}{60},1\right)\cdot 40
+ \min\left(\frac{\text{maxStreak}}{30},1\right)\cdot 20
$$

Fallback activity path uses REST PushEvents:

$$
A_{fallback} = \left(\frac{\min(\text{totalCommits}/20,1)\cdot20 + 0.05\cdot\text{longestStreakPct}}{25}\right)\cdot100
$$

### Code Quality equation

Top 10 repos by stars are sampled. Per repo points:

- +1 license present
- +1 topics present
- +1 description present
- +1 homepage present
- +1 non-fork repo
- +2 README exists
- +2 tests folder exists

Max per sampled repo = 9.

$$
Q = \frac{\text{sumRepoPoints}}{9\cdot\text{sampleRepoCount}}\cdot100
$$

### Diversity equation

Two equal halves:

- languageScore = min(uniqueLanguages / 10, 1) \* 50
- categoryScore = min(uniqueDetectedCategories / 10, 1) \* 50

$$
D = \text{languageScore} + \text{categoryScore}
$$

### Community equation

Uses non-fork owned repos only for stars/forks:

$$
starsScore = \min\left(\frac{\log_{10}(stars+1)}{2},1\right)\cdot43
$$

$$
forksScore = \min\left(\frac{\log_{10}(forks+1)}{2},1\right)\cdot34
$$

$$
followerScore = \min\left(\frac{followers}{50},1\right)\cdot20
$$

$$
starredSignal = \min\left(\frac{\log_{10}(starredCount+1)}{2},1\right)\cdot3
$$

$$
C = starsScore + forksScore + followerScore + starredSignal
$$

### Hiring Ready equation

Each signal contributes 20 points:

- bio present
- blog/website present
- location or company present
- at least one non-fork repo
- at least one pinned repo

$$
H = 20 \cdot (bio + blog + locationOrCompany + hasNonForkRepo + hasPinnedRepo)
$$

Each term is binary (0 or 1), so H is in [0, 100].

## Heatmap Strategy

- Primary: full-year heatmap from GraphQL contribution calendar.
- Fallback: 84-day heatmap from REST PushEvents.

## Cache Strategy

- MongoDB stores report payload by username.
- Target cache lifetime is 24 hours.
- Cache version is embedded in report and checked before serving.
- Stale-version entries are bypassed and rebuilt.

## Backend File Responsibilities

- server/src/app.js - App setup, middleware registration, CORS, route mounting, error middleware.

- server/src/routes/profileRoutes.js - API route definitions for profile, cache-only fetch, compare, and health.

- server/src/controllers/profileController.js - Handles profile endpoint orchestration and response writing.

- server/src/controllers/compareController.js - Compare endpoint orchestration and winner matrix response.

- server/src/services/githubService.js - All GitHub REST and GraphQL requests. - Retry/backoff for rate-limit style failures.

- server/src/services/scoringService.js - All category score calculations and weighted overall combination.

- server/src/services/reportService.js - Combines fetched data, computes report sections, handles cache read/write.

- server/src/middleware/checkCache.js - Cache pre-check and cache-version validation.

- server/src/middleware/errorHandler.js - Centralized API error serialization.

- server/src/models/Report.js - Mongoose schema for cached reports and expiry fields.

- server/src/config/db.js - MongoDB connection.

- server/src/config/reportCache.js - Report cache/version constants.

- server/src/utils/githubError.js - Normalizes GitHub SDK errors to app-level errors.

- server/src/utils/httpError.js - Utility to create consistent HTTP errors.

## Frontend File Responsibilities

- client/src/main.jsx - React entrypoint.

- client/src/App.jsx - Route wiring.

- client/src/pages/Home.jsx - Search page and navigation to report/compare.

- client/src/pages/Report.jsx - Fetches report data and renders report layout.

- client/src/pages/Compare.jsx - Multi-profile compare workflow and visual output.

- client/src/api/http.js - API request layer for frontend pages/components.

- client/src/components/TopNav.jsx - Cross-page navigation.

- client/src/components/ReportLayout.jsx - Composes full report modules.

- client/src/components/ScoreSummary.jsx - Overall and category score cards.

- client/src/components/RadarBreakdown.jsx - Radar chart visualization.

- client/src/components/HeatMap.jsx - Contribution heatmap visualization.

- client/src/components/LanguageBars.jsx - Language distribution chart.

- client/src/components/RepoList.jsx - Top repositories listing.

- client/src/components/ScoringMethodology.jsx - Human-readable scoring explanation in UI.

## API Endpoints

- GET /api/health
- GET /api/profile/:username
- GET /api/profile/:username/cached
- GET /api/compare?u1=:u1&u2=:u2

## Deployment Setup (Step-by-Step)

### Backend on Render

1. Create Web Service from repository.
2. Set Root Directory to server.
3. Build command: npm install
4. Start command: npm start
5. Add environment variables: - GITHUB_TOKEN - MONGODB_URI - PORT=5000 - CLIENT_URL=https://your-frontend-domain - JWT_SECRET (optional)

### Frontend on Vercel

1. Create project from repository.
2. Set Root Directory to client.
3. Add environment variable: - VITE_API_URL=https://your-backend-domain/api
4. Deploy.

### Post-deploy checks

1. Verify backend health endpoint.
2. Search a known user from frontend and confirm report loads.
3. Open direct route /report/octocat and verify it works on refresh.
4. Confirm compare route works.

## Environment Variables

### Backend (server/.env)

- GITHUB_TOKEN
- MONGODB_URI
- CLIENT_URL
- PORT (optional)
- JWT_SECRET (optional)

### Frontend (client/.env)

- VITE_API_URL

Example:

VITE_API_URL=https://dev-portfolio-evaluator-api.onrender.com/api

## Local Development

1. npm --prefix server install
2. npm --prefix client install
3. npm --prefix server run dev
4. npm --prefix client run dev

## Validation Commands

- npm --prefix server run test:unit
- npm --prefix client run build

## Documentation Policy

- README is the canonical source for architecture, formulas, fetch logic, deployment, and file ownership.
- docs/gap_analysis.md is historical analysis and optional.
- docs/deployment.md is redundant with README and optional.
- docs/hosting-guide.md and docs/project-journey.md are supplementary reference material.
