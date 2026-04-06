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

// Helper to handle rate limit retries with exponential backoff
const withRetry = async (fn, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if it's a rate limit error (403 with specific message)
      if (error.status === 403 && error.message?.includes("API rate limit")) {
        const retryAfter = error.response?.headers?.["retry-after"];
        const waitMs = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(2, attempt) * 1000; // Exponential backoff

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
      }

      // For non-rate-limit errors or final attempt, throw immediately
      throw error;
    }
  }

  throw lastError;
};

export const createGitHubService = (octokit = createOctokit()) => {
  const getUser = async (username) => {
    try {
      const response = await withRetry(() =>
        octokit.users.getByUsername({ username }),
      );
      return response.data;
    } catch (error) {
      throw mapGitHubError(error, username);
    }
  };

  const getRepos = async (username) => {
    try {
      const response = await withRetry(() =>
        octokit.repos.listForUser({
          username,
          sort: "updated",
          per_page: 100,
        }),
      );
      return response.data;
    } catch (error) {
      throw mapGitHubError(error, username);
    }
  };

  const getEvents = async (username) => {
    try {
      const response = await withRetry(() =>
        octokit.activity.listPublicEventsForUser({
          username,
          per_page: 100,
        }),
      );
      return response.data;
    } catch (error) {
      throw mapGitHubError(error, username);
    }
  };

  const getStarred = async (username) => {
    try {
      const response = await withRetry(() =>
        octokit.activity.listReposStarredByUser({
          username,
          per_page: 100,
        }),
      );
      return response.data;
    } catch (error) {
      throw mapGitHubError(error, username);
    }
  };

  const getPinnedRepos = async (username) => {
    try {
      const response = await withRetry(() =>
        octokit.graphql(
          `
            query ($login: String!) {
              user(login: $login) {
                pinnedItems(first: 6, types: REPOSITORY) {
                  nodes {
                    ... on Repository {
                      name
                      url
                    }
                  }
                }
              }
            }
          `,
          { login: username },
        ),
      );

      return response?.user?.pinnedItems?.nodes || [];
    } catch (error) {
      // Pinned repos are a hiring-readiness signal, so we degrade safely if
      // GraphQL is unavailable for a token or account.
      if (error.status === 403 || error.status === 404) {
        return [];
      }
      throw mapGitHubError(error, username);
    }
  };

  const getContributionCalendar = async (username) => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    try {
      const response = await withRetry(() =>
        octokit.graphql(
          `
            query ($login: String!, $from: DateTime!, $to: DateTime!) {
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
                }
              }
            }
          `,
          {
            login: username,
            from: oneYearAgo.toISOString(),
            to: new Date().toISOString(),
          },
        ),
      );

      return (
        response?.user?.contributionsCollection?.contributionCalendar || null
      );
    } catch (error) {
      // Degrade gracefully — fall back to an empty calendar if GraphQL fails.
      void error;
      return null;
    }
  };

  const getRepoContents = async (owner, repo, path = "") => {
    try {
      const response = await withRetry(() =>
        octokit.repos.getContent({
          owner,
          repo,
          path,
        }),
      );
      return response.data;
    } catch (error) {
      throw mapGitHubError(error, owner);
    }
  };

  return {
    getUser,
    getRepos,
    getEvents,
    getStarred,
    getPinnedRepos,
    getContributionCalendar,
    getRepoContents,
  };
};

export const getGitHubService = () => createGitHubService(createOctokit());
