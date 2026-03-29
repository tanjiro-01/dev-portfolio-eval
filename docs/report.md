# Developer Portfolio Evaluator - Execution Plan

This document is the step-by-step project roadmap we will follow.

## 1) Project Understanding (What We Are Building)

We are building a full-stack app that evaluates a GitHub developer profile and returns a scored report.

Core requirements from the current project docs:

- Frontend: React + Vite app with routes `/` and `/report/:username`.
- Backend: Express API with endpoint `GET /api/profile/:username` as primary flow.
- Data source: GitHub REST API via Octokit (`user`, `repos`, `events`, `repo contents`).
- Scoring engine: deterministic category-based scoring (Activity, Code Quality, Diversity, Community, Hiring Ready, Overall).
- Caching: MongoDB report cache with 24-hour TTL (`expiresAt`).
- Shareable report URL: `/report/:username`.
- Deployment target: client on Vercel, server on Render, DB on MongoDB Atlas.

Important non-functional expectations:

- Clean separation of concerns (`githubService` I/O, `scoringService` pure logic).
- Strong error handling (404 user not found, 403 rate limit, 500 fallback).
- Daily meaningful commits with descriptive messages.

---

## 1.1) Tech Stack Coverage Check (Current Status)

This is a live status snapshot based on current repository files.

| Layer     | Tool / Library       | Status Today                   | Planned Step         |
| --------- | -------------------- | ------------------------------ | -------------------- |
| Frontend  | React 18 + Vite      | Implemented (Step 0 complete)  | Step 0               |
| Frontend  | React Router v6      | Planned                        | Step 6               |
| Frontend  | Chart.js             | Planned                        | Step 7               |
| Frontend  | Axios                | Planned                        | Step 6               |
| Backend   | Node.js + Express    | Implemented baseline (Step 0)  | Step 0-1             |
| Backend   | Octokit (GitHub SDK) | Planned                        | Step 3               |
| Backend   | node-cron            | Planned (optional integration) | Step 8 or Step 10    |
| Backend   | dotenv               | Implemented (Step 0 complete)  | Step 0               |
| Database  | MongoDB Atlas        | Planned                        | Step 2               |
| Database  | Mongoose             | Planned                        | Step 2               |
| Auth      | JWT + bcrypt         | Planned (optional)             | Post-core or Step 8+ |
| Deploy FE | Vercel               | Planned                        | Step 10              |
| Deploy BE | Render               | Planned                        | Step 10              |
| API       | GitHub REST API v3   | Planned                        | Step 3-5             |

Current evidence check:

- `client/` and `server/` folders now exist.
- `client/package.json` and `server/package.json` now exist.
- `.env.example` templates exist for both client and server.
- Root `.gitignore` and `README.md` are in place.

---

## 2) Phased Plan (Step-by-Step)

Total planned phases: **10**

Estimated total commits for full project: **22 to 30 commits**

## 2.1) Required Feature Checklist (Locked Scope)

The following features are in-scope and tracked to implementation phases.

### GitHub Username Search

- Enter any GitHub username and fetch live profile data.
- Show avatar, bio, join date, followers, public repos.
- Handle non-existent usernames gracefully with friendly error.

Mapped phases: Step 3, Step 5, Step 6.

### Scoring Engine (Core Logic)

- Activity score: commits in last 90 days, push frequency, longest streak.
- Project diversity: number of languages, variety of repo topics.
- Code quality signals: README present, license, topics/tags, has tests folder.
- Community impact: total stars received, forks, followers count.
- Hiring readiness: pinned repos, bio filled, website link, public email set.

Mapped phases: Step 4, Step 5.

### Visual Score Card

- Overall score out of 100 with a circular progress ring.
- Radar chart showing all 5 category scores.
- Contribution heatmap (GitHub-style calendar grid).
- Language distribution bar chart.
- Top 6 repositories with stars, forks, language pill.

Mapped phases: Step 6, Step 7.

### Shareable Report URL

- Each report lives at `/report/:username`.
- Copy-link button one click to clipboard.
- Report cached in MongoDB for 24 hours (no repeat API calls).
- OpenGraph meta tags so the link previews nicely on LinkedIn.

Mapped phases: Step 2, Step 5, Step 7.

### Compare Mode (Bonus)

- Enter and compare multiple usernames in one session.
- Highlight winners per category across all compared users.
- Support draggable and manually resizable compare widgets.
- Allow compare flow directly from the home page builder.

Mapped phases: Step 8.

### Explainability and UX Iteration

- Show transparent scoring methodology details alongside score output.
- Keep heatmap compact for better scanability in report view.
- Improve compare page layout to auto-adjust as more users are added.

Mapped phases: Step 7, Step 8, Post-step iteration.

## Step 0 - Project Setup and Guardrails

Status: Completed (March 29, 2026)

**Goal**: Set up monorepo structure and baseline standards.

**Integrations in this step**:

- Initialize `client/` (Vite + React) and `server/` (Node + Express).
- Add `.gitignore` and environment variable templates.
- Add base README sections and run scripts.

**Deliverables**:

- Working folder structure for client/server.
- `npm run dev` scripts available for both sides.

**Commit target**: 2 commits

- `Day X - bootstrap client and server workspaces`
- `Day X - add env templates and repository hygiene`

---

## Step 1 - Backend Skeleton and Health Surface

Status: Completed (March 29, 2026)

**Goal**: Establish API skeleton and middleware chain.

**Integrations in this step**:

- Express app setup, CORS, JSON middleware.
- Route registration and `/api/health` endpoint.
- Global error handler middleware.

**Deliverables**:

- Server starts cleanly.
- `/api/health` returns `{ status: "ok" }`.

**Commit target**: 2 commits

- `Day 2 - create express app and route wiring`
- `Day 2 - add centralized error handling`

---

## Step 2 - Database and Cache Model

Status: Completed (March 29, 2026)

**Goal**: Connect MongoDB and define report cache schema.

**Integrations in this step**:

- Mongoose connection layer (`config/db.js`).
- `Report` model with `expiresAt` TTL index.
- Cache middleware (`checkCache`) for `/api/profile/:username`.

**Deliverables**:

- DB connection verified.
- Cache middleware short-circuits on hit.

**Commit target**: 2 to 3 commits

- `Day 3 - add mongo connection and report model`
- `Day 3 - implement cache middleware with ttl-aware schema`
- `Day 3 - add cached profile endpoint`

---

## Step 3 - GitHub Service Layer

Status: Completed (March 29, 2026)

**Goal**: Build and isolate all GitHub API calls.

**Integrations in this step**:

- Octokit client configuration with PAT.
- Service methods:
  - `getUser(username)`
  - `getRepos(username)`
  - `getEvents(username)`
  - `getRepoContents(owner, repo)`
- API error mapping helpers (404/403 mapping).

**Deliverables**:

- Reusable service module with no HTTP concerns.
- Parallel fetch readiness for controller.

**Commit target**: 2 commits

- `Day 4 - add octokit service functions for profile data`
- `Day 4 - map github api failures to app-safe errors`

---

## Step 4 - Scoring Engine v1 (Deterministic)

Status: Completed (March 29, 2026)

**Goal**: Implement pure scoring functions and overall weighted score.

**Integrations in this step**:

- `scoreActivity(events)` using commit volume + weekly streak.
- `scoreCodeQuality(repos)` via README/license/topics/tests checks.
- `scoreDiversity(repos)` via language and project type variety.
- `scoreCommunity(user, repos)` via stars/forks/followers.
- `scoreHiringReady(user)` via profile completeness signals.
- `computeScores(...)` weighted overall.

**Deliverables**:

- Pure scoring module with no DB/network usage.
- Output shape aligned with architecture doc.

**Commit target**: 3 commits

- `Day 4 - implement activity scoring with 90-day windows`
- `Day 4 - implement quality diversity community hiring scorers`
- `Day 4 - add weighted overall score aggregation`

---

## Step 5 - Profile Controller Orchestration

Status: Completed (March 29, 2026)

**Goal**: Create end-to-end report generation pipeline.

**Integrations in this step**:

- `GET /api/profile/:username` controller flow.
- `Promise.all` for independent GitHub calls.
- Build report payload (scores, top repos, languages, heatmap placeholders, share URL).
- Upsert report in MongoDB with `cachedAt` + `expiresAt`.
- Add `Cache-Control` response header (`public, max-age=3600`).

**Deliverables**:

- First complete end-to-end response pipeline.
- Cache write and next-call cache hit behavior.

**Commit target**: 2 to 3 commits

- `Day 5 - orchestrate profile report generation flow`
- `Day 5 - persist report cache with ttl and share url`
- `Day 5 - add cache-control header and response cleanup`

---

## Step 6 - Frontend Core UI and Routing

Status: Completed (March 29, 2026)

**Goal**: Build user-facing pages and API integration.

**Integrations in this step**:

- `Home` page with search input.
- Route setup with React Router (`/`, `/report/:username`).
- `Report` page data fetching using Axios helper.
- Loading/error/empty states.

**Deliverables**:

- Username search to report navigation working.
- API errors surfaced in UI.

**Commit target**: 3 commits

- `Day 5 - add router and page skeletons`
- `Day 5 - integrate axios api layer for report fetch`
- `Day 5 - implement loading error and not-found ui states`

---

## Step 7 - Data Visualization and Report Components

Status: Completed (March 29, 2026)

**Goal**: Render score data in visual components.

**Integrations in this step**:

- `ScoreCard`, `RadarChart`, `HeatMap`, `RepoList`.
- Chart.js registration and dataset wiring.
- Shareable URL copy button.

**Deliverables**:

- Report page displays complete scored output.
- Visuals stable on desktop and mobile widths.

**Commit target**: 2 to 3 commits

- `Day 5 - add scorecard and repo list components`
- `Day 5 - integrate radar chart and heatmap visuals`
- `Day 5 - add share link actions and report polish`

---

## Step 8 - Compare, Cached Endpoint, and Hardening

Status: Completed (March 29, 2026)

**Goal**: Deliver remaining API surfaces and reliability polish.

**Integrations in this step**:

- `GET /api/profile/:username/cached`.
- `GET /api/compare?u1=&u2=`.
- Input validation + defensive defaults for empty events/repo data.
- Rate limit aware responses and user messaging.

**Deliverables**:

- All documented endpoints available.
- Better resilience for edge cases.

**Commit target**: 2 commits

- `Day 5 - implement compare endpoint and cached retrieval`
- `Day 5 - add input validation and rate limit handling`

---

## Step 9 - Testing, QA, and Observability

Status: Completed (March 29, 2026)

**Goal**: Ensure confidence before deployment.

**Integrations in this step**:

- Unit tests for scoring service (especially activity edge cases).
- Integration tests for API happy path and key errors.
- Manual QA checklist for cache hit/miss behavior.
- Basic request logging and safe diagnostics.

**Deliverables**:

- Repeatable test run output.
- Verified pass on critical user journeys.
- Cache transition integration checks with database assertions.

**Commit target**: 2 to 3 commits

- `Day 5 - add scoring unit tests with boundary coverage`
- `Day 5 - add api integration tests and fixtures`
- `Day 5 - finalize qa checklist and runtime logs`

---

## Step 10 - Deployment and Submission Readiness

Status: Completed (March 29, 2026)

**Goal**: Production deployment and final handoff quality.

**Integrations in this step**:

- Render deploy for `server/`.
- Vercel deploy for `client/`.
- Production env var validation.
- CORS lock to production frontend URL.
- Submission notes + demo script preparation.

**Deliverables**:

- Live frontend and backend URLs.
- Final submission-ready repository state.
- Final submission checklist and production runbook documentation.

**Commit target**: 2 commits

- `Day 5 - configure production env and cors for deploy`
- `Day 5 - finalize deployment docs and submission checklist`

---

## 3) Commit Discipline Plan

Expected commit style:

- Prefix each daily commit with progress context: `Day N - ...`
- One logical change per commit.
- Avoid vague commit messages (`fix`, `update`, `done`).

Expected total meaningful commits before submission: **22 to 30**.

---

## 4) Step Tracking Board

Use this board while implementing:

- [x] Step 0 - Setup and guardrails
- [x] Step 1 - Backend skeleton
- [x] Step 2 - DB + TTL cache
- [x] Step 3 - GitHub service layer
- [x] Step 4 - Scoring engine
- [x] Step 5 - Profile orchestration
- [x] Step 6 - Frontend core
- [x] Step 7 - Report visualizations
- [x] Step 8 - Compare + hardening
- [x] Step 9 - Testing + QA
- [x] Step 10 - Deploy + submission

---

## 5) What Happens Next

Execution mode for future work:

1. We pick the current step.
2. We implement only that step's scope.
3. We commit with a meaningful Day-based message.
4. We update this file by checking off the completed step.
5. We proceed to the next step.

---

## 6) Post-Step Iteration Notes

- Frontend compare mode expanded to multi-user matrix with drag-reorder cards and resizable compare panes.
- Home page now includes a quick compare builder for launching multi-user comparisons.
- Report page now includes scoring methodology explanation and a compact heatmap treatment.
