import test from "node:test";
import assert from "node:assert/strict";

import { createGitHubService } from "../src/services/githubService.js";

test("createGitHubService.getUser returns octokit user payload", async () => {
  const octokitMock = {
    users: {
      getByUsername: async ({ username }) => ({ data: { login: username } }),
    },
    repos: {
      listForUser: async () => ({ data: [] }),
      getContent: async () => ({ data: [] }),
    },
    activity: {
      listPublicEventsForUser: async () => ({ data: [] }),
    },
  };

  const service = createGitHubService(octokitMock);
  const user = await service.getUser("octocat");

  assert.equal(user.login, "octocat");
});

test("createGitHubService maps octokit 404 to app error", async () => {
  const octokitMock = {
    users: {
      getByUsername: async () => {
        throw { status: 404 };
      },
    },
    repos: {
      listForUser: async () => ({ data: [] }),
      getContent: async () => ({ data: [] }),
    },
    activity: {
      listPublicEventsForUser: async () => ({ data: [] }),
    },
  };

  const service = createGitHubService(octokitMock);

  await assert.rejects(
    async () => service.getUser("missing-user"),
    (error) => {
      assert.equal(error.statusCode, 404);
      assert.match(error.message, /missing-user/);
      return true;
    },
  );
});
