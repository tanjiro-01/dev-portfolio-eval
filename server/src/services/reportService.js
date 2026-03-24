import mongoose from "mongoose";

import Report from "../models/Report.js";
import { getGitHubService } from "./githubService.js";
import { computeScores } from "./scoringService.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const toTopRepos = (repos = []) =>
  [...repos]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 6)
    .map((repo) => ({
      name: repo.name,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language,
      description: repo.description,
      url: repo.html_url,
    }));

const toLanguages = (repos = []) => {
  const languageCounts = repos.reduce((acc, repo) => {
    if (!repo.language) {
      return acc;
    }

    acc[repo.language] = (acc[repo.language] || 0) + 1;
    return acc;
  }, {});

  const totalLanguageRepos = Object.values(languageCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  if (!totalLanguageRepos) {
    return [];
  }

  return Object.entries(languageCounts)
    .map(([name, count]) => ({
      name,
      percent: Math.round((count / totalLanguageRepos) * 100),
    }))
    .sort((a, b) => b.percent - a.percent);
};

export const buildReportFromGitHub = async (username, githubService = getGitHubService()) => {
  const [user, repos, events] = await Promise.all([
    githubService.getUser(username),
    githubService.getRepos(username),
    githubService.getEvents(username),
  ]);

  const scores = computeScores(user, repos, events);

  return {
    username,
    avatarUrl: user.avatar_url,
    name: user.name,
    bio: user.bio,
    followers: user.followers,
    publicRepos: user.public_repos,
    scores,
    topRepos: toTopRepos(repos),
    languages: toLanguages(repos),
    shareUrl: `/report/${username}`,
  };
};

export const persistReportCache = async (username, report) => {
  if (mongoose.connection.readyState !== 1) {
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ONE_DAY_MS);

  return Report.findOneAndUpdate(
    { username },
    {
      username,
      report,
      cachedAt: now,
      expiresAt,
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    },
  );
};

export const getCachedReport = async (username) => {
  if (mongoose.connection.readyState !== 1) {
    return null;
  }

  return Report.findOne({ username }).lean();
};

export const getOrBuildReport = async (username) => {
  const cached = await getCachedReport(username);
  if (cached) {
    return {
      report: {
        ...cached.report,
        cache: {
          hit: true,
          cachedAt: cached.cachedAt,
          expiresAt: cached.expiresAt,
        },
      },
      source: "cache",
    };
  }

  const report = await buildReportFromGitHub(username);
  await persistReportCache(username, report);

  return {
    report: {
      ...report,
      cache: {
        hit: false,
      },
    },
    source: "fresh",
  };
};

export const computeCompareWinners = (left, right) => {
  const categories = [
    "activity",
    "codeQuality",
    "diversity",
    "community",
    "hiringReady",
    "overall",
  ];

  return categories.reduce((acc, category) => {
    if (left.scores[category] > right.scores[category]) {
      acc[category] = left.username;
      return acc;
    }

    if (left.scores[category] < right.scores[category]) {
      acc[category] = right.username;
      return acc;
    }

    acc[category] = "tie";
    return acc;
  }, {});
};
