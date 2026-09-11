import { env } from '../env';

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
    acSubmissionNum: Array<{
      difficulty: string;
      count: number;
      submissions: number;
    }>;
  };
  languageProblemCount: Array<{
    languageName: string;
    problemsSolved: number;
  }>;
  tagProblemCounts: {
    advanced: Array<{ tagName: string; problemsSolved: number }>;
    intermediate: Array<{ tagName: string; problemsSolved: number }>;
    fundamental: Array<{ tagName: string; problemsSolved: number }>;
  };
  submissionCalendar: string | null;
  badges: Array<{ displayName: string }>;
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
  contest: {
    title: string;
    startTime: number | null;
  } | null;
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
    tagProblemCounts { advanced { tagName problemsSolved } intermediate { tagName problemsSolved } fundamental { tagName problemsSolved } }
    submissionCalendar
    badges { displayName }
  }
  userContestRanking(username: $username) { attendedContestsCount rating globalRanking topPercentage }
  userContestRankingHistory(username: $username) { attended rating ranking contest { title startTime } }
  allQuestionsCount { difficulty count }
}
`;

async function getLeetCodeUser(handle: string): Promise<{ user: LeetCodeUser | null; contestRanking: LeetCodeContestRanking | null; contestHistory: LeetCodeContestRankingHistory[]; allQuestions: LeetCodeAllQuestionsCount[] }> {
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
    },
    body: JSON.stringify({ query: LEETCODE_QUERY, variables: { username: handle } }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode request failed with status ${response.status}`);
  }

  const payload = await response.json();
  
  if (payload.errors) {
    throw new Error(payload.errors.map((e: any) => e.message).join('; '));
  }

  return {
    user: payload.data?.matchedUser ?? null,
    contestRanking: payload.data?.userContestRanking ?? null,
    contestHistory: payload.data?.userContestRankingHistory ?? [],
    allQuestions: payload.data?.allQuestionsCount ?? [],
  };
}

export async function getLeetCodeUserProfile(handle: string) {
  const { user, contestRanking, contestHistory, allQuestions } = await getLeetCodeUser(handle);

  if (!user) {
    throw new Error(`LeetCode user "${handle}" not found`);
  }

  const solved: Record<string, number> = {};
  for (const s of user.submitStatsGlobal?.acSubmissionNum ?? []) {
    solved[s.difficulty] = s.count;
  }

  const total: Record<string, number> = {};
  for (const s of allQuestions) {
    total[s.difficulty] = s.count;
  }

  const tags = user.tagProblemCounts ?? {};
  const tagItems = [
    ...(tags.fundamental ?? []),
    ...(tags.intermediate ?? []),
    ...(tags.advanced ?? []),
  ]
    .map((t: any) => ({ tagName: t.tagName, problemsSolved: t.problemsSolved }))
    .sort((a, b) => b.problemsSolved - a.problemsSolved)
    .slice(0, 10);

  let calendar: Record<string, number> = {};
  try {
    calendar = user.submissionCalendar ? JSON.parse(user.submissionCalendar) : {};
  } catch {
    calendar = {};
  }

  return {
    platform: 'leetcode',
    handle: user.username,
    displayName: user.profile?.realName || user.username,
    avatarUrl: user.profile?.userAvatar ?? null,
    profileUrl: `https://leetcode.com/u/${user.username}/`,
    bio: user.profile?.aboutMe ?? null,
    location: user.profile?.countryName ?? null,
    joinedAt: null,
    metrics: [
      { key: 'solved_all', label: 'Problems solved', value: solved.All ?? 0, format: 'number' },
      { key: 'solved_easy', label: 'Easy solved', value: solved.Easy ?? 0, format: 'number' },
      { key: 'solved_medium', label: 'Medium solved', value: solved.Medium ?? 0, format: 'number' },
      { key: 'solved_hard', label: 'Hard solved', value: solved.Hard ?? 0, format: 'number' },
      {
        key: 'completion',
        label: 'Catalogue solved',
        value: total.All ? Math.round(((solved.All ?? 0) / total.All) * 1000) / 10 : null,
        format: 'percent',
      },
      { key: 'ranking', label: 'Global ranking', value: user.profile?.ranking ?? null, format: 'number' },
      { key: 'reputation', label: 'Reputation', value: user.profile?.reputation ?? 0, format: 'number' },
      { key: 'contest_rating', label: 'Contest rating', value: contestRanking?.rating ? Math.round(contestRanking.rating) : null, format: 'number' },
      { key: 'contests', label: 'Contests attended', value: contestRanking?.attendedContestsCount ?? 0, format: 'number' },
      { key: 'contest_top', label: 'Contest top %', value: contestRanking?.topPercentage ?? null, format: 'percent' },
    ],
    breakdowns: [
      {
        key: 'difficulty',
        label: 'Solved by difficulty',
        unit: 'problems',
        items: ['Easy', 'Medium', 'Hard'].map((d) => ({ name: d, value: solved[d] ?? 0 })),
      },
      {
        key: 'languages',
        label: 'Solved by language',
        unit: 'problems',
        items: (user.languageProblemCount ?? [])
          .map((l: any) => ({ name: l.languageName, value: l.problemsSolved }))
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 10),
      },
      { key: 'topics', label: 'Strongest topics', unit: 'problems', items: tagItems },
    ],
    ratingHistory: contestHistory
      .filter((h) => h.attended)
      .map((h) => ({
        date: h.contest?.startTime ? new Date(Number(h.contest?.startTime) * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        value: Math.round(h.rating ?? 0),
        label: h.contest?.title ?? 'Contest',
      })),
    activity: Object.entries(calendar)
      .map(([ts, count]) => ({ date: new Date(Number(ts) * 1000).toISOString().slice(0, 10), count: Number(count) }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-365),
    highlights: (user.badges ?? []).slice(0, 6).map((b: any) => ({ title: b.displayName })),
    fetchedAt: new Date().toISOString(),
  };
}
