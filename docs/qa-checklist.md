# QA Checklist

## Automated checks

1. Backend unit tests

- Command: `npm --prefix server run test:unit`
- Expectation: all tests pass

2. Backend integration tests

- Command (PowerShell): `$env:RUN_INTEGRATION_TESTS='1'; npm --prefix server run test:integration`
- Expectation: endpoint behavior checks pass for `/api/profile/:username/cached` and `/api/compare`

3. Frontend build

- Command: `npm --prefix client run build`
- Expectation: build completes without errors

## Manual checks

1. Health endpoint

- `GET /api/health` returns `{ status: "ok" }`

2. Profile report flow

- `GET /api/profile/octocat` returns scored report with `scores`, `topRepos`, `languages`
- First request should return `cache.hit = false` for fresh users
- Repeated request should return `cache.hit = true`

3. Cached endpoint

- `GET /api/profile/octocat/cached` returns 200 for existing cached entry
- `GET /api/profile/unknown-user/cached` returns 404 with friendly message

4. Compare endpoint

- `GET /api/compare?u1=octocat&u2=torvalds` returns `users` and `winners`
- Missing query params returns 400
- Same username for both params returns 400

5. Frontend pages

- Home page loads and accepts username search
- Report page shows loading, error, and success states
- Radar chart, language bars, and heatmap render correctly
