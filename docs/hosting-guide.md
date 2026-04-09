# Hosting Guide (Render + Vercel)

This guide covers hosting the backend on Render and the frontend on Vercel for this repository.

## 1. Prerequisites

- GitHub repository pushed and up to date.
- MongoDB Atlas connection string ready.
- GitHub token created with at least public profile/repo read access.
- Two deployment targets:
  - Render (backend)
  - Vercel (frontend)

## 2. Backend Hosting on Render

### 2.1 Create Service

1. Open Render dashboard.
2. Click New + and choose Web Service.
3. Connect your GitHub repository.
4. Configure:
   - Name: dev-portfolio-evaluator-api (or any name)
   - Root Directory: server
   - Environment: Node
   - Build Command: npm install
   - Start Command: npm start

### 2.2 Backend Environment Variables

Add these in Render service settings:

- GITHUB_TOKEN = your token
- MONGODB_URI = your Atlas URI
- PORT = 5000
- CLIENT_URL = your frontend URL (set after Vercel deploy)
- JWT_SECRET = optional (only needed if auth is added)

### 2.3 Deploy and Verify Backend

After first deploy, verify:

- GET https://YOUR_RENDER_URL/api/health returns status ok.
- GET https://YOUR_RENDER_URL/api/profile/octocat returns profile JSON.

## 3. Frontend Hosting on Vercel

### 3.1 Create Project

1. Open Vercel dashboard.
2. Click Add New... then Project.
3. Import the same GitHub repository.
4. Configure:
   - Framework preset: Vite
   - Root Directory: client

### 3.2 Frontend Environment Variable

Set:

- VITE_API_URL = https://YOUR_RENDER_URL/api

Then deploy.

## 4. Connect Both Sides (CORS)

After Vercel gives you the frontend URL:

1. Go back to Render backend env vars.
2. Update CLIENT_URL to your Vercel URL.
3. Trigger a redeploy on Render.

Example:

- CLIENT_URL = https://your-app.vercel.app
- VITE_API_URL = https://your-api.onrender.com/api

## 5. Post-Deploy Smoke Tests

Run these checks in order:

1. Backend health
   - Open https://YOUR_RENDER_URL/api/health
2. Search flow
   - Open frontend URL
   - Search octocat
3. Report direct route
   - Open https://YOUR_VERCEL_URL/report/octocat
4. Compare API
   - Open https://YOUR_RENDER_URL/api/compare?u1=octocat&u2=torvalds
5. Cache behavior
   - Request same profile twice and verify cache hit in response

## 6. Required Values for README Submission

Update README with real links before submission:

- Frontend (Vercel) URL
- Backend (Render) URL

## 7. Common Issues and Fixes

### Issue A: Frontend loads but API calls fail

Symptoms:

- Network errors in browser.

Fix:

- Ensure VITE_API_URL points to backend + /api.
- Redeploy frontend after changing env var.

### Issue B: CORS blocked in browser

Symptoms:

- CORS error in console.

Fix:

- Set CLIENT_URL in Render exactly to deployed Vercel domain.
- Redeploy backend.

### Issue C: Activity score looks stale after scoring updates

Fix:

- Restart backend deployment.
- Re-fetch profile to force rebuild if cache version changed.

### Issue D: Backend says token not configured

Fix:

- Set GITHUB_TOKEN in Render env vars.
- Confirm no extra spaces in key/value.
- Redeploy backend.

## 8. Recommended Deployment Order

1. Deploy backend on Render first.
2. Deploy frontend on Vercel with backend URL.
3. Update backend CLIENT_URL to frontend URL.
4. Run smoke tests.

## 9. Optional: Custom Domain

- Add custom domain in Vercel for frontend.
- Add custom domain in Render for backend if needed.
- Update env vars to new domains and redeploy both.

## 10. Quick Checklist

- Backend deployed on Render
- Frontend deployed on Vercel
- VITE_API_URL set correctly
- CLIENT_URL set correctly
- Health endpoint OK
- Search/report/compare working
- README links updated
