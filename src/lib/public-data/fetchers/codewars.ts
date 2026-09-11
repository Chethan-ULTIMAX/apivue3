import type {
  PublicActivity,
  PublicDataResult,
  PublicProfile,
} from '../types';

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

export async function fetchCodewarsPublicProfile(
  username: string
): Promise<PublicDataResult> {
  const cleanUsername = username.trim();

  if (!cleanUsername) {
    throw new Error('Enter a Codewars username.');
  }

  const response = await fetch(`https://www.codewars.com/api/v1/users/${encodeURIComponent(cleanUsername)}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Codewars user not found.');
    }
    throw new Error(`Codewars request failed with status ${response.status}.`);
  }

  const user: CodewarsUser = await response.json();

  if (!user.username) {
    throw new Error('Codewars user not found.');
  }

  const langs = user.ranks?.languages ?? {};

  const profile: PublicProfile = {
    platform: 'codewars',
    username: user.username,
    displayName: user.name || user.username,
    avatarUrl: null,
    profileUrl: `https://www.codewars.com/users/${user.username}`,
    bio: null,
    location: user.country ?? null,
    joinedAt: null,
  };

  return {
    platform: 'codewars',
    profile,
    metrics: [
      {
        label: 'Honor',
        value: user.honor ?? 0,
      },
      {
        label: 'Overall rank',
        value: user.ranks?.overall?.name ?? 'Unranked',
      },
      {
        label: 'Overall score',
        value: user.ranks?.overall?.score ?? 0,
      },
      {
        label: 'Katas completed',
        value: user.codeChallenges?.totalCompleted ?? 0,
      },
      {
        label: 'Katas authored',
        value: user.codeChallenges?.totalAuthored ?? 0,
      },
      {
        label: 'Leaderboard position',
        value: user.leaderboardPosition ?? 'Unranked',
      },
      {
        label: 'Clan',
        value: user.clan ?? 'None',
      },
    ],
    activity: [],
    fetchedAt: new Date().toISOString(),
    source: 'public-api',
  };
}
