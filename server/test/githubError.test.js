import test from "node:test";
import assert from "node:assert/strict";

import { mapGitHubError } from "../src/utils/githubError.js";

test("mapGitHubError maps 404 to user-not-found message", () => {
  const err = mapGitHubError({ status: 404 }, "octocat");

  assert.equal(err.statusCode, 404);
  assert.match(err.message, /GitHub user not found: octocat/);
});

test("mapGitHubError maps 403 to rate-limit message", () => {
  const err = mapGitHubError({ status: 403 }, "octocat");

  assert.equal(err.statusCode, 403);
  assert.match(err.message, /rate limit/i);
});

test("mapGitHubError maps unknown failures to 502", () => {
  const err = mapGitHubError({ status: 500 }, "octocat");

  assert.equal(err.statusCode, 502);
  assert.match(err.message, /GitHub API request failed/i);
});
