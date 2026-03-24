import mongoose from "mongoose";

import Report from "../models/Report.js";
import { getGitHubService } from "../services/githubService.js";
import { computeScores } from "../services/scoringService.js";

export const getProfileSummary = async (req, res, next) => {
  try {
    const username = req.params.username?.toLowerCase();
    const githubService = getGitHubService();

    const [user, repos, events] = await Promise.all([
      githubService.getUser(username),
      githubService.getRepos(username),
      githubService.getEvents(username),
    ]);

    const scores = computeScores(user, repos, events);

    const topRepos = [...repos]
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

    const languages = Object.entries(languageCounts)
      .map(([name, count]) => ({
        name,
        percent: Math.round((count / totalLanguageRepos) * 100),
      }))
      .sort((a, b) => b.percent - a.percent);

    const report = {
      username,
      avatarUrl: user.avatar_url,
      name: user.name,
      bio: user.bio,
      followers: user.followers,
      publicRepos: user.public_repos,
      scores,
      topRepos,
      languages,
      shareUrl: `/report/${username}`,
      cache: {
        hit: false,
      },
    };

    if (mongoose.connection.readyState === 1) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await Report.findOneAndUpdate(
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
    }

    res.set("Cache-Control", "public, max-age=3600");

    return res.status(200).json({
      ...report,
    });
  } catch (error) {
    return next(error);
  }
};
