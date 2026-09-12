/**
 * Stack Overflow public profile fetcher.
 */

const STACKEXCHANGE_API = 'https://api.stackexchange.com/2.3';

/* ============================================================
 * Raw types
 * ============================================================ */

export interface RawStackOverflowUser {
  user_id: number;
  display_name: string;
  profile_image?: string;
  link?: string;
  location?: string;
  reputation: number;
  badge_counts: {
    gold: number;
    silver: number;
    bronze: number;
  };
  answer_count?: number;
  question_count?: number;
  up_vote_count?: number;
  down_vote_count?: number;
  view_count?: number;
  creation_date?: number;
}

export interface RawStackOverflowTag {
  tag_name: string;
  answer_count: number;
  answer_score: number;
}

export interface RawStackOverflowProfile {
  user: RawStackOverflowUser;
  tags: RawStackOverflowTag[];
}

/* ============================================================
 * HTTP helper
 * ============================================================ */

interface StackExchangeEnvelope<T> {
  items: T[];
}

async function stackExchangeRequest<T>(path: string): Promise<T[]> {
  const response = await fetch(`${STACKEXCHANGE_API}${path}`);

  if (!response.ok) {
    if (response.status === 400 || response.status === 404) {
      throw new Error('Stack Overflow user not found.');
    }
    throw new Error(
      `Stack Overflow request failed with status ${response.status}.`,
    );
  }

  const payload = (await response.json()) as StackExchangeEnvelope<T>;
  return payload.items ?? [];
}

/* ============================================================
 * Public API
 * ============================================================ */

export async function fetchStackOverflowPublicProfile(
  userId: string,
): Promise<RawStackOverflowProfile> {
  const cleanUserId = userId.replace(/[^0-9]/g, '').trim();

  if (!cleanUserId) {
    throw new Error('Enter a Stack Overflow user ID (numeric).');
  }

  const [userItems, tagItems] = await Promise.all([
    stackExchangeRequest<RawStackOverflowUser>(
      `/users/${cleanUserId}?site=stackoverflow&filter=default`,
    ),
    stackExchangeRequest<RawStackOverflowTag>(
      `/users/${cleanUserId}/top-answer-tags?site=stackoverflow&pagesize=10`,
    ).catch(() => [] as RawStackOverflowTag[]),
  ]);

  const user = userItems[0];
  if (!user) {
    throw new Error('Stack Overflow user not found.');
  }

  return { user, tags: tagItems };
}