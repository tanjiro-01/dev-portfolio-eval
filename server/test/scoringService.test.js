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

test("scoreCodeQuality rewards metadata-rich repos", () => {
  const repos = [
    {
      license: { spdx_id: "MIT" },
      topics: ["react", "node"],
      description: "Great repo",
      homepage: "https://example.com",
      fork: false,
    },
  ];

  assert.equal(scoreCodeQuality(repos), 100);
});

test("computeScores returns bounded category scores and overall", () => {
  const user = {
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

  const scores = computeScores(user, repos, []);

  for (const value of Object.values(scores)) {
    assert.ok(value >= 0 && value <= 100);
  }
});
