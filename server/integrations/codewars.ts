interface CodewarsRank {
  rank: number;
  name: string;
  score: number;
  color: string;
}

interface CodewarsUser {
  username: string;
  name?: string;
  honor: number;
  clan?: string;
  leaderboardPosition?: number;
  ranks: { overall: CodewarsRank; languages: Record<string, CodewarsRank> };
  codeChallenges: { totalAuthored?: number; totalCompleted?: number };
  skills?: string[];
  account?: { memberSince?: string };
  country?: string;
}

interface CodewarsCompletedChallenges {
  totalPages: number;
  totalItems: number;
  data: Array<{
    id: string;
    name: string;
    slug?: string;
    completedAt?: string;
    completedLanguages?: string[];
  }>;
}

/* ============================================================
 * Raw fetchers
 * ============================================================ */

async function getCodewarsUser(handle: string): Promise<CodewarsUser> {
  const clean = handle.trim();
  if (!clean) throw new Error('Codewars username is required.');

  const response = await fetch(
    `https://www.codewars.com/api/v1/users/${encodeURIComponent(clean)}`,
    { headers: { Accept: 'application/json', 'User-Agent': 'APIVue/1.0' } },
  );

  if (!response.ok) {
    if (response.status === 404) throw new Error(`Codewars user "${clean}" not found.`);
    throw new Error(`Codewars request failed with status ${response.status}.`);
  }

  return (await response.json()) as CodewarsUser;
}

async function getCompletedChallenges(
  handle: string,
): Promise<CodewarsCompletedChallenges | null> {
  try {
    const response = await fetch(
      `https://www.codewars.com/api/v1/users/${encodeURIComponent(handle)}/code-challenges/completed?page=0`,
      { headers: { Accept: 'application/json', 'User-Agent': 'APIVue/1.0' } },
    );
    if (!response.ok) return null;
    return (await response.json()) as CodewarsCompletedChallenges;
  } catch {
    return null;
  }
}

/* ============================================================
 * Aggregation helpers
 * ============================================================ */

function languageBreakdown(languages: Record<string, CodewarsRank>) {
  return Object.entries(languages)
    .map(([label, rank]) => ({ label, value: rank.score ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);
}

/**
 * Groups completed katas by completion date so the frontend activity
 * chart can render it — same { date, count } shape as every other
 * platform.
 */
function buildActivity(
  challenges: CodewarsCompletedChallenges | null,
): Array<{ date: string; count: number }> {
  if (!challenges) return [];

  const byDay = new Map<string, number>();
  for (const kata of challenges.data) {
    if (!kata.completedAt) continue;
    const key = kata.completedAt.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  return Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildHighlights(
  user: CodewarsUser,
): Array<{ title: string; subtitle?: string }> {
  const out: Array<{ title: string; subtitle?: string }> = [];

  if (user.honor) out.push({ title: `Honor: ${user.honor.toLocaleString()}` });
  if (user.ranks?.overall?.name) {
    out.push({
      title: `Overall rank: ${user.ranks.overall.name}`,
      subtitle: `Score ${user.ranks.overall.score}`,
    });
  }
  if (user.codeChallenges?.totalCompleted) {
    out.push({ title: `${user.codeChallenges.totalCompleted} katas completed` });
  }
  if (user.leaderboardPosition) {
    out.push({ title: `Leaderboard #${user.leaderboardPosition}` });
  }

  return out;
}

/* ============================================================
 * Public: normalized profile
 * ============================================================ */

export interface NormalizedCodewarsProfile {
  platform: 'codewars';
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

export async function getCodewarsUserProfile(
  handle: string,
): Promise<NormalizedCodewarsProfile> {
  const user = await getCodewarsUser(handle);

  if (!user.username) {
    throw new Error(`Codewars user "${handle}" not found.`);
  }

  const languages = user.ranks?.languages ?? {};
  const completed = user.codeChallenges?.totalCompleted ?? 0;
  const authored = user.codeChallenges?.totalAuthored ?? 0;

  const challenges = await getCompletedChallenges(user.username);

  const completionRatio =
    completed + authored > 0
      ? Math.round((completed / (completed + authored)) * 10000) / 100
      : 0;

  return {
    platform: 'codewars',
    handle: user.username,
    displayName: user.name?.trim() || user.username,
    avatarUrl: null,
    profileUrl: `https://www.codewars.com/users/${encodeURIComponent(user.username)}`,
    bio: user.skills?.length ? `Skills: ${user.skills.join(', ')}` : null,
    location: user.country ?? null,
    joinedAt: user.account?.memberSince ?? null,

    metrics: [
      { key: 'honor', label: 'Honor', value: user.honor ?? 0, format: 'number' },
      { key: 'rank', label: 'Overall rank', value: user.ranks?.overall?.name ?? null },
      { key: 'score', label: 'Overall score', value: user.ranks?.overall?.score ?? 0, format: 'number' },
      { key: 'solved', label: 'Katas completed', value: completed, format: 'number' },
      { key: 'authored', label: 'Katas authored', value: authored, format: 'number' },
      { key: 'leaderboard', label: 'Leaderboard position', value: user.leaderboardPosition ?? null, format: 'number' },
      { key: 'completionRatio', label: 'Completed vs authored', value: completionRatio, format: 'number' },
      { key: 'languages', label: 'Languages used', value: Object.keys(languages).length, format: 'number' },
    ],

    breakdowns: [
      { key: 'languages', label: 'Language scores', unit: 'score', items: languageBreakdown(languages) },
    ],

    ratingHistory: [],
    activity: buildActivity(challenges),
    highlights: buildHighlights(user),

    fetchedAt: new Date().toISOString(),
  };
}