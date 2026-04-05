# Developer Portfolio Evaluator

Full-stack MERN application that evaluates any public GitHub profile and produces a scoring report across activity, code quality, diversity, community impact, and hiring readiness.

## Live Demo

- Frontend (Vercel): `ADD_YOUR_VERCEL_URL_HERE`
- Backend (Render): `ADD_YOUR_RENDER_URL_HERE`

## Core Features

- GitHub username search with graceful error handling
- Scorecard with 5 categories and weighted overall score
- Circular progress ring, radar chart, heatmap calendar, and language bar chart
- Top repositories list with language pills, stars, and forks
- Shareable report routes at `/report/:username` with OpenGraph tags
- Compare mode for side-by-side profile analysis
- MongoDB caching (24-hour TTL)

## Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Frontend   | React 18, Vite, React Router, Chart.js, Axios |
| Backend    | Node.js, Express, Octokit, dotenv, node-cron  |
| Database   | MongoDB Atlas, Mongoose                       |
| Deployment | Vercel (frontend), Render (backend)           |

## Project Structure

```text
dev-portfolio-evaluator/
	client/    # React + Vite frontend
	server/    # Express API + scoring engine
	docs/      # planning, gap analysis, implementation notes
```

## Environment Variables

### Server (`server/.env`)

| Variable       | Required    | Description                                         | Example                 |
| -------------- | ----------- | --------------------------------------------------- | ----------------------- |
| `MONGODB_URI`  | Recommended | MongoDB Atlas connection string (cache persistence) | `mongodb+srv://...`     |
| `GITHUB_TOKEN` | Yes         | GitHub personal access token                        | `ghp_xxx`               |
| `CLIENT_URL`   | Yes         | Allowed frontend origin for CORS                    | `http://localhost:5173` |
| `PORT`         | No          | Backend port                                        | `5000`                  |
| `JWT_SECRET`   | No          | Reserved for optional auth extension                | `any-random-string`     |

### Client (`client/.env`)

| Variable       | Required | Description          | Example                     |
| -------------- | -------- | -------------------- | --------------------------- |
| `VITE_API_URL` | Yes      | Backend API base URL | `http://localhost:5000/api` |

## Local Setup

1. Install dependencies

```bash
npm --prefix client install
npm --prefix server install
```

2. Create env files

```bash
copy server/.env.example server/.env
copy client/.env.example client/.env
```

3. Run development servers

```bash
npm --prefix server run dev
npm --prefix client run dev
```

## API Endpoints

| Method | Endpoint                        | Description                           |
| ------ | ------------------------------- | ------------------------------------- |
| `GET`  | `/api/profile/:username`        | Build or return cached profile report |
| `GET`  | `/api/profile/:username/cached` | Return cached report only             |
| `GET`  | `/api/compare?u1=:u1&u2=:u2`    | Compare two GitHub users              |
| `GET`  | `/api/health`                   | Server and DB health check            |

## Deployment

### Frontend (Vercel)

1. Import repository into Vercel
2. Set `VITE_API_URL` to your Render backend URL + `/api`
3. Deploy and copy live URL into the "Live Demo" section above

### Backend (Render)

1. Create Web Service from this repository
2. Set environment variables: `GITHUB_TOKEN`, `CLIENT_URL`, `MONGODB_URI`, `PORT`
3. Deploy and copy live URL into the "Live Demo" section above

## Validation Commands

```bash
npm --prefix server run test:unit
npm --prefix client run build
```
