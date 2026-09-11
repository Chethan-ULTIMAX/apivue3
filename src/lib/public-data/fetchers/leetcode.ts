import type {
  PublicActivity,
  PublicDataResult,
  PublicProfile,
} from '../types';

const LEETCODE_QUERY = `
query apivue($username: String!) {
  matchedUser(username: $username) {
    username
    profile { realName userAvatar ranking aboutMe countryName reputation }
    submitStatsGlobal { acSubmissionNum { difficulty count submissions } }
    languageProblemCount { languageName problemsSolved }
    submissionCalendar
    badges { displayName }
  }
  userContestRanking(username: $username) { attendedContestsCount rating globalRanking topPercentage }
  userContestRankingHistory(username: $username) { attended rating ranking contest { title startTime } }
  allQuestionsCount { difficulty count }
}
`;

async function leetcodeRequest<T>(query: string, variables: any): Promise<T> {
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('LeetCode user not found.');
    }
    throw new Error(`LeetCode request failed with status ${response.status}.`);
  }

  const payload = await response.json();

  if (payload.errors) {
    throw new Error(payload.errors.map((e: any) => e.message).join('; '));
  }

  return payload.data;
}

export async function fetchLeetCodePublicProfile(
  username: string
): Promise<PublicDataResult> {
  const cleanUsername = username.trim();

  if (!cleanUsername) {
    throw new Error('Enter a LeetCode username.');
  }

  try {
    const data = await leetcodeRequest<any>(LEETCODE_QUERY, { username: cleanUsername });
    const user = data.matchedUser;

    if (!user) {
      throw new Error('LeetCode user not found.');
    }

    const solved: Record<string, number> = {};
    for (const s of user.submitStatsGlobal?.acSubmissionNum ?? []) {
      solved[s.difficulty] = s.count;
    }

    const total: Record<string, number> = {};
    for (const s of data.allQuestionsCount ?? []) {
      total[s.difficulty] = s.count;
    }

    const contest = data.userContestRanking;
    const contestHistory: any[] = data.userContestRankingHistory ?? [];

    let calendar: Record<string, number> = {};
    try {
      calendar = user.submissionCalendar ? JSON.parse(user.submissionCalendar) : {};
    } catch {
      calendar = {};
    }

    const profile: PublicProfile = {
      platform: 'leetcode',
      username: user.username,
      displayName: user.profile?.realName || user.username,
      avatarUrl: user.profile?.userAvatar ?? null,
      profileUrl: `https://leetcode.com/u/${user.username}/`,
      bio: user.profile?.aboutMe ?? null,
      location: user.profile?.countryName ?? null,
      joinedAt: null,
    };

    const activity: PublicActivity[] = Object.entries(calendar)
      .map(([ts, count]) => ({
        id: ts,
        title: `${count} submissions`,
        description: new Date(Number(ts) * 1000).toLocaleDateString(),
        timestamp: new Date(Number(ts) * 1000).toISOString(),
        url: `https://leetcode.com/u/${user.username}/`,
        type: 'submission',
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .slice(-50);

    return {
      platform: 'leetcode',
      profile,
      metrics: [
        {
          label: 'Problems solved',
          value: solved.All ?? 0,
        },
        {
          label: 'Easy solved',
          value: solved.Easy ?? 0,
        },
        {
          label: 'Medium solved',
          value: solved.Medium ?? 0,
        },
        {
          label: 'Hard solved',
          value: solved.Hard ?? 0,
        },
        {
          label: 'Global ranking',
          value: user.profile?.ranking ?? 'Unranked',
        },
        {
          label: 'Reputation',
          value: user.profile?.reputation ?? 0,
        },
        {
          label: 'Contest rating',
          value: contest?.rating ? Math.round(contest.rating) : 'Unrated',
        },
        {
          label: 'Contests attended',
          value: contest?.attendedContestsCount ?? 0,
        },
        {
          label: 'Catalogue completion',
          value: total.All ? `${Math.round(((solved.All ?? 0) / total.All) * 1000) / 10}%` : '0%',
        },
      ],
      activity,
      fetchedAt: new Date().toISOString(),
      source: 'public-api',
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch LeetCode profile.'
    );
  }
}
