const roundScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const CATEGORY_KEYWORDS = {
  web: [
    "web",
    "html",
    "css",
    "javascript",
    "typescript",
    "react",
    "vue",
    "angular",
    "next",
    "frontend",
  ],
  backend: [
    "backend",
    "api",
    "server",
    "node",
    "express",
    "django",
    "flask",
    "spring",
    "fastapi",
  ],
  cli: ["cli", "terminal", "command-line", "shell", "tooling"],
  mobile: [
    "mobile",
    "android",
    "ios",
    "flutter",
    "react-native",
    "swift",
    "kotlin",
  ],
  systems: [
    "systems",
    "kernel",
    "embedded",
    "c",
    "c++",
    "rust",
    "assembly",
    "low-level",
  ],
  data: [
    "data",
    "analytics",
    "machine-learning",
    "ml",
    "ai",
    "pandas",
    "numpy",
    "jupyter",
  ],
  devops: ["devops", "docker", "kubernetes", "terraform", "ci", "cd", "infra"],
  game: ["game", "unity", "unreal", "godot"],
  security: ["security", "crypto", "vulnerability", "pentest", "auth"],
  blockchain: ["blockchain", "web3", "solidity", "ethereum"],
};

// Calculate longest consecutive day streak from contribution calendar days
const calculateStreakFromCalendar = (weeks = []) => {
  const days = weeks
    .flatMap((w) => w.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date));

  let maxStreak = 0;
  let currentStreak = 0;

  for (const day of days) {
    if (day.contributionCount > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
};

// Legacy streak calculator used as fallback for event-based scoring
const calculateLongestStreakFromEvents = (events = []) => {
  const pushEvents = events.filter((e) => e.type === "PushEvent");

  if (pushEvents.length === 0) {
    return 0;
  }

  const activeDays = new Set(
    pushEvents.map((e) => new Date(e.created_at).toISOString().split("T")[0]),
  );

  const sortedDays = Array.from(activeDays).sort();

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDay = new Date(sortedDays[i - 1]);
    const currDay = new Date(sortedDays[i]);
    const diffDays = (currDay - prevDay) / (24 * 60 * 60 * 1000);

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return Math.min((maxStreak / 90) * 100, 100);
};

// Primary: Score activity from a full-year GraphQL contribution calendar.
// This is accurate because it counts all contribution types (commits, PRs,
// reviews, issues) with NO event cap, and covers the full year.
const scoreActivityFromCalendar = (contributionCalendar) => {
  const { weeks } = contributionCalendar;

  const allDays = weeks
    .flatMap((w) => w.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const last90Days = allDays.filter((d) => d.date >= cutoffStr);
  const totalLast90 = last90Days.reduce((s, d) => s + d.contributionCount, 0);
  const activeDaysLast90 = last90Days.filter(
    (d) => d.contributionCount > 0,
  ).length;

  const maxStreak = calculateStreakFromCalendar(weeks);

  // 3-component score (each capped at its weight):
  // - Volume:      up to 40 pts  (200 contributions in 90d = max)
  // - Consistency: up to 40 pts  (60 active days out of 90 = max)
  // - Streak:      up to 20 pts  (30-day consecutive streak = max)
  const volumeScore = Math.min(totalLast90 / 200, 1) * 40;
  const consistencyScore = Math.min(activeDaysLast90 / 60, 1) * 40;
  const streakScore = Math.min(maxStreak / 30, 1) * 20;

  return roundScore(volumeScore + consistencyScore + streakScore);
};

// Fallback: Event-based scoring used when GraphQL is unavailable.
// Less accurate due to the 300-event cap on the REST Events API.
const scoreActivityFromEvents = (events = []) => {
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
  const longestStreak = calculateLongestStreakFromEvents(events);
  const streakPoints = longestStreak * 0.05;

  return roundScore(((commitPoints + streakPoints) / 25) * 100);
};

export const scoreActivity = (contributionCalendarOrEvents) => {
  // Detect which format was passed: calendar has a `weeks` array, events is a plain array
  if (
    contributionCalendarOrEvents &&
    !Array.isArray(contributionCalendarOrEvents) &&
    Array.isArray(contributionCalendarOrEvents.weeks)
  ) {
    return scoreActivityFromCalendar(contributionCalendarOrEvents);
  }

  // Fallback to legacy event-based scoring
  const events = Array.isArray(contributionCalendarOrEvents)
    ? contributionCalendarOrEvents
    : [];
  return scoreActivityFromEvents(events);
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
        void error;
      }
    }

    totalScore += repoPoints;
  }

  const maxScore = sampleRepos.length * 9; // Max 5 existing + 2 readme + 2 tests
  return roundScore((totalScore / maxScore) * 100);
};

export const scoreDiversity = (repos = []) => {
  if (!repos.length) {
    return 0;
  }

  const languageSet = new Set(
    repos.map((repo) => repo.language).filter(Boolean),
  );

  const projectCategories = new Set();

  for (const repo of repos) {
    const signals = [repo.language, ...(repo.topics || [])]
      .filter(Boolean)
      .map((value) => value.toLowerCase());

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (
        keywords.some((keyword) =>
          signals.some((signal) => signal.includes(keyword)),
        )
      ) {
        projectCategories.add(category);
      }
    }
  }

  const languageScore = Math.min(languageSet.size / 10, 1) * 50;
  const categoryScore = Math.min(projectCategories.size / 10, 1) * 50;

  return roundScore(languageScore + categoryScore);
};

export const scoreCommunity = (user, repos = [], starredRepos = []) => {
  const ownedRepos = repos.filter((repo) => !repo.fork);

  const stars = ownedRepos.reduce(
    (sum, repo) => sum + (repo.stargazers_count || 0),
    0,
  );
  const forks = ownedRepos.reduce(
    (sum, repo) => sum + (repo.forks_count || 0),
    0,
  );
  const starredCount = Array.isArray(starredRepos) ? starredRepos.length : 0;

  const starsScore = Math.min(Math.log10(stars + 1) / 2, 1) * 43;
  const forksScore = Math.min(Math.log10(forks + 1) / 2, 1) * 34;
  const followerScore = Math.min((user?.followers || 0) / 50, 1) * 20;
  const starredSignalScore = Math.min(Math.log10(starredCount + 1) / 2, 1) * 3;

  return roundScore(
    starsScore + forksScore + followerScore + starredSignalScore,
  );
};

export const scoreHiringReady = (user, repos = []) => {
  const pinnedRepos = Array.isArray(user?.pinnedRepos) ? user.pinnedRepos : [];
  let points = 0;

  if (user?.bio) points += 20;
  if (user?.blog) points += 20;
  // Location or company is more fair than email (which is almost always private)
  if (user?.location || user?.company) points += 20;
  if ((repos || []).some((repo) => !repo.fork)) points += 20;
  if (pinnedRepos.length > 0) points += 20;

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
    pinnedRepos = [],
    contributionCalendar = null,
  } = options;

  const userWithPinnedRepos = {
    ...user,
    pinnedRepos,
  };

  // Prefer the rich GraphQL calendar; fall back to REST events if unavailable
  const activityInput = contributionCalendar || events;
  const activity = scoreActivity(activityInput);
  const codeQuality = await scoreCodeQuality(repos, username, githubService);
  const diversity = scoreDiversity(repos);
  const community = scoreCommunity(userWithPinnedRepos, repos, starredRepos);
  const hiringReady = scoreHiringReady(userWithPinnedRepos, repos);

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
