import { env } from '../env';

interface CodewarsUser {
  username: string;
  name?: string;
  honor: number;
  clan?: string;
  leaderboardPosition?: number;
  ranks: {
    overall: {
      rank: number;
      name: string;
      score: number;
      color: string;
    };
    languages: Record<string, {
      rank: number;
      name: string;
      score: number;
      color: string;
    }>;
  };
  codeChallenges: {
    totalAuthored?: number;
    totalCompleted?: number;
  };
  country?: string;
}

async function getCodewarsUser(handle: string): Promise<CodewarsUser> {
  const response = await fetch(`https://www.codewars.com/api/v1/users/${encodeURIComponent(handle)}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Codewars user "${handle}" not found`);
    }
    throw new Error(`Codewars request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getCodewarsUserProfile(handle: string) {
  const user = await getCodewarsUser(handle);

  if (!user.username) {
    throw new Error(`Codewars user "${handle}" not found`);
  }

  const langs = user.ranks?.languages ?? {};

  return {
    platform: 'codewars',
    handle: user.username,
    displayName: user.name || user.username,
    avatarUrl: null,
    profileUrl: `https://www.codewars.com/users/${user.username}`,
    bio: null,
    location: user.country ?? null,
    joinedAt: null,
    metrics: [
      { key: 'honor', label: 'Honor', value: user.honor ?? 0, format: 'number' },
      { key: 'rank', label: 'Overall rank', value: user.ranks?.overall?.name ?? null, format: 'text' },
      { key: 'score', label: 'Overall score', value: user.ranks?.overall?.score ?? 0, format: 'number' },
      { key: 'solved', label: 'Katas completed', value: user.codeChallenges?.totalCompleted ?? 0, format: 'number' },
      { key: 'authored', label: 'Katas authored', value: user.codeChallenges?.totalAuthored ?? 0, format: 'number' },
      { key: 'leaderboard', label: 'Leaderboard position', value: user.leaderboardPosition ?? null, format: 'number' },
      { key: 'clan', label: 'Clan', value: user.clan ?? null, format: 'text' },
    ],
    breakdowns: [
      {
        key: 'languages',
        label: 'Score by language',
        unit: 'score',
        items: Object.entries(langs)
          .map(([name, v]: [string, any]) => ({ name, value: v?.score ?? 0 }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10),
      },
    ],
    ratingHistory: [],
    activity: [],
    highlights: [],
    fetchedAt: new Date().toISOString(),
  };
}
