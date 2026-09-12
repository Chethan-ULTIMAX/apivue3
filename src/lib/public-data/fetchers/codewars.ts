/**
 * Codewars public profile fetcher.
 */

const CODEWARS_API = 'https://www.codewars.com/api/v1';

/* ============================================================
 * Raw types
 * ============================================================ */

export interface RawCodewarsRankInfo {
  rank: number;
  name: string;
  score: number;
  color: string;
}

export interface RawCodewarsUser {
  username: string;
  name?: string;
  honor: number;
  clan?: string;
  leaderboardPosition?: number;
  ranks: {
    overall: RawCodewarsRankInfo;
    languages: Record<string, RawCodewarsRankInfo>;
  };
  codeChallenges: {
    totalAuthored?: number;
    totalCompleted?: number;
  };
  country?: string;
}

/* ============================================================
 * HTTP helper
 * ============================================================ */

async function codewarsRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${CODEWARS_API}${path}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Codewars user not found.');
    }
    throw new Error(
      `Codewars request failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}

/* ============================================================
 * Public API
 * ============================================================ */

export async function fetchCodewarsPublicProfile(
  username: string,
): Promise<RawCodewarsUser> {
  const cleanUsername = username.trim();

  if (!cleanUsername) {
    throw new Error('Enter a Codewars username.');
  }

  const user = await codewarsRequest<RawCodewarsUser>(
    `/users/${encodeURIComponent(cleanUsername)}`,
  );

  if (!user.username) {
    throw new Error('Codewars user not found.');
  }

  return user;
}