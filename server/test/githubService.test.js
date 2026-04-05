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
      listReposStarredByUser: async () => ({ data: [] }),
    },
    graphql: async () => ({
      user: { pinnedItems: { nodes: [] } },
    }),
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
      listReposStarredByUser: async () => ({ data: [] }),
    },
    graphql: async () => ({
      user: { pinnedItems: { nodes: [] } },
    }),
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

test("createGitHubService.getStarred returns starred repositories", async () => {
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
      listReposStarredByUser: async ({ username }) => ({
        data: [{ full_name: `${username}/awesome-repo` }],
      }),
    },
    graphql: async () => ({
      user: { pinnedItems: { nodes: [] } },
    }),
  };

  const service = createGitHubService(octokitMock);
  const starred = await service.getStarred("octocat");

  assert.equal(starred.length, 1);
  assert.equal(starred[0].full_name, "octocat/awesome-repo");
});

test("createGitHubService.getPinnedRepos returns pinned repositories", async () => {
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
      listReposStarredByUser: async () => ({ data: [] }),
    },
    graphql: async () => ({
      user: {
        pinnedItems: {
          nodes: [
            { name: "portfolio", url: "https://github.com/octocat/portfolio" },
          ],
        },
      },
    }),
  };

  const service = createGitHubService(octokitMock);
  const pinned = await service.getPinnedRepos("octocat");

  assert.equal(pinned.length, 1);
  assert.equal(pinned[0].name, "portfolio");
});
