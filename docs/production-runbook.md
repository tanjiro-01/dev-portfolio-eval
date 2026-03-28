# Production Runbook

This runbook covers deploy, verification, and rollback for production.

## 1. Environment Matrix

### Backend (Render)

- Service root: `server`
- Build command: `npm install`
- Start command: `npm start`
- Required vars:
  - `GITHUB_TOKEN`
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CLIENT_URL`
  - `PORT` (optional if platform injects)

### Frontend (Vercel)

- Project root: `client`
- Framework: Vite
- Required vars:
  - `VITE_API_URL` (example: `https://your-backend.onrender.com/api`)

## 2. Pre-Deploy Validation

Run locally before each release:

1. `npm --prefix server run test:unit`
2. PowerShell: `$env:RUN_INTEGRATION_TESTS='1'; npm --prefix server run test:integration`
3. `npm --prefix client run build`

These commands are designed to run from the repository root.

If any command fails, stop deployment and fix before proceeding.

## 3. Release Procedure

1. Merge release commit to `main`.
2. Wait for CI to complete successfully.
3. Deploy backend (Render auto deploy or manual trigger).
4. Deploy frontend (Vercel auto deploy or manual trigger).
5. Run smoke checks immediately after deploy.

## 4. Smoke Checks

Run these checks against production URLs:

1. `GET /api/health` returns `{ "status": "ok" }`.
2. `GET /api/profile/octocat` returns report payload with:

- `scores`
- `topRepos`
- `languages`
- `cache` metadata

3. Call the same profile endpoint twice and verify miss -> hit transition.
4. `GET /api/compare?u1=octocat&u2=torvalds` returns two users and winners map.
5. Frontend:

- Home search opens report page.
- Compare page loads and renders winners.

## 5. Operational Guardrails

- Do not expose tokens in logs or screenshots.
- Rotate `GITHUB_TOKEN` if exposure is suspected.
- Keep `CLIENT_URL` strict (production origin only).
- Monitor GitHub API rate usage during demos.

## 6. Rollback Procedure

If production behavior regresses:

1. Revert to the previous known-good commit on `main`.
2. Trigger backend and frontend redeploy from that commit.
3. Re-run smoke checks.
4. Record root cause and follow-up fixes before re-releasing.

## 7. Incident Quick Triage

1. Health fails:

- Check Render logs for startup/env errors.
- Confirm `MONGODB_URI` and token availability.

2. Frontend cannot fetch API:

- Validate `VITE_API_URL` value.
- Check backend CORS `CLIENT_URL` setting.

3. Compare/profile endpoints fail for valid users:

- Check GitHub rate limit and token scope.
- Validate Mongo connectivity for cache writes.
