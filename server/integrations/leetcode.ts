interface LeetCodeUser {
  username: string;
  profile: {
    realName: string | null;
    userAvatar: string | null;
    ranking: number | null;
    aboutMe: string | null;
    countryName: string | null;
    reputation: number;
  };
  submitStatsGlobal: {
    acSubmissionNum: Array<{ difficulty: string; count: number; submissions: number }>;
  };
  languageProblemCount: Array<{ languageName: string; problemsSolved: number }>;
  tagProblemCounts: {
    advanced: Array<{ tagName: string; problemsSolved: number }>;
    intermediate: Array<{ tagName: string; problemsSolved: number }>;
    fundamental: Array<{ tagName: string; problemsSolved: number }>;
  };
  submissionCalendar: string | null;
  badges: Array<{ displayName: string; icon?: string }>;
}

interface LeetCodeContestRanking {
  attendedContestsCount: number;
  rating: number | null;
  globalRanking: number | null;
  topPercentage: number | null;
}

interface LeetCodeContestRankingHistory {
  attended: boolean;
  rating: number | null;
  ranking: number | null;
  contest: { title: string; startTime: number | null } | null;
}

interface LeetCodeAllQuestionsCount {
  difficulty: string;
  count: number;
}

const LEETCODE_QUERY = `
query apivue($username: String!) {
  matchedUser(username: $username) {
    username
    profile { realName userAvatar ranking aboutMe countryName reputation }
    submitStatsGlobal { acSubmissionNum { difficulty count submissions } }
    languageProblemCount { languageName problemsSolved }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
    submissionCalendar
    badges { displayName icon }
  }
  userContestRanking(username: $username) {
    attendedContestsCount rating globalRanking topPercentage
  }
  userContestRankingHistory(username: $username) {
    attended rating ranking contest { title startTime }
  }
  allQuestionsCount { difficulty count }
}
`;

/* ============================================================
 * Raw fetcher
 * ============================================================ */

async function fetchLeetCodeData(handle: string): Promise<{
  user: LeetCodeUser | null;
  contestRanking: LeetCodeContestRanking | null;
  contestHistory: LeetCodeContestRankingHistory[];
  allQuestions: LeetCodeAllQuestionsCount[];
}> {
  const clean = handle.trim();
  if (!clean) throw new Error('LeetCode username is required.');

  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com/',
      'User-Agent': 'APIVue/1.0',
    },
    body: JSON.stringify({ query: LEETCODE_QUERY, variables: { username: clean } }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    data?: {
      matchedUser?: LeetCodeUser | null;
      userContestRanking?: LeetCodeContestRanking | null;
      userContestRankingHistory?: LeetCodeContestRankingHistory[];
      allQuestionsCount?: LeetCodeAllQuestionsCount[];
    };
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((e) => e.message).join('; '));
  }

  return {
    user: payload.data?.matchedUser ?? null,
    contestRanking: payload.data?.userContestRanking ?? null,
    contestHistory: payload.data?.userContestRankingHistory ?? [],
    allQuestions: payload.data?.allQuestionsCount ?? [],
  };
}

/* ============================================================
 * Helpers
 * ============================================================ */

function parseCalendar(calendar: string | null): Record<string, number> {
  if (!calendar) return {};
  try {
    const parsed = JSON.parse(calendar);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([ts, count]) => [ts, Number(count) || 0]),
    );
  } catch {
    return {};
  }
}

/**
 * LeetCode's submission calendar keys are unix seconds.
 * We group by UTC day and emit { date, count } — the frontend's
 * universal activity shape.
 */
function buildActivity(calendar: Record<string, number>): Array<{ date: string; count: number }> {
  return Object.entries(calendar)
    .map(([ts, count]) => ({
      date: new Date(Number(ts) * 1000).toISOString().slice(0, 10),
      count: Number(count),
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function difficultyBreakdown(solved: Record<string, number>) {
  return [
    { label: 'Easy', value: solved.Easy ?? 0 },
    { label: 'Medium', value: solved.Medium ?? 0 },
    { label: 'Hard', value: solved.Hard ?? 0 },
  ];
}

function languageBreakdown(user: LeetCodeUser) {
  return (user.languageProblemCount ?? [])
    .map((l) => ({ label: l.languageName, value: l.problemsSolved }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);
}

function topicBreakdown(user: LeetCodeUser) {
  const tags = user.tagProblemCounts ?? { advanced: [], intermediate: [], fundamental: [] };
  const merged = new Map<string, number>();

  for (const tag of [...tags.fundamental, ...tags.intermediate, ...tags.advanced]) {
    merged.set(tag.tagName, Math.max(merged.get(tag.tagName) ?? 0, tag.problemsSolved));
  }

  return Array.from(merged.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);
}

function buildRatingHistory(
  history: LeetCodeContestRankingHistory[],
): Array<{ date: string; value: number }> {
  return history
    .filter((entry) => entry.attended && entry.contest?.startTime && entry.rating != null)
    .map((entry) => ({
      date: new Date(Number(entry.contest!.startTime) * 1000).toISOString().slice(0, 10),
      value: Math.round(entry.rating!),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildHighlights(
  user: LeetCodeUser,
  totalSolved: number,
  contestRating: number | null,
  topPercentage: number | null,
): Array<{ title: string; subtitle?: string }> {
  const out: Array<{ title: string; subtitle?: string }> = [];

  if (totalSolved > 0) out.push({ title: `${totalSolved} problems solved` });
  if (user.profile?.ranking != null) {
    out.push({ title: `Global ranking: ${user.profile.ranking.toLocaleString()}` });
  }
  if (contestRating != null) {
    out.push({
      title: `Contest rating: ${Math.round(contestRating)}`,
      subtitle: topPercentage != null ? `Top ${topPercentage.toFixed(1)}%` : undefined,
    });
  }
  if (user.badges?.length) {
    out.push({ title: `${user.badges.length} badges` });
  }

  return out;
}

/* ============================================================
 * Public: normalized profile
 * ============================================================ */

export interface NormalizedLeetCodeProfile {
  platform: 'leetcode';
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string;
  bio: string | null;
  location: string | null;
  joinedAt: string | null;

  metrics: Array<{ key: string; label: string; value: number | string | null; format?: string }>;
  breakdowns: Array<{
    key: string;
    label: string;
    unit?: string;
    items: Array<{ label: string; value: number }>;
  }>;
  ratingHistory: Array<{ date: string; value: number }>;
  activity: Array<{ date: string; count: number }>;
  highlights: Array<{ title: string; url?: string; subtitle?: string }>;

  fetchedAt: string;
}

export async function getLeetCodeUserProfile(
  handle: string,
): Promise<NormalizedLeetCodeProfile> {
  const { user, contestRanking, contestHistory, allQuestions } = await fetchLeetCodeData(handle);

  if (!user) {
    throw new Error(`LeetCode user "${handle}" not found.`);
  }

  const solved: Record<string, number> = {};
  for (const item of user.submitStatsGlobal?.acSubmissionNum ?? []) {
    solved[item.difficulty] = item.count ?? 0;
  }

  const total: Record<string, number> = {};
  for (const item of allQuestions) {
    total[item.difficulty] = item.count ?? 0;
  }

  const calendar = parseCalendar(user.submissionCalendar);
  const activity = buildActivity(calendar);

  const totalSolved = solved.All ?? 0;
  const totalProblems = total.All ?? 0;

  const completion =
    totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 10000) / 100 : 0;

  const totalSubmissions = (user.submitStatsGlobal?.acSubmissionNum ?? []).reduce(
    (sum, item) => sum + (item.submissions ?? 0),
    0,
  );

  const acceptanceRate =
    totalSubmissions > 0 ? Math.round((totalSolved / totalSubmissions) * 10000) / 100 : 0;

  return {
    platform: 'leetcode',
    handle: user.username,
    displayName: user.profile?.realName?.trim() || user.username,
    avatarUrl: user.profile?.userAvatar ?? null,
    profileUrl: `https://leetcode.com/u/${encodeURIComponent(user.username)}/`,
    bio: user.profile?.aboutMe ?? null,
    location: user.profile?.countryName ?? null,
    joinedAt: null,

    metrics: [
      { key: 'solved_all', label: 'Problems solved', value: totalSolved, format: 'number' },
      { key: 'solved_easy', label: 'Easy solved', value: solved.Easy ?? 0, format: 'number' },
      { key: 'solved_medium', label: 'Medium solved', value: solved.Medium ?? 0, format: 'number' },
      { key: 'solved_hard', label: 'Hard solved', value: solved.Hard ?? 0, format: 'number' },
      { key: 'catalogue_total', label: 'Problems in catalogue', value: totalProblems, format: 'number' },
      { key: 'completion', label: 'Catalogue completion', value: completion, format: 'number' },
      { key: 'submissions', label: 'Submissions', value: totalSubmissions, format: 'number' },
      { key: 'acceptance_rate', label: 'Acceptance rate', value: acceptanceRate, format: 'number' },
      { key: 'ranking', label: 'Global ranking', value: user.profile?.ranking ?? null, format: 'number' },
      { key: 'reputation', label: 'Reputation', value: user.profile?.reputation ?? 0, format: 'number' },
      { key: 'contest_rating', label: 'Contest rating', value: contestRanking?.rating ?? null, format: 'number' },
      { key: 'contests', label: 'Contests attended', value: contestRanking?.attendedContestsCount ?? 0, format: 'number' },
      { key: 'contest_top', label: 'Contest top %', value: contestRanking?.topPercentage ?? null, format: 'number' },
      { key: 'active_days', label: 'Active days', value: activity.length, format: 'number' },
      { key: 'badges', label: 'Badges', value: user.badges?.length ?? 0, format: 'number' },
    ],

    breakdowns: [
      { key: 'difficulty', label: 'Solved by difficulty', unit: 'problems', items: difficultyBreakdown(solved) },
      { key: 'languages', label: 'Solved by language', unit: 'problems', items: languageBreakdown(user) },
      { key: 'topics', label: 'Strongest topics', unit: 'problems', items: topicBreakdown(user) },
    ],

    ratingHistory: buildRatingHistory(contestHistory),
    activity,
    highlights: buildHighlights(
      user,
      totalSolved,
      contestRanking?.rating ?? null,
      contestRanking?.topPercentage ?? null,
    ),

    fetchedAt: new Date().toISOString(),
  };
}