# Deployment Guide

## Backend (Render)

1. Create a new Web Service on Render and connect this repository.
2. Set Root Directory to `server`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Add environment variables:

- `GITHUB_TOKEN`
- `MONGODB_URI`
- `PORT=5000`
- `CLIENT_URL=<your vercel url>`
- `JWT_SECRET=<strong random secret>`

## Frontend (Vercel)

1. Create a new Vercel project and connect this repository.
2. Set Root Directory to `client`.
3. Framework preset should auto-detect Vite.
4. Add environment variable:

- `VITE_API_URL=<your render backend url>/api`

## Post-deploy checks

1. Call backend health endpoint: `<render-url>/api/health`.
2. Open frontend URL and search for `octocat`.
3. Verify report loads with score summary and visual components.
4. Verify second request for same username returns cache hit.
5. Verify compare endpoint: `<render-url>/api/compare?u1=octocat&u2=torvalds`.

## Pre-release local checks (from repo root)

1. `npm --prefix server run test:unit`
2. PowerShell: `$env:RUN_INTEGRATION_TESTS='1'; npm --prefix server run test:integration`
3. `npm --prefix client run build`
