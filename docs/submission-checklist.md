# Final Submission Checklist

Use this checklist before submitting the project.

## Repository hygiene

- [ ] `main` branch is up to date and no accidental debug code is present.
- [ ] Commit history is clear, with Day-based messages describing each milestone.
- [ ] Sensitive credentials are not committed to tracked files.
- [ ] `README.md` includes setup steps, architecture summary, and local run commands.

## Backend readiness

- [ ] `server/.env` (or platform env vars) includes: `GITHUB_TOKEN`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `PORT`.
- [ ] `npm run test:unit` passes in `server/`.
- [ ] `npm run test:integration` passes in `server/` with `RUN_INTEGRATION_TESTS=1`.
- [ ] Backend smoke checks pass:
  - [ ] `GET /api/health`
  - [ ] `GET /api/profile/:username`
  - [ ] `GET /api/profile/:username/cached`
  - [ ] `GET /api/compare?u1=&u2=`

## Frontend readiness

- [ ] `client/.env` includes `VITE_API_URL` pointing to backend `/api` base.
- [ ] `npm run build` passes in `client/`.
- [ ] Home search flow works and navigates to `/report/:username`.
- [ ] Compare flow works from home and renders `/compare?u1=&u2=` results.
- [ ] Visual components render correctly (score summary, radar, language bars, heatmap).

## Deployment checks

- [ ] Backend deployed on Render and health endpoint is reachable.
- [ ] Frontend deployed on Vercel and can call backend without CORS errors.
- [ ] Cache behavior verified in production:
  - [ ] first request shows miss
  - [ ] repeated request shows hit

## Demo handoff

- [ ] Prepare 2 demo usernames for comparison mode.
- [ ] Prepare 1 fallback username in case of GitHub API rate pressure.
- [ ] Keep a 2 to 3 minute walkthrough script ready.
- [ ] Include links to deployed frontend, backend, and key docs in submission.
