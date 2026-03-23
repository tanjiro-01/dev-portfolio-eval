import { Octokit } from "@octokit/rest";

import { mapGitHubError } from "../utils/githubError.js";
import { createHttpError } from "../utils/httpError.js";

const createOctokit = () => {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw createHttpError(500, "GITHUB_TOKEN is not configured on the server.");
  }

  return new Octokit({ auth: token });
};

export const createGitHubService = (octokit = createOctokit()) => {
  const getUser = async (username) => {
    try {
      const response = await octokit.users.getByUsername({ username });
      return response.data;
    } catch (error) {
      throw mapGitHubError(error, username);
    }
  };

  const getRepos = async (username) => {
    try {
      const response = await octokit.repos.listForUser({
        username,
        sort: "updated",
        per_page: 100,
      });
      return response.data;
    } catch (error) {
      throw mapGitHubError(error, username);
    }
  };

  const getEvents = async (username) => {
    try {
      const response = await octokit.activity.listPublicEventsForUser({
        username,
        per_page: 100,
      });
      return response.data;
    } catch (error) {
      throw mapGitHubError(error, username);
    }
  };

  const getRepoContents = async (owner, repo, path = "") => {
    try {
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      return response.data;
    } catch (error) {
      throw mapGitHubError(error, owner);
    }
  };

  return {
    getUser,
    getRepos,
    getEvents,
    getRepoContents,
  };
};

export const getGitHubService = () => createGitHubService(createOctokit());
