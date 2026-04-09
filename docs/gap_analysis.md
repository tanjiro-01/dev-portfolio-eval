# Portfolio Evaluator — Activity & Heatmap Gap Analysis

## 🔎 The Problem: Two Very Different Things Being Measured

GitHub's profile page shows **1,524 contributions in the last year** with a dense green heatmap for `jamesgeorge007`. Your evaluator shows **Activity: 1/100** and a near-empty 12-week heatmap. These are measuring completely different things.

---

## Root Cause 1 — The Events API Hard Cap

The entire evaluator is built on **`GET /users/{username}/events`** (via Octokit's `listPublicEventsForUser`). This is the wrong data source for measuring activity.

> [!CAUTION]
> The GitHub REST Events API only returns **the most recent 300 events**, covering between **~30 and 90 days** depending on how active the user is. For highly active users like `jamesgeorge007` who push every day, 300 events fills up in under 30 days.

GitHub's own contribution graph, however, counts **every commit, PR review, issue, discussion, and comment** aggregated over **the full past year** using their internal data warehouse — not accessible via the same REST endpoint.

### What this means in practice:

| Signal | GitHub Profile | Your Evaluator |
|--------|---------------|----------------|
| Data window | 365 days | ~30–90 days (300 event cap) |
| Commit counting | All commits in any repo | Only PushEvents via REST |
| Private repo activity | ✅ Counted (if opted in) | ❌ Never visible via public API |
| PR merges, reviews | ✅ Counted separately | ❌ Ignored entirely |
| Issue comments | ✅ Counted | ❌ Ignored entirely |

---

## Root Cause 2 — Activity Scoring is Extremely Strict

Even after extracting the events from the API, the activity score formula is broken for active users:

```js
// scoringService.js — scoreActivity()
const recentPushes = events.filter(
  (event) => event.type === "PushEvent" && created_at > ninetyDaysAgo
);
const totalCommits = recentPushes.reduce(
  (sum, event) => sum + (event.payload?.commits?.length || 0), 0
);

const commitPoints = Math.min(totalCommits / 20, 1) * 20; // max 20 pts for 20+ commits
const streakPoints  = longestStreak * 0.05;               // max 5 pts

return roundScore(((commitPoints + streakPoints) / 25) * 100);
```

> [!WARNING]
> The final formula `((commitPoints + streakPoints) / 25) * 100` divides by **25** but the maximum possible points are `20 + 5 = 25`. The math works out only if a user has both max consecutive streak **and** 20+ commits. In practice, since the event window is truncated, most users get 0–3 commits returned, yielding a score in the 0–15 range.

### Why `jamesgeorge007` gets Activity: 1

1. The API returns ~300 recent events, covering perhaps 2–3 weeks for this very active user.
2. Many of those events are `PullRequestEvent`, `IssueCommentEvent`, etc., **not** `PushEvent`.
3. After filtering to only `PushEvent` types within 90 days, maybe 1–2 push events survive.
4. `payload.commits` can sometimes contain a very short array (GitHub truncates it to 20/push).
5. Result: maybe 2 commits → `commitPoints = Math.min(2/20, 1) * 20 = 2` → score ≈ **8**.

---

## Root Cause 3 — Heatmap Data is Also from the Events API

```js
// reportService.js — toHeatmapData()
const pushEvents = events.filter((event) => event.type === "PushEvent");
const countByDate = pushEvents.reduce((acc, event) => {
  const key = new Date(event.created_at).toISOString().slice(0, 10);
  acc[key] = (acc[key] || 0) + (event.payload?.commits?.length || 1);
  return acc;
}, {});

// Only 84 days (12 weeks) are rendered
const start = new Date();
start.setDate(start.getDate() - 83);
```

Three cascading problems:

1. **Only 12 weeks (84 days) are shown**, while GitHub shows 52 weeks (365 days).
2. **Data source is capped at 300 events**, so days outside the most recent ~30 days appear empty even if the developer was active.
3. **Only `PushEvent` is counted**, so PRs, reviews, issues, comments — which are counted on GitHub — don't appear.

---

## ✅ Recommended Fixes

### Fix 1 — Use the GraphQL Contribution API (biggest impact)

GitHub's GraphQL API exposes the **full contribution calendar** with no REST event cap:

```graphql
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalRepositoryContributions
      restrictedContributionsCount  # private, if user has opted in
    }
  }
}
```

This gives the **exact same data** that GitHub's heatmap renders from, with a `from`/`to` date range up to 1 year.

### Fix 2 — Rewrite Activity Scoring to use `contributionsCollection`

Replace the entire `scoreActivity` function to use the `totalContributions` and `contributionCalendar` data:

```js
// Proposed new approach
export const scoreActivity = (contributionCalendar) => {
  const days = contributionCalendar.weeks.flatMap(w => w.contributionDays);
  const last90 = days.filter(d => daysDiff(d.date) <= 90);
  
  const totalContribs = last90.reduce((s, d) => s + d.contributionCount, 0);
  const activeDays = last90.filter(d => d.contributionCount > 0).length;
  const maxStreak = computeStreak(days);
  
  const volumeScore = Math.min(totalContribs / 200, 1) * 40;   // 200 contribs = max
  const consistencyScore = Math.min(activeDays / 60, 1) * 40;  // 60 active days = max
  const streakScore = Math.min(maxStreak / 30, 1) * 20;        // 30-day streak = max
  
  return roundScore(volumeScore + consistencyScore + streakScore);
};
```

### Fix 3 — Extend Heatmap to 52 Weeks

Change `reportService.js` to build the heatmap from GraphQL data spanning 365 days instead of 84:

```js
const toHeatmapData = (contributionCalendar) => {
  return contributionCalendar.weeks.flatMap(week =>
    week.contributionDays.map(day => ({
      date: day.date,
      count: day.contributionCount,
    }))
  );
};
```

---

## Summary Table

| Issue | Current Behavior | Proposed Fix |
|-------|-----------------|-------------|
| **Data source** | REST Events API (max 300 events) | GraphQL `contributionsCollection` |
| **Heatmap window** | 12 weeks only | 52 weeks (full year) |
| **What counts** | Push events only | All contribution types |
| **Activity score ceiling** | Nearly unreachable for active devs | Balanced 3-factor formula |
| **Private contributions** | Never counted | Counted if user opted in |

Implementing Fix 1 (GraphQL source) would simultaneously solve all three issues since activity scoring and heatmap building would both be derived from the richer, uncapped data.
