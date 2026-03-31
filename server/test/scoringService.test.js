import test from "node:test";
import assert from "node:assert/strict";

import {
  computeScores,
  scoreActivity,
  scoreCodeQuality,
} from "../src/services/scoringService.js";

test("scoreActivity returns 0 for empty events", () => {
  assert.equal(scoreActivity([]), 0);
});

test("scoreActivity returns high score for consistent pushes", () => {
  const now = Date.now();
  // Create events for 50 consecutive days with commits
  const events = Array.from({ length: 50 }, (_, day) => ({
    type: "PushEvent",
    created_at: new Date(now - (50 - day) * 24 * 60 * 60 * 1000).toISOString(),
    payload: {
      commits: Array.from({ length: 6 }, (_, index) => ({
        sha: `sha-${day}-${index}`,
      })),
    },
  }));

  // With 50-day streak (50/365 * 100 * 0.05 = 0.68 streak points) + high commits
  // Total should be high
  const score = scoreActivity(events);
  assert.ok(score >= 60, `Expected score >= 60, got ${score}`);
});

test("scoreCodeQuality rewards metadata-rich repos", async () => {
  const repos = [
    {
      license: { spdx_id: "MIT" },
      topics: ["react", "node"],
      description: "Great repo",
      homepage: "https://example.com",
      fork: false,
    },
  ];

  // Call without githubService (null) to test basic scoring
  // Scores 5/10 on basic signals (no README/tests detection), so 50%
  const score = await scoreCodeQuality(repos, "testuser", null);
  assert.ok(score === 50);
});

test("computeScores returns bounded category scores and overall", async () => {
  const user = {
    login: "testuser",
    followers: 10,
    bio: "Developer",
    blog: "https://example.com",
    email: "dev@example.com",
  };

  const repos = [
    {
      language: "JavaScript",
      topics: ["web"],
      stargazers_count: 4,
      forks_count: 2,
      license: { spdx_id: "MIT" },
      description: "repo",
      homepage: "https://example.com",
      fork: false,
    },
  ];

  const scores = await computeScores(user, repos, [], {
    githubService: null,
    username: "testuser",
  });

  for (const value of Object.values(scores)) {
    assert.ok(value >= 0 && value <= 100);
  }
});
