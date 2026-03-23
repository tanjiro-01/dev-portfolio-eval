import { getGitHubService } from "../services/githubService.js";

export const getProfileSummary = async (req, res, next) => {
  try {
    const username = req.params.username?.toLowerCase();
    const githubService = getGitHubService();

    const [user, repos, events] = await Promise.all([
      githubService.getUser(username),
      githubService.getRepos(username),
      githubService.getEvents(username),
    ]);

    return res.status(200).json({
      username,
      profile: {
        login: user.login,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        followers: user.followers,
        publicRepos: user.public_repos,
      },
      reposCount: repos.length,
      eventsCount: events.length,
      cache: {
        hit: false,
      },
    });
  } catch (error) {
    return next(error);
  }
};
