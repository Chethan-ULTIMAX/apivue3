interface StackOverflowUser {
  user_id: number;
  user_type: string;
  creation_date: number;
  display_name: string;
  profile_image?: string;
  link?: string;
  location?: string;
  reputation: number;
  badge_counts?: { gold: number; silver: number; bronze: number };
  answer_count?: number;
  question_count?: number;
  down_vote_count?: number;
  up_vote_count?: number;
  view_count?: number;
}

interface StackOverflowTag {
  tag_name: string;
  answer_count: number;
  answer_score: number;
}

const API = 'https://api.stackexchange.com/2.3';
const SITE = 'stackoverflow';

/* ============================================================
 * Helpers
 * ============================================================ */

function extractUserId(handle: string): string {
  const clean = handle.trim();
  if (/^\d+$/.test(clean)) return clean;

  const urlMatch = clean.match(/stackoverflow\.com\/users\/(\d+)/i);
  if (urlMatch) return urlMatch[1];

  const pathMatch = clean.match(/\/users\/(\d+)(?:\/|$)/i);
  if (pathMatch) return pathMatch[1];

  return '';
}

function toIsoDate(seconds: number | undefined): string | null {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'APIVue/1.0' },
  });

  if (!response.ok) {
    throw new Error(`Stack Overflow request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function fetchUser(userId: string): Promise<StackOverflowUser> {
  const url = `${API}/users/${encodeURIComponent(userId)}?site=${SITE}&filter=default`;
  const data = await fetchJson<{ items: StackOverflowUser[] }>(url);
  const user = data.items?.[0];
  if (!user) throw new Error(`Stack Overflow user "${userId}" not found.`);
  return user;
}

async function fetchTopTags(userId: string): Promise<StackOverflowTag[]> {
  const url = `${API}/users/${encodeURIComponent(userId)}/top-answer-tags?site=${SITE}&pagesize=10`;
  try {
    const data = await fetchJson<{ items: StackOverflowTag[] }>(url);
    return data.items ?? [];
  } catch (error) {
    console.warn('[stackoverflow] top-answer-tags failed:', error);
    return [];
  }
}

/* ============================================================
 * Public: normalized profile
 * ============================================================ */

export interface NormalizedStackOverflowProfile {
  platform: 'stackoverflow';
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

export async function getStackOverflowUserProfile(
  handle: string,
): Promise<NormalizedStackOverflowProfile> {
  const userId = extractUserId(handle);
  if (!userId) {
    throw new Error(
      'Stack Overflow needs a numeric user ID (e.g. 22656) or a profile URL.',
    );
  }

  const [user, tags] = await Promise.all([fetchUser(userId), fetchTopTags(userId)]);

  const badges = user.badge_counts ?? { gold: 0, silver: 0, bronze: 0 };
  const reputation = user.reputation ?? 0;
  const answers = user.answer_count ?? 0;
  const questions = user.question_count ?? 0;
  const upvotes = user.up_vote_count ?? 0;
  const downvotes = user.down_vote_count ?? 0;
  const views = user.view_count ?? 0;
  const totalBadges = badges.gold + badges.silver + badges.bronze;

  /* Highlights — objects, not strings. */
  const highlights: Array<{ title: string; subtitle?: string }> = [];
  if (reputation > 0) {
    highlights.push({ title: `${reputation.toLocaleString()} reputation` });
  }
  if (answers > 0) {
    highlights.push({
      title: `${answers.toLocaleString()} answers`,
      subtitle: `${questions.toLocaleString()} questions`,
    });
  }
  if (totalBadges > 0) {
    highlights.push({
      title: `${totalBadges} badges`,
      subtitle: `${badges.gold} gold · ${badges.silver} silver · ${badges.bronze} bronze`,
    });
  }
  if (views > 0) {
    highlights.push({ title: `${views.toLocaleString()} profile views` });
  }

  return {
    platform: 'stackoverflow',
    handle: userId,
    displayName: user.display_name || `User ${userId}`,
    avatarUrl: user.profile_image ?? null,
    profileUrl: user.link ?? `https://stackoverflow.com/users/${userId}`,
    bio: null,
    location: user.location ?? null,
    joinedAt: toIsoDate(user.creation_date),

    metrics: [
      { key: 'reputation', label: 'Reputation', value: reputation, format: 'number' },
      { key: 'answers', label: 'Answers', value: answers, format: 'number' },
      { key: 'questions', label: 'Questions', value: questions, format: 'number' },
      { key: 'upvotes', label: 'Up votes', value: upvotes, format: 'number' },
      { key: 'downvotes', label: 'Down votes', value: downvotes, format: 'number' },
      { key: 'views', label: 'Profile views', value: views, format: 'number' },
      { key: 'gold_badges', label: 'Gold badges', value: badges.gold, format: 'number' },
      { key: 'silver_badges', label: 'Silver badges', value: badges.silver, format: 'number' },
      { key: 'bronze_badges', label: 'Bronze badges', value: badges.bronze, format: 'number' },
      { key: 'total_badges', label: 'Total badges', value: totalBadges, format: 'number' },
    ],

    breakdowns: [
      {
        key: 'badges',
        label: 'Badge breakdown',
        unit: 'badges',
        items: [
          { label: 'Gold', value: badges.gold },
          { label: 'Silver', value: badges.silver },
          { label: 'Bronze', value: badges.bronze },
        ],
      },
      {
        key: 'content',
        label: 'Questions vs answers',
        unit: 'posts',
        items: [
          { label: 'Answers', value: answers },
          { label: 'Questions', value: questions },
        ],
      },
      {
        key: 'votes',
        label: 'Voting activity',
        unit: 'votes',
        items: [
          { label: 'Up votes', value: upvotes },
          { label: 'Down votes', value: downvotes },
        ],
      },
      {
        key: 'topics',
        label: 'Top answer tags',
        unit: 'score',
        items: tags
          .map((t) => ({ label: t.tag_name, value: t.answer_score ?? 0 }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10),
      },
    ],

    ratingHistory: [],
    activity: [],
    highlights,

    fetchedAt: new Date().toISOString(),
  };
}