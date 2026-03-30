const roundScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

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

  const activeWeeks = [0, 1, 2, 3].filter((weeksAgo) => {
    const weekStart = now - (weeksAgo + 1) * 7 * 24 * 60 * 60 * 1000;
    const weekEnd = now - weeksAgo * 7 * 24 * 60 * 60 * 1000;

    return recentPushes.some((event) => {
      const eventTime = new Date(event.created_at).getTime();
      return eventTime >= weekStart && eventTime < weekEnd;
    });
  }).length;

  const streakPoints = (activeWeeks / 4) * 5;

  return roundScore(((commitPoints + streakPoints) / 25) * 100);
};

export const scoreCodeQuality = (repos = []) => {
  if (!repos.length) {
    return 0;
  }

  const total = repos.reduce((sum, repo) => {
    let repoPoints = 0;

    if (repo.license?.spdx_id) repoPoints += 1;
    if (repo.topics?.length) repoPoints += 1;
    if (repo.description) repoPoints += 1;
    if (repo.homepage) repoPoints += 1;
    if (!repo.fork) repoPoints += 1;

    return sum + repoPoints;
  }, 0);

  const max = repos.length * 5;
  return roundScore((total / max) * 100);
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

export const scoreCommunity = (user, repos = []) => {
  const stars = repos.reduce(
    (sum, repo) => sum + (repo.stargazers_count || 0),
    0,
  );
  const forks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);

  const starsScore = Math.min(Math.log10(stars + 1) / 2, 1) * 45;
  const forksScore = Math.min(Math.log10(forks + 1) / 2, 1) * 35;
  const followerScore = Math.min((user?.followers || 0) / 50, 1) * 20;

  return roundScore(starsScore + forksScore + followerScore);
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

export const computeScores = (user, repos = [], events = []) => {
  const activity = scoreActivity(events);
  const codeQuality = scoreCodeQuality(repos);
  const diversity = scoreDiversity(repos);
  const community = scoreCommunity(user, repos);
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
