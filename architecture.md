# Architecture — Developer Portfolio Evaluator

## System Overview

```
Browser
  │
  ▼
┌─────────────────────┐        ┌──────────────────────────┐
│   React + Vite      │◄──────►│   Express REST API       │
│   (Vercel)          │  JSON  │   (Render)               │
└─────────────────────┘        └────────────┬─────────────┘
                                            │
                               ┌────────────▼─────────────┐
                               │      MongoDB Atlas        │
                               │   (Report Cache, 24hr)   │
                               └──────────────────────────┘
                                            │
                               ┌────────────▼─────────────┐
                               │     GitHub REST API v3    │
                               │  (5,000 req/hr with PAT) │
                               └──────────────────────────┘
```

---

## Frontend (`client/`)

**React 18 + Vite**, deployed on **Vercel**.

### Pages

| Page          | Route               | Responsibility                                              |
| ------------- | ------------------- | ----------------------------------------------------------- |
| `Home.jsx`    | `/`                 | Search bar, landing UI                                      |
| `Report.jsx`  | `/report/:username` | Fetch report from backend, render score card                |
| `Compare.jsx` | `/compare`          | Multi-user compare builder, radar overlay, sortable matrix, drag reorder |

### Components

| Component                | What it renders                                       |
| ------------------------ | ----------------------------------------------------- |
| `SearchForm.jsx`         | Controlled input + submit; routes to report           |
| `ScoreSummary.jsx`       | Category grid + overall score                         |
| `ScoringMethodology.jsx` | Human-readable explanation of scoring weights/signals |
| `RadarBreakdown.jsx`     | Chart.js radar — 5 category scores                    |
| `HeatMap.jsx`            | GitHub-style contribution calendar grid               |
| `RepoList.jsx`           | Top 6 repos with stars, forks, language pill          |
| `Compare.jsx` widgets    | Resizable cards and comparison matrix for N users     |
| `Compare.jsx` radar      | Overlaid radar datasets for fast winner scanning      |
| `Compare.jsx` presets    | Local storage presets (save/load/delete compare sets) |

### Data Flow (Frontend)

```
User types username
  → SearchForm triggers api.js → GET /api/profile/:username
  → navigate("/report/:username")
  → Report.jsx reads :username from params
  → renders ScoreSummary, ScoringMethodology, RadarBreakdown, HeatMap, RepoList

Home compare builder
  → add usernames
  → navigate("/compare?users=user1,user2,user3")
  → Compare.jsx fetches each profile report
  → renders multi-user radar overlay + sortable matrix with category winners
  → allows save/load presets from local storage
```

### State Management

No Redux. Local `useState` + `useEffect` per page. Axios errors surface as UI error states.

---

## Backend (`server/`)

**Node.js + Express**, deployed on **Render**.

### Request Lifecycle

```
GET /api/profile/:username
  │
  ├── cache.js middleware
  │     └── MongoDB lookup by username
  │           ├── HIT  (cachedAt < 24hr) → return cached report ──────────────► Response
  │           └── MISS → next()
  │
  ├── profileController.js
  │     ├── githubService.js   ← all Octokit calls (parallel where possible)
  │     ├── scoringService.js  ← pure scoring logic, no I/O
  │     └── write result to MongoDB (set expiresAt = now + 24hr)
  │
  └── Response JSON
```

### Layer Responsibilities

```
routes/profileRoutes.js
  └── maps HTTP verbs/paths to controller functions

controllers/profileController.js
  └── orchestrates service calls, handles HTTP req/res

services/githubService.js
  └── ALL Octokit calls live here — nothing else talks to GitHub API
      ├── getUser(username)
      ├── getRepos(username)
      ├── getEvents(username)
      └── getRepoContents(owner, repo)

services/scoringService.js
  └── pure function: computeScores(userData, repos, events) → scores object
      no async, no I/O — easy to unit test

models/Report.js
  └── Mongoose schema with TTL index on expiresAt

middleware/cache.js
  └── checks MongoDB before hitting GitHub API

middleware/errorHandler.js
  └── catches 404 (unknown user), 403 (rate limit), 500 (generic)

config/db.js
  └── single Mongoose connection, called once in app.js
```

---

## Scoring Engine

All logic in `scoringService.js`. Input: raw GitHub API data. Output: normalised 0–100 scores.

| Category     | Weight | Key Signals                                                            |
| ------------ | ------ | ---------------------------------------------------------------------- |
| Activity     | 25%    | Commits last 90 days (max 20 pts) + streak consistency (5 pts)         |
| Code Quality | 20%    | Per repo: README (+2), license (+1), topics (+1), `/tests` folder (+1) |
| Diversity    | 20%    | Unique languages (max 10 pts) + project type variety (web, CLI, lib…)  |
| Community    | 20%    | Log-scale of total stars + forks; bonus for >50 followers              |
| Hiring Ready | 15%    | Bio filled, website set, public email, has pinned repos (5 pts each)   |

**Overall** = weighted sum, capped at 100.

---

## Database

**MongoDB Atlas** — single collection `reports`.

```
Report {
  username       String  (unique, indexed)
  avatarUrl      String
  name           String
  bio            String
  followers      Number
  publicRepos    Number
  scores {
    activity     Number   // 0–100
    codeQuality  Number
    diversity    Number
    community    Number
    hiringReady  Number
    overall      Number
  }
  topRepos       [{ name, stars, forks, language, description, url }]
  languages      [{ name, percent }]
  heatmapData    Mixed    // contributions per week
  shareUrl       String
  cachedAt       Date
  expiresAt      Date     // TTL index → auto-deleted by MongoDB after 24hr
}
```

No second collection needed. JWT auth (optional) can use a separate `users` collection if added later.

---

## API Endpoints

| Method | Endpoint                        | Description                                 |
| ------ | ------------------------------- | ------------------------------------------- |
| `GET`  | `/api/profile/:username`        | Fetch, score, cache, and return full report |
| `GET`  | `/api/profile/:username/cached` | Return cached report or 404                 |
| `GET`  | `/api/compare?u1=&u2=`          | Two-profile compare endpoint (legacy support) |
| `GET`  | `/api/health`                   | `{ status: "ok" }`                          |

---

## GitHub API Usage

All calls via `@octokit/rest` with a PAT (5,000 req/hr).

| Endpoint                                  | Data pulled                               | Used for                         |
| ----------------------------------------- | ----------------------------------------- | -------------------------------- |
| `GET /users/:username`                    | name, bio, avatar, followers, blog, email | Profile card + hiring readiness  |
| `GET /users/:username/repos?per_page=100` | language, stars, forks, topics, license   | Diversity + quality scores       |
| `GET /users/:username/events/public`      | push events, commit timestamps            | Activity score + streak          |
| `GET /repos/:owner/:repo/contents`        | root file list                            | Detect `tests/`, `docs/` folders |

Calls for a single profile are parallelised with `Promise.all` where data is independent.

---

## Caching Strategy

```
First request  → GitHub API  → score  → write MongoDB (expiresAt = +24hr)
Second request → MongoDB hit → return instantly (no GitHub call)
TTL expiry     → MongoDB auto-deletes document → next request re-fetches
```

`node-cron` can optionally run a nightly sweep for stale docs not caught by TTL.

---

## Deployment

| Layer    | Platform      | Config                                               |
| -------- | ------------- | ---------------------------------------------------- |
| Frontend | Vercel        | `VITE_API_URL` env var                               |
| Backend  | Render        | All `server/.env` vars set in dashboard              |
| Database | MongoDB Atlas | M0 free cluster; IP whitelist `0.0.0.0/0` for Render |

CORS on the backend is locked to `CLIENT_URL` (your Vercel domain) in production.

---

## Environment Variables

**`server/.env`**

```
MONGODB_URI=mongodb+srv://...
GITHUB_TOKEN=ghp_...
PORT=5000
JWT_SECRET=...
CLIENT_URL=https://your-app.vercel.app
```

**`client/.env`**

```
VITE_API_URL=http://localhost:5000/api   # → Render URL in production
```

Both `.env` files are gitignored. Never commit secrets.

---

## Key Design Decisions

- **No AI service** — all scoring is deterministic, computed from raw GitHub API data. Zero cost, no rate-limit surprises.
- **Cache-first** — MongoDB caching keeps GitHub API usage well under the 5,000 req/hr limit even under load.
- **Separation of concerns** — `githubService` owns all I/O; `scoringService` is a pure function. Swap either without touching the other.
- **Shareable URLs** — `/report/:username` is a direct deep link; OpenGraph meta tags make LinkedIn previews work out of the box.
- **Monorepo, separate deploys** — `client/` and `server/` are independent `package.json` projects. Vercel and Render each deploy one.
