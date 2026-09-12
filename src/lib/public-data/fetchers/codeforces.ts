/**
 * Codeforces public profile fetcher.
 */

const CODEFORCES_API = 'https://codeforces.com/api';

/* ============================================================
 * Raw types
 * ============================================================ */

export interface RawCodeforcesUser {
  handle: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank?: string;
  rating?: number;
  maxRank?: string;
  maxRating?: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar?: string;
  titlePhoto?: string;
}

export interface RawCodeforcesRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface RawCodeforcesSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: {
    contestId?: number;
    index: string;
    name: string;
    type: string;
    points?: number;
    rating?: number;
    tags?: string[];
  };
  verdict?: string;
  programmingLanguage?: string;
}

export interface RawCodeforcesProfile {
  user: RawCodeforcesUser;
  ratings: RawCodeforcesRatingChange[];
  submissions: RawCodeforcesSubmission[];
}

/* ============================================================
 * HTTP helper
 * ============================================================ */

interface CodeforcesEnvelope<T> {
  status: 'OK' | 'FAILED';
  comment?: string;
  result: T;
}

async function codeforcesRequest<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${CODEFORCES_API}${endpoint}`);

  if (!response.ok) {
    throw new Error(
      `Codeforces request failed with status ${response.status}.`,
    );
  }

  const data = (await response.json()) as CodeforcesEnvelope<T>;

  if (data.status !== 'OK') {
    throw new Error(
      data.comment || 'Codeforces request failed. Check the handle and retry.',
    );
  }

  return data.result;
}

/* ============================================================
 * Public API
 * ============================================================ */

export async function fetchCodeforcesPublicProfile(
  username: string,
): Promise<RawCodeforcesProfile> {
  const handle = username.trim();

  if (!handle) {
    throw new Error('Enter a Codeforces handle.');
  }

  const encoded = encodeURIComponent(handle);

  const [users, ratings, submissions] = await Promise.all([
    codeforcesRequest<RawCodeforcesUser[]>(
      `/user.info?handles=${encoded}`,
    ),
    codeforcesRequest<RawCodeforcesRatingChange[]>(
      `/user.rating?handle=${encoded}`,
    ),
    codeforcesRequest<RawCodeforcesSubmission[]>(
      `/user.status?handle=${encoded}&from=1&count=30`,
    ),
  ]);

  const user = users[0];
  if (!user) {
    throw new Error('Codeforces user not found.');
  }

  return { user, ratings, submissions };
}