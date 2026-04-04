const roundScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

// Calculate longest consecutive day streak from events
const calculateLongestStreak = (events = []) => {
  const pushEvents = events.filter((e) => e.type === "PushEvent");

  if (pushEvents.length === 0) {
    return 0;
  }

  // Group events by date (YYYY-MM-DD)
  const activeDays = new Set(
    pushEvents.map((e) => new Date(e.created_at).toISOString().split("T")[0]),
  );

  if (activeDays.size === 0) {
    return 0;
  }

  // Sort days chronologically
  const sortedDays = Array.from(activeDays).sort();

  // Find longest consecutive streak
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDay = new Date(sortedDays[i - 1]);
    const currDay = new Date(sortedDays[i]);

    // Check if current day is consecutive (within 1 day)
    const diffMs = currDay.getTime() - prevDay.getTime();
    const diffDays = diffMs / (24 * 60 * 60 * 1000);

    if (diffDays <= 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  // Scale to 0-100 (e.g., 365-day streak = 100)
  // Cap at reasonable value (1 year)
  return Math.min((maxStreak / 365) * 100, 100);
};

export const scoreActivity = (events = []) => {
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

  const recentPushes = events.filter(
    (event) =>
      event.type === "PushEvent" &&
      new Date(event.created_at).getTime() > ninetyDaysAgo,
  );

  const totalCommits = recentPushes.reduce(
    (sum, event) => sum + (event.payload?.commits?.length || 0),
    0,
  );

  const commitPoints = Math.min(totalCommits / 20, 1) * 20;

  // NEW: Calculate actual longest consecutive day streak from ALL events
  const longestStreak = calculateLongestStreak(events);
  const streakPoints = longestStreak * 0.05; // Scale to max 5 points

  return roundScore(((commitPoints + streakPoints) / 25) * 100);
};

export const scoreCodeQuality = async (repos = [], owner, githubService) => {
  if (!repos.length) {
    return 0;
  }

  // Sample top 10 repos by stars to avoid excessive API calls
  const sampleRepos = [...repos]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 10);

  let totalScore = 0;

  for (const repo of sampleRepos) {
    let repoPoints = 0;

    // Existing signals (always available, no API call needed)
    if (repo.license?.spdx_id) repoPoints += 1;
    if (repo.topics?.length) repoPoints += 1;
    if (repo.description) repoPoints += 1;
    if (repo.homepage) repoPoints += 1;
    if (!repo.fork) repoPoints += 1;

    // NEW: README detection (requires API call)
    let hasReadme = false;
    let hasTests = false;

    if (githubService && owner) {
      try {
        const contents = await githubService.getRepoContents(
          owner,
          repo.name,
          "",
        );
        if (Array.isArray(contents)) {
          // Check for README file (case-insensitive)
          hasReadme = contents.some(
            (f) => /^readme/i.test(f.name) && f.type === "file",
          );
          if (hasReadme) repoPoints += 2;

          // Check for tests folder (case-insensitive: test, tests, testing, etc.)
          hasTests = contents.some(
            (f) => /^tests?$/i.test(f.name) && f.type === "dir",
          );
          if (hasTests) repoPoints += 2;
        }
      } catch (error) {
        // Gracefully continue if content fetch fails (e.g., 404 for private repo)
        console.warn(
          `Could not fetch contents for ${owner}/${repo.name}: ${error.message}`,
        );
      }
    }

    totalScore += repoPoints;
  }

  const maxScore = sampleRepos.length * 10; // Max 5 existing + 2 readme + 2 tests
  return roundScore((totalScore / maxScore) * 100);
};

export const scoreDiversity = (repos = []) => {
  if (!repos.length) {
    return 0;
  }

  const languageSet = new Set(
    repos.map((repo) => repo.language).filter(Boolean),
  );

  const topicSet = new Set(repos.flatMap((repo) => repo.topics || []));

  const languageScore = Math.min(languageSet.size / 10, 1) * 50;
  const topicScore = Math.min(topicSet.size / 12, 1) * 50;

  return roundScore(languageScore + topicScore);
};

export const scoreCommunity = (user, repos = [], starredRepos = []) => {
  const stars = repos.reduce(
    (sum, repo) => sum + (repo.stargazers_count || 0),
    0,
  );
  const forks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
  const starredCount = Array.isArray(starredRepos) ? starredRepos.length : 0;

  const starsScore = Math.min(Math.log10(stars + 1) / 2, 1) * 40;
  const forksScore = Math.min(Math.log10(forks + 1) / 2, 1) * 30;
  const followerScore = Math.min((user?.followers || 0) / 50, 1) * 20;
  const starredSignalScore = Math.min(Math.log10(starredCount + 1) / 2, 1) * 10;

  return roundScore(
    starsScore + forksScore + followerScore + starredSignalScore,
  );
};

export const scoreHiringReady = (user, repos = []) => {
  let points = 0;

  if (user?.bio) points += 20;
  if (user?.blog) points += 20;
  // Location or company is more fair than email (which is almost always private)
  if (user?.location || user?.company) points += 20;
  if ((repos || []).some((repo) => !repo.fork)) points += 20;
  if ((repos || []).length >= 3) points += 20;

  return roundScore(points);
};

export const computeScores = async (
  user,
  repos = [],
  events = [],
  options = {},
) => {
  const {
    githubService = null,
    username = user.login,
    starredRepos = [],
  } = options;

  const activity = scoreActivity(events);
  const codeQuality = await scoreCodeQuality(repos, username, githubService);
  const diversity = scoreDiversity(repos);
  const community = scoreCommunity(user, repos, starredRepos);
  const hiringReady = scoreHiringReady(user, repos);

  const overall = roundScore(
    activity * 0.25 +
      codeQuality * 0.2 +
      diversity * 0.2 +
      community * 0.2 +
      hiringReady * 0.15,
  );

  return {
    activity,
    codeQuality,
    diversity,
    community,
    hiringReady,
    overall,
  };
};
