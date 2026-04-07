import mongoose from "mongoose";

import Report from "../models/Report.js";
import { CURRENT_REPORT_VERSION } from "../config/reportCache.js";
import { getGitHubService } from "./githubService.js";
import { computeScores } from "./scoringService.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Build heatmap data from the full-year GraphQL contribution calendar.
// Falls back to REST events if the calendar is unavailable.
const toHeatmapData = (contributionCalendar, events = []) => {
  if (contributionCalendar?.weeks) {
    // Full year from GraphQL — exactly what GitHub's profile renders
    return contributionCalendar.weeks.flatMap((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
      })),
    );
  }

  // Legacy fallback: build 84-day heatmap from REST events
  const pushEvents = events.filter((event) => event.type === "PushEvent");
  const countByDate = pushEvents.reduce((acc, event) => {
    const key = new Date(event.created_at).toISOString().slice(0, 10);
    acc[key] = (acc[key] || 0) + (event.payload?.commits?.length || 1);
    return acc;
  }, {});

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 83);

  return Array.from({ length: 84 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = date.toISOString().slice(0, 10);
    return { date: dateKey, count: countByDate[dateKey] || 0 };
  });
};

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

export const buildReportFromGitHub = async (
  username,
  githubService = getGitHubService(),
) => {
  const getContributionCalendar =
    typeof githubService.getContributionCalendar === "function"
      ? githubService.getContributionCalendar(username)
      : Promise.resolve(null);

  const [user, repos, events, starredRepos, pinnedRepos, contributionCalendar] =
    await Promise.all([
      githubService.getUser(username),
      githubService.getRepos(username),
      githubService.getEvents(username),
      githubService.getStarred(username),
      githubService.getPinnedRepos(username),
      getContributionCalendar,
    ]);

  const scores = await computeScores(user, repos, events, {
    githubService,
    username,
    starredRepos,
    pinnedRepos,
    contributionCalendar,
  });

  return {
    reportVersion: CURRENT_REPORT_VERSION,
    username,
    avatarUrl: user.avatar_url,
    name: user.name,
    createdAt: user.created_at,
    bio: user.bio,
    followers: user.followers,
    publicRepos: user.public_repos,
    pinnedReposCount: pinnedRepos.length,
    scores,
    topRepos: toTopRepos(repos),
    languages: toLanguages(repos),
    heatmapData: toHeatmapData(contributionCalendar, events),
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

  const cached = await Report.findOne({ username }).lean();
  if (!cached) {
    return null;
  }

  if (cached.report?.reportVersion !== CURRENT_REPORT_VERSION) {
    return null;
  }

  return cached;
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
