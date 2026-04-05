import test from "node:test";
import assert from "node:assert/strict";

import {
  buildReportFromGitHub,
  computeCompareWinners,
} from "../src/services/reportService.js";

test("computeCompareWinners returns username or tie for each category", () => {
  const left = {
    username: "user1",
    scores: {
      activity: 10,
      codeQuality: 80,
      diversity: 60,
      community: 50,
      hiringReady: 70,
      overall: 54,
    },
  };

  const right = {
    username: "user2",
    scores: {
      activity: 20,
      codeQuality: 80,
      diversity: 30,
      community: 70,
      hiringReady: 40,
      overall: 48,
    },
  };

  const winners = computeCompareWinners(left, right);

  assert.equal(winners.activity, "user2");
  assert.equal(winners.codeQuality, "tie");
  assert.equal(winners.diversity, "user1");
  assert.equal(winners.community, "user2");
  assert.equal(winners.hiringReady, "user1");
  assert.equal(winners.overall, "user1");
});

test("buildReportFromGitHub returns normalized report payload", async () => {
  const githubService = {
    getUser: async () => ({
      avatar_url: "https://avatar",
      name: "Dev",
      bio: "builder",
      created_at: "2021-03-01T00:00:00Z",
      followers: 10,
      public_repos: 2,
    }),
    getRepos: async () => [
      {
        name: "a",
        stargazers_count: 1,
        forks_count: 1,
        language: "JavaScript",
        description: "a",
        html_url: "https://repo/a",
        topics: ["web"],
        license: { spdx_id: "MIT" },
        homepage: "https://a",
        fork: false,
      },
      {
        name: "b",
        stargazers_count: 0,
        forks_count: 0,
        language: "TypeScript",
        description: "b",
        html_url: "https://repo/b",
        topics: ["cli"],
        license: { spdx_id: "MIT" },
        homepage: "https://b",
        fork: false,
      },
    ],
    getEvents: async () => [],
    getStarred: async () => [{ full_name: "someone/project" }],
    getPinnedRepos: async () => [{ name: "portfolio", url: "https://repo/p" }],
    getRepoContents: async () => [],
  };

  const report = await buildReportFromGitHub("devuser", githubService);

  assert.equal(report.username, "devuser");
  assert.equal(report.createdAt, "2021-03-01T00:00:00Z");
  assert.equal(report.pinnedReposCount, 1);
  assert.equal(report.topRepos.length, 2);
  assert.ok(Array.isArray(report.languages));
  assert.equal(report.heatmapData.length, 84);
  assert.ok(report.scores.overall >= 0 && report.scores.overall <= 100);
});
