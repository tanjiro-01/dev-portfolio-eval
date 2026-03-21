Quick clarifications before I go deep:While you answer that — here's the core of what you need to know for each:

---

## Activity Scoring

The spec gives you a starting point but doesn't tell you _how_ to implement it. Here's a solid approach:

**Data source**: `GET /users/:username/events/public` — returns the last 90 events (push events contain commits).

```js
export function scoreActivity(events) {
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

  // Filter to push events in last 90 days
  const recentPushes = events.filter(
    (e) =>
      e.type === "PushEvent" &&
      new Date(e.created_at).getTime() > ninetyDaysAgo,
  );

  // Count total commits (each PushEvent has e.payload.commits array)
  const totalCommits = recentPushes.reduce(
    (sum, e) => sum + (e.payload.commits?.length ?? 0),
    0,
  );

  // Score commits: 20 commits = max points (scale linearly, cap at 20)
  const commitScore = Math.min(totalCommits / 20, 1) * 20; // 0–20 pts

  // Streak: how many of the last 4 weeks had at least 1 push?
  const weeklyActivity = [0, 1, 2, 3].map((weeksAgo) => {
    const weekStart = now - (weeksAgo + 1) * 7 * 24 * 60 * 60 * 1000;
    const weekEnd = now - weeksAgo * 7 * 24 * 60 * 60 * 1000;
    return recentPushes.some((e) => {
      const t = new Date(e.created_at).getTime();
      return t >= weekStart && t < weekEnd;
    });
  });

  const activeWeeks = weeklyActivity.filter(Boolean).length;
  const streakScore = (activeWeeks / 4) * 5; // 0–5 pts

  // Normalise to 0–100
  return Math.round(((commitScore + streakScore) / 25) * 100);
}
```

**The gotcha**: GitHub's public events API only returns the last 300 events, and only goes back ~90 days. For heavy users this is fine; for inactive accounts you might get nothing. Handle the empty array case explicitly.

---

## Caching + Shareable URLs

There are two separate problems here:

### 1. Report caching (you already have this)

MongoDB with a 24hr TTL — covered in the spec. Nothing more needed for an intern demo.

### 2. Shareable URL stability

The URL `/report/:username` is the shareable link. The concern is: what happens when someone clicks a shared link?

```
User A generates report → cached in MongoDB → shares /report/torvalds
User B clicks link 3 hours later → cache HIT → fast response ✓
User B clicks link 25 hours later → cache MISS → re-fetches GitHub → slower but works ✓
```

This just works with your existing setup. No extra infrastructure needed.

### 3. Load balancing — do you actually need it?

For a Render free-tier deploy: **no**. Single instance, single process, MongoDB handles the cache. The GitHub API rate limit (5,000 req/hr) is the real ceiling, not your server.

If you do get traffic spikes (someone posts it on LinkedIn), the MongoDB cache is your load balancer — most requests never touch GitHub API at all.

If you wanted to go further (overkill for this project but good to know):

```
Browser → Render (single instance)
              ↓
         MongoDB cache ← most requests stop here
              ↓ (cache miss only)
         GitHub API
```

vs a production setup:

```
Browser → CDN (Cloudflare) → caches the JSON response at edge
              ↓ (CDN miss)
         Load Balancer (Render/Railway/Fly.io)
              ↓
         Multiple Express instances
              ↓
         Redis (in-memory cache, faster than MongoDB for hot data)
              ↓ (Redis miss)
         MongoDB (persistent cache)
              ↓ (MongoDB miss)
         GitHub API
```

For this project: **MongoDB cache alone is sufficient.** Redis + CDN is the answer if you want to impress in the interview by explaining _what you'd add at scale_ — even if you don't implement it.

---

**Short answer**: implement the activity scoring with the commit count + weekly streak approach above, and don't overthink the caching — your MongoDB TTL setup already handles shareable URLs correctly. The only thing worth adding is a `Cache-Control` header on the Express response so browsers don't re-request the same report repeatedly within a session:

```js
res.set("Cache-Control", "public, max-age=3600"); // cache in browser for 1hr
res.json(report);
```

Got it. Here's the full advanced activity scorer + the right caching setup for a demo-scale deploy.

---

## Advanced Activity Scoring

Five signals, all from free GitHub API endpoints. Each normalized to a sub-score, then combined into a final 0–100.

```js
// services/scoringService.js — scoreActivity()

export async function scoreActivity(username, events, octokit) {
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

  // ── 1. COMMITS (0–30 pts) ────────────────────────────────────────────────
  const pushes = events.filter(
    (e) =>
      e.type === "PushEvent" &&
      new Date(e.created_at).getTime() > ninetyDaysAgo,
  );
  const totalCommits = pushes.reduce(
    (sum, e) => sum + (e.payload.commits?.length ?? 0),
    0,
  );
  const commitScore = Math.min(totalCommits / 30, 1) * 30;

  // ── 2. WEEKLY STREAK (0–20 pts) ──────────────────────────────────────────
  // How many of the last 8 weeks had at least one push?
  const activeWeeks = Array.from({ length: 8 }, (_, i) => {
    const start = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
    const end = now - i * 7 * 24 * 60 * 60 * 1000;
    return pushes.some((e) => {
      const t = new Date(e.created_at).getTime();
      return t >= start && t < end;
    });
  }).filter(Boolean).length;
  const streakScore = (activeWeeks / 8) * 20;

  // ── 3. PR REVIEWS (0–20 pts) ─────────────────────────────────────────────
  // PullRequestReviewEvent in public events
  const reviewEvents = events.filter(
    (e) =>
      e.type === "PullRequestReviewEvent" &&
      new Date(e.created_at).getTime() > ninetyDaysAgo,
  );
  const reviewScore = Math.min(reviewEvents.length / 10, 1) * 20;

  // ── 4. ISSUE ACTIVITY (0–15 pts) ─────────────────────────────────────────
  // IssuesEvent (opened/closed) + IssueCommentEvent
  const issueEvents = events.filter(
    (e) =>
      (e.type === "IssuesEvent" || e.type === "IssueCommentEvent") &&
      new Date(e.created_at).getTime() > ninetyDaysAgo,
  );
  const issueScore = Math.min(issueEvents.length / 15, 1) * 15;

  // ── 5. RELEASE CADENCE (0–15 pts) ────────────────────────────────────────
  // CreateEvent with ref_type === 'tag' signals a release/version bump
  const releaseEvents = events.filter(
    (e) =>
      e.type === "CreateEvent" &&
      e.payload?.ref_type === "tag" &&
      new Date(e.created_at).getTime() > ninetyDaysAgo,
  );
  // Even 1–2 releases in 90 days is meaningful — max at 3
  const releaseScore = Math.min(releaseEvents.length / 3, 1) * 15;

  // ── COMBINE → 0–100 ──────────────────────────────────────────────────────
  const raw =
    commitScore + streakScore + reviewScore + issueScore + releaseScore;
  return Math.round(raw); // already out of 100
}
```

### Sub-score breakdown

| Signal          | Max pts | Saturates at         | Rationale                               |
| --------------- | ------- | -------------------- | --------------------------------------- |
| Commits         | 30      | 30 commits / 90 days | Core output signal                      |
| Weekly streak   | 20      | Active 8/8 weeks     | Consistency matters more than bursts    |
| PR reviews      | 20      | 10 reviews / 90 days | Shows collaboration, not just solo work |
| Issue activity  | 15      | 15 issues/comments   | Community engagement                    |
| Release cadence | 15      | 3 tags / 90 days     | Ships, doesn't just commit              |

**One thing to watch**: `events/public` returns max 300 events and only ~90 days back. For very active users (100+ events/month) you'll hit the 300 cap before 90 days — their older commits won't count. That's a known GitHub API limitation, not a bug in your code. Worth a comment in the code.

---

## Caching for Demo Scale

For a single Render instance + intern demo, you need exactly three things and nothing more:

### 1. MongoDB TTL — you already have this

The `expiresAt` TTL index auto-deletes stale reports. No change needed.

### 2. One `Cache-Control` header on every report response

```js
// controllers/profileController.js

res.set("Cache-Control", "public, max-age=3600"); // browser caches for 1hr
res.json(report);
```

This means if someone clicks a shared link and then shares it again, the second person's browser might serve it from local cache — zero server hits. For a demo this is plenty.

### 3. Your cache middleware already IS your load protection

```
Request hits Render
  ↓
checkCache middleware → MongoDB lookup
  ├── HIT  → respond in ~20ms, GitHub API never touched
  └── MISS → fetch GitHub (4 API calls) → score → write MongoDB → respond
```

The only way you get hammered is if 100 people simultaneously search 100 _different_ usernames that aren't cached yet. For a demo: won't happen.

---

## What You Don't Need (and why)

| Thing                              | Why you'd add it at scale                         | Why to skip it now                       |
| ---------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| Redis                              | Faster than MongoDB for hot cache (~1ms vs ~20ms) | MongoDB at 20ms is fine for a demo       |
| Horizontal scaling / load balancer | Multiple Render instances behind a balancer       | Render free tier is one instance anyway  |
| CDN (Cloudflare)                   | Cache JSON responses at edge globally             | Overkill, adds DNS complexity            |
| Queue (BullMQ)                     | Rate-limit GitHub fetches under traffic           | You won't hit 5,000 req/hr with one user |

---

## The One Thing Worth Adding for the Interview

Even though you don't need Redis, knowing _when_ you'd add it makes you look sharp. If an interviewer asks "how would this scale?":

> "Right now MongoDB handles caching at ~20ms — fine for demo. Under real traffic I'd put Redis in front of Mongo as a hot cache layer, dropping repeat lookups to ~1ms. The GitHub API rate limit (5,000/hr) is the actual ceiling, so I'd also add a request queue with BullMQ to batch cache-miss fetches instead of firing them all at GitHub simultaneously."

That's the right answer. You don't have to build it.
