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
  const events = [0, 1, 2, 3].map((week) => ({
    type: "PushEvent",
    created_at: new Date(now - week * 7 * 24 * 60 * 60 * 1000).toISOString(),
    payload: {
      commits: Array.from({ length: 6 }, (_, index) => ({
        sha: `sha-${week}-${index}`,
      })),
    },
  }));

  assert.ok(scoreActivity(events) >= 80);
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
