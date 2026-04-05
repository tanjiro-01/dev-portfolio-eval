import test from "node:test";
import assert from "node:assert/strict";

import {
  computeScores,
  scoreActivity,
  scoreCodeQuality,
  scoreDiversity,
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

  // With 50-day streak (50/90 * 100 * 0.05 = 2.78 streak points) + high commits
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
  // Scores 5/9 on basic signals (no README/tests detection), so 56%
  const score = await scoreCodeQuality(repos, "testuser", null);
  assert.equal(score, 56);
});

test("scoreDiversity rewards category coverage, not just repeated tags", () => {
  const repos = [
    {
      language: "JavaScript",
      topics: ["web", "react"],
    },
    {
      language: "Python",
      topics: ["data", "analytics"],
    },
    {
      language: "Go",
      topics: ["cli", "tooling"],
    },
  ];

  const score = scoreDiversity(repos);
  assert.ok(score > 0);
  assert.ok(score <= 100);
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
    pinnedRepos: [],
  });

  for (const value of Object.values(scores)) {
    assert.ok(value >= 0 && value <= 100);
  }
});

test("computeScores boosts community score when starred repos are present", async () => {
  const user = {
    login: "testuser",
    followers: 10,
    bio: "Developer",
    blog: "https://example.com",
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

  const withoutStarred = await computeScores(user, repos, [], {
    githubService: null,
    username: "testuser",
    starredRepos: [],
    pinnedRepos: [],
  });

  const withStarred = await computeScores(user, repos, [], {
    githubService: null,
    username: "testuser",
    starredRepos: Array.from({ length: 20 }, (_, i) => ({ id: i + 1 })),
    pinnedRepos: [],
  });

  assert.ok(withStarred.community > withoutStarred.community);
});

test("computeScores excludes forked repo stars from community score", async () => {
  const user = {
    login: "testuser",
    followers: 10,
    bio: "Developer",
    blog: "https://example.com",
  };

  const reposWithoutForkBoost = [
    {
      language: "JavaScript",
      topics: ["web"],
      stargazers_count: 1,
      forks_count: 0,
      license: { spdx_id: "MIT" },
      description: "repo",
      homepage: "https://example.com",
      fork: false,
    },
  ];

  const reposWithForkBoost = [
    ...reposWithoutForkBoost,
    {
      language: "JavaScript",
      topics: ["web"],
      stargazers_count: 1000,
      forks_count: 500,
      license: { spdx_id: "MIT" },
      description: "forked upstream",
      homepage: "https://example.com",
      fork: true,
    },
  ];

  const baseline = await computeScores(user, reposWithoutForkBoost, [], {
    githubService: null,
    username: "testuser",
    starredRepos: [],
    pinnedRepos: [],
  });

  const withForkedRepo = await computeScores(user, reposWithForkBoost, [], {
    githubService: null,
    username: "testuser",
    starredRepos: [],
    pinnedRepos: [],
  });

  assert.equal(withForkedRepo.community, baseline.community);
});

test("computeScores hiring readiness includes pinned repositories signal", async () => {
  const user = {
    login: "testuser",
    followers: 10,
    bio: "Developer",
    blog: "https://example.com",
    location: "Earth",
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

  const noPinned = await computeScores(user, repos, [], {
    githubService: null,
    username: "testuser",
    starredRepos: [],
    pinnedRepos: [],
  });

  const withPinned = await computeScores(user, repos, [], {
    githubService: null,
    username: "testuser",
    starredRepos: [],
    pinnedRepos: [{ name: "portfolio" }],
  });

  assert.ok(withPinned.hiringReady > noPinned.hiringReady);
});
