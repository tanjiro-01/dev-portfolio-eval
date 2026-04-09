# Project Journey (Start to End)

## 1. Problem and Scope

Built a full-stack portfolio evaluator that scores public GitHub profiles across:

- Activity
- Code Quality
- Diversity
- Community Impact
- Hiring Readiness

Core goals:

- Fast report generation
- Shareable profile report URLs
- Compare mode for multiple profiles
- Cached responses to reduce API pressure

## 2. Backend Milestones

1. Implemented profile, compare, and health API endpoints.
2. Added scoring engine with weighted category outputs.
3. Added repository quality checks (README and tests folder detection).
4. Added pinned repo signal via GraphQL.
5. Added contribution calendar via GraphQL for full-year activity fidelity.
6. Added retry handling for GitHub rate limits.
7. Added cache versioning to invalidate stale reports after scoring updates.
8. Added CORS normalization to handle trailing slash origin mismatches.

## 3. Frontend Milestones

1. Built search-first landing page and report route.
2. Added circular score summary, radar chart, language distribution, top repos.
3. Upgraded contribution calendar rendering and loading skeletons.
4. Added compare mode with multi-user overlays and presets.
5. Added top navigation across pages for easier movement.
6. Added Vercel SPA rewrite for deep-link refresh support.
7. Updated UI theme to modern blue/cyan/emerald palette.

## 4. Data and Cache Behavior

- MongoDB stores per-username cached report payloads.
- Cache TTL is 24 hours.
- Cache version is used to bypass stale reports when algorithms change.

## 5. Deployment and Operations

- Frontend hosted on Vercel.
- Backend hosted on Render.
- Environment variables managed per platform.
- Health endpoint used for runtime checks.

## 6. Current State

- End-to-end report flow is operational.
- Shareable report links are supported.
- Direct route refresh works on Vercel.
- CORS and API base URL alignment issues were fixed.
