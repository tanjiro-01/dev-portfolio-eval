import { createHttpError } from "./httpError.js";

export const mapGitHubError = (error, username) => {
  const status = error?.status;

  if (status === 404) {
    return createHttpError(404, `GitHub user not found: ${username}`);
  }

  if (status === 403) {
    return createHttpError(
      403,
      "GitHub API rate limit reached. Please try again later.",
    );
  }

  return createHttpError(502, "GitHub API request failed.");
};
