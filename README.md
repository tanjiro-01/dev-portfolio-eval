# Developer Portfolio Evaluator

Developer Portfolio Evaluator is a full-stack MERN web app that analyzes any public GitHub profile and generates a shareable score report.

## Live URLs

- Frontend (Vercel): https://dev-portfolio-evaluator.vercel.app
- Backend (Render): https://dev-portfolio-evaluator-api.onrender.com

## What This Project Does

1. User enters a GitHub username.
2. Backend fetches profile, repositories, starred repos, pinned repos, events, and contribution calendar.
3. Scoring engine computes 5 categories and weighted overall score.
4. Frontend renders a report page with charts and cards.
5. Report URL can be shared directly (`/report/:username`).
6. Results are cached in MongoDB for 24 hours to reduce repeated API calls.

## Scoring Model (How Calculation Works)

### Category Weights

- Activity: 25%
- Code Quality: 20%
- Diversity: 20%
- Community: 20%
- Hiring Ready: 15%

### Activity (25%)

- Primary source: GraphQL contribution calendar (52 weeks, 365 days).
- Fallback source: REST events when GraphQL calendar unavailable.
- Components:
  - Contribution volume in last 90 days
  - Active days consistency
  - Longest streak

### Code Quality (20%)

- Evaluated from top repositories with checks such as:
  - License present
  - Topics present
  - Description/homepage present
  - Non-fork signal
  - README detection
  - tests/test folder detection

### Diversity (20%)

- Unique language coverage
- Category bucketing from language/topic signals (web, backend, data, cli, etc.)

### Community (20%)

- Stars and forks from owned repositories (fork inflation removed)
- Followers signal
- Small starred-repos engagement signal

### Hiring Ready (15%)

- Bio present
- Website present
- Location/company present
- Non-fork repos present
- Pinned repositories present

## Core Features

- GitHub profile search and report generation
- Shareable report URLs with OpenGraph metadata
- Compare mode with multi-user visual comparison
- Circular score summary, radar chart, language chart, contribution calendar
- Modern responsive UI with navigation between Home, Report, and Compare

## Tech Stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Frontend | React 18, Vite, React Router, Chart.js, Axios, Tailwind |
| Backend  | Node.js, Express, Octokit, dotenv                       |
| Database | MongoDB Atlas + Mongoose                                |
| Hosting  | Vercel (frontend), Render (backend)                     |

## Environment Variables

### Backend (`server/.env`)

- `GITHUB_TOKEN`
- `MONGODB_URI`
- `CLIENT_URL`
- `PORT` (optional, default 5000)
- `JWT_SECRET` (optional)

### Frontend (`client/.env`)

- `VITE_API_URL` (must include `/api` in deployed setup)

Example:

`VITE_API_URL=https://dev-portfolio-evaluator-api.onrender.com/api`

## Local Development

```bash
npm --prefix server install
npm --prefix client install
npm --prefix server run dev
npm --prefix client run dev
```

## API Endpoints

- `GET /api/health`
- `GET /api/profile/:username`
- `GET /api/profile/:username/cached`
- `GET /api/compare?u1=:u1&u2=:u2`

## Deployment Notes

- Vercel rewrite is configured for SPA deep-link refresh support.
- CORS is normalized for trailing-slash origin differences.
- Cache versioning is used to invalidate stale reports after scoring changes.

## Project Journey

For a concise start-to-end implementation summary, see:

- docs/project-journey.md
