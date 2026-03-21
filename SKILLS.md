# Skills — Developer Portfolio Evaluator

A practical reference for every technology used in this project. Read this before you write your first line of code.

---

## React 18 + Vite

**What it is**: The UI framework + build tool. Vite replaces Create React App — it's faster and produces smaller bundles.

**Key concepts you'll use**

```jsx
// useState — local component state
const [report, setReport] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

// useEffect — run code when component mounts or a value changes
useEffect(() => {
  fetchReport(username);
}, [username]);  // re-runs whenever username changes
```

**When to reach for it**: Every piece of UI. If something changes on screen, it's driven by state.

**Gotcha**: Don't call `setReport` inside the render function — only inside event handlers or `useEffect`.

---

## React Router v6

**What it is**: Client-side routing — navigating between pages without a full page reload.

```jsx
// App.jsx — define routes
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/report/:username" element={<Report />} />
  </Routes>
</BrowserRouter>

// Report.jsx — read the :username param
import { useParams, useNavigate } from 'react-router-dom';
const { username } = useParams();

// SearchBar.jsx — navigate programmatically
const navigate = useNavigate();
navigate(`/report/${username}`);
```

**Key hooks**: `useParams`, `useNavigate`, `useLocation`.

---

## Axios

**What it is**: HTTP client for the browser. Cleaner than `fetch` — handles JSON parsing and error status codes automatically.

```js
// src/utils/api.js  ← ALL axios calls live here, nowhere else
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // reads from client/.env
});

export const getReport = (username) => api.get(`/profile/${username}`);
export const compareProfiles = (u1, u2) => api.get(`/compare?u1=${u1}&u2=${u2}`);
```

**Error handling**:
```js
try {
  const { data } = await getReport(username);
  setReport(data);
} catch (err) {
  // err.response.status gives you 404, 403, 500 etc.
  setError(err.response?.data?.message || 'Something went wrong');
}
```

---

## Chart.js

**What it is**: Canvas-based charting library. You'll use three chart types.

### Radar Chart (5 category scores)
```js
import { Radar } from 'react-chartjs-2';
import { Chart, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
Chart.register(RadialLinearScale, PointElement, LineElement, Filler);

const data = {
  labels: ['Activity', 'Code Quality', 'Diversity', 'Community', 'Hiring Ready'],
  datasets: [{
    label: username,
    data: [activity, codeQuality, diversity, community, hiringReady],
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgb(99, 102, 241)',
  }]
};
```

### Bar Chart (language distribution)
```js
import { Bar } from 'react-chartjs-2';
```

### Heatmap (contribution grid)
Chart.js doesn't have a built-in heatmap — build it as an SVG grid or use a library like `react-calendar-heatmap`.

**Gotcha**: You must `Chart.register(...)` every component you use or Chart.js will throw a runtime error.

---

## Node.js + Express

**What it is**: The backend server. Express adds routing and middleware on top of Node.

```js
// app.js — minimal setup
import express from 'express';
import cors from 'cors';
import profileRoutes from './routes/profileRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use('/api', profileRoutes);
app.use(errorHandler);  // always last
```

```js
// routes/profileRoutes.js
import { Router } from 'express';
import { getProfile, getCached, compareProfiles } from '../controllers/profileController.js';
import { checkCache } from '../middleware/cache.js';

const router = Router();
router.get('/profile/:username', checkCache, getProfile);
router.get('/profile/:username/cached', getCached);
router.get('/compare', compareProfiles);
router.get('/health', (req, res) => res.json({ status: 'ok' }));
export default router;
```

---

## Octokit (`@octokit/rest`)

**What it is**: GitHub's official JS SDK. Handles auth headers and pagination automatically.

```js
// services/githubService.js
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function getUser(username) {
  const { data } = await octokit.rest.users.getByUsername({ username });
  return data;
}

export async function getRepos(username) {
  const { data } = await octokit.rest.repos.listForUser({
    username,
    per_page: 100,
    sort: 'updated',
  });
  return data;
}

export async function getEvents(username) {
  const { data } = await octokit.rest.activity.listPublicEventsForUser({
    username,
    per_page: 100,
  });
  return data;
}

export async function getRepoContents(owner, repo) {
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path: '' });
    return data;
  } catch {
    return [];  // repo might be empty
  }
}
```

**Parallelise independent calls**:
```js
const [user, repos, events] = await Promise.all([
  getUser(username),
  getRepos(username),
  getEvents(username),
]);
```

**Rate limit**: With a PAT you get 5,000 requests/hour. Each profile lookup costs ~4 calls + 1 per repo for content checks — cache aggressively.

---

## Scoring Service

**What it is**: A pure function — takes raw API data, returns scores. No async, no database, no imports besides utility functions.

```js
// services/scoringService.js

export function computeScores(user, repos, events) {
  const activity    = scoreActivity(events);      // 0–100
  const codeQuality = scoreCodeQuality(repos);    // 0–100
  const diversity   = scoreDiversity(repos);      // 0–100
  const community   = scoreCommunity(user, repos);// 0–100
  const hiringReady = scoreHiringReady(user);     // 0–100

  const overall = Math.round(
    activity    * 0.25 +
    codeQuality * 0.20 +
    diversity   * 0.20 +
    community   * 0.20 +
    hiringReady * 0.15
  );

  return { activity, codeQuality, diversity, community, hiringReady, overall };
}
```

**Keep scoring logic here and only here.** The controller shouldn't know how scores work. The scoring service shouldn't know about HTTP or MongoDB.

---

## MongoDB + Mongoose

**What it is**: MongoDB Atlas is the cloud database. Mongoose gives you schemas, validation, and a query API.

```js
// config/db.js
import mongoose from 'mongoose';

export async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
}
```

```js
// Common query patterns you'll use

// Find one document
const report = await Report.findOne({ username });

// Create or update (upsert)
await Report.findOneAndUpdate(
  { username },
  { ...reportData, cachedAt: new Date(), expiresAt: new Date(Date.now() + 86_400_000) },
  { upsert: true, new: true }
);
```

**TTL index**: The `expiresAt` field in the schema has `{ expires: 0 }` — MongoDB automatically deletes the document when `expiresAt` is reached. You don't need to write cleanup code.

---

## Cache Middleware

```js
// middleware/cache.js
import Report from '../models/Report.js';

export async function checkCache(req, res, next) {
  const { username } = req.params;
  const cached = await Report.findOne({ username });

  if (cached) {
    return res.json(cached);  // short-circuit — don't hit GitHub API
  }

  next();  // cache miss — continue to controller
}
```

---

## Error Handling

```js
// middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
}

// In controllers, throw with a status so errorHandler picks it up:
const error = new Error('GitHub user not found');
error.status = 404;
throw error;
```

Common HTTP errors to handle:
- `404` — username doesn't exist on GitHub
- `403` — rate limit exceeded (check `x-ratelimit-remaining` header)
- `500` — something broke server-side

---

## JWT + bcrypt (Optional Auth)

Only needed if you add user accounts (to save favourite reports). Skip for the core build.

```js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Hash password before saving to DB
const hashed = await bcrypt.hash(plainTextPassword, 10);

// Create token on login
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Verify token in a middleware
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

---

## node-cron (Optional)

For scheduled jobs — e.g., a nightly sweep that re-warms popular profiles.

```js
import cron from 'node-cron';

// Runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running cache cleanup...');
  // MongoDB TTL handles deletion, but you can log stats here
});
```

---

## Shareable URLs + OpenGraph

**Client-side**: every report lives at `/report/:username` — that IS the shareable URL. Add a copy button:

```js
navigator.clipboard.writeText(window.location.href);
```

**OpenGraph** (makes LinkedIn previews work): set meta tags dynamically in `Report.jsx`:

```jsx
// Using react-helmet or direct DOM manipulation
document.title = `${username}'s GitHub Score | Portfolio Evaluator`;
// <meta property="og:title" content="..." />
// <meta property="og:description" content="Overall score: 78/100" />
// <meta property="og:image" content={avatarUrl} />
```

For proper SSR-based OG tags (crawlers don't run JS), you'd need Next.js or a server-side render step. For this project, setting them client-side is acceptable.

---

## Environment Variables

| Variable | Where | Value |
|----------|-------|-------|
| `MONGODB_URI` | `server/.env` | Atlas connection string |
| `GITHUB_TOKEN` | `server/.env` | PAT with `read:user`, `public_repo` |
| `PORT` | `server/.env` | `5000` |
| `JWT_SECRET` | `server/.env` | Random string, 32+ chars |
| `CLIENT_URL` | `server/.env` | `http://localhost:5173` (dev) / Vercel URL (prod) |
| `VITE_API_URL` | `client/.env` | `http://localhost:5000/api` (dev) / Render URL (prod) |

**Rules**:
- Both `.env` files go in `.gitignore` before the first commit.
- Prefix all client-side env vars with `VITE_` — otherwise Vite won't expose them to the browser.
- On Vercel/Render, set these in the platform dashboard, not in committed files.

---

## Deployment Checklist

### Vercel (frontend)
1. Push `client/` to GitHub
2. Import repo in Vercel → set **Root Directory** to `client`
3. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`
4. Deploy

### Render (backend)
1. Push `server/` to GitHub
2. Create **Web Service** → set **Root Directory** to `server`
3. Build command: `npm install`
4. Start command: `node app.js` (or `npm start`)
5. Add all `server/.env` vars in the Environment tab
6. Deploy

### MongoDB Atlas
1. Create free M0 cluster
2. Create a database user (username + password)
3. Whitelist IP: `0.0.0.0/0` (allows Render's dynamic IPs)
4. Copy the connection string → paste into `MONGODB_URI`

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| `VITE_` prefix missing | Browser can't read the env var — prefix all client vars with `VITE_` |
| Committing `.env` | Add `**/.env` to `.gitignore` before `git init` |
| CORS error in browser | Set `CLIENT_URL` on backend to exact Vercel URL (no trailing slash) |
| Chart.js blank canvas | Call `Chart.register(...)` with every component you use |
| GitHub 403 on deploy | Token missing on Render — add `GITHUB_TOKEN` in environment settings |
| MongoDB timeout | Atlas IP whitelist — add `0.0.0.0/0` or Render's static IP |
| `console.log` in prod | Search codebase with `grep -r "console.log" server/` before submitting |
