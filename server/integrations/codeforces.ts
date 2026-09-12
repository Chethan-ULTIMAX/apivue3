interface CodeforcesResponse<T> {
  status: 'OK' | 'FAILED';
  comment?: string;
  result: T;
}

interface CodeforcesUser {
  handle: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  avatar?: string;
  titlePhoto?: string;
  registrationTimeSeconds: number;
  lastOnlineTimeSeconds?: number;
}

interface CodeforcesRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

interface CodeforcesSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds?: number;
  problem: {
    contestId?: number;
    index: string;
    name: string;
    type?: string;
    points?: number;
    rating?: number;
    tags?: string[];
  };
  programmingLanguage: string;
  verdict: string;
  timeConsumedMillis?: number;
  memoryConsumedBytes?: number;
}

async function request<T>(endpoint: string): Promise<T> {
  const response = await fetch(`https://codeforces.com/api/${endpoint}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'APIVue/1.0' },
  });

  if (!response.ok) {
    throw new Error(`Codeforces request failed: ${response.status}`);
  }

  const data = (await response.json()) as CodeforcesResponse<T>;

  if (data.status !== 'OK') {
    throw new Error(data.comment ?? 'Codeforces API request failed.');
  }

  return data.result;
}

function toIsoDate(seconds?: number): string | null {
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

/* ============================================================
 * Raw fetchers
 * ============================================================ */

export async function getCodeforcesUser(handle: string): Promise<CodeforcesUser> {
  const clean = handle.trim();
  if (!clean) throw new Error('Codeforces handle is required.');

  const users = await request<CodeforcesUser[]>(
    `user.info?handles=${encodeURIComponent(clean)}`,
  );

  if (!users.length) throw new Error('Codeforces user was not found.');
  return users[0];
}

async function getCodeforcesRatingHistory(handle: string): Promise<CodeforcesRatingChange[]> {
  try {
    return await request<CodeforcesRatingChange[]>(
      `user.rating?handle=${encodeURIComponent(handle)}`,
    );
  } catch {
    return [];
  }
}

async function getCodeforcesSubmissions(handle: string): Promise<CodeforcesSubmission[]> {
  try {
    return await request<CodeforcesSubmission[]>(
      `user.status?handle=${encodeURIComponent(handle)}&from=1&count=1000`,
    );
  } catch {
    return [];
  }
}

/* ============================================================
 * Aggregation helpers
 * ============================================================ */

function languageBreakdown(subs: CodeforcesSubmission[]) {
  const counts = new Map<string, number>();
  for (const sub of subs) {
    const lang = sub.programmingLanguage?.trim();
    if (!lang) continue;
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  return Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);
}

function tagBreakdown(subs: CodeforcesSubmission[]) {
  const counts = new Map<string, number>();
  for (const sub of subs) {
    for (const tag of sub.problem.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);
}

function verdictBreakdown(subs: CodeforcesSubmission[]) {
  const counts = new Map<string, number>();
  for (const sub of subs) {
    const verdict = sub.verdict || 'UNKNOWN';
    counts.set(verdict, (counts.get(verdict) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Groups submissions by day and returns { date, count }[] — the same
 * shape the frontend activity chart expects from every platform.
 */
function buildActivity(subs: CodeforcesSubmission[]): Array<{ date: string; count: number }> {
  const byDay = new Map<string, number>();
  for (const sub of subs) {
    const key = new Date(sub.creationTimeSeconds * 1000).toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  return Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Converts rating changes into the frontend { date, value }[] format.
 * Extra fields (contest name, delta) are dropped because the frontend
 * only plots `value` over `date`.
 */
function buildRatingHistory(changes: CodeforcesRatingChange[]): Array<{ date: string; value: number }> {
  return changes
    .slice()
    .sort((a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds)
    .map((c) => ({
      date: new Date(c.ratingUpdateTimeSeconds * 1000).toISOString().slice(0, 10),
      value: c.newRating,
    }));
}

function buildHighlights(
  user: CodeforcesUser,
  subs: CodeforcesSubmission[],
  changes: CodeforcesRatingChange[],
): Array<{ title: string; url?: string; subtitle?: string }> {
  const out: Array<{ title: string; url?: string; subtitle?: string }> = [];

  const accepted = subs.filter((s) => s.verdict === 'OK').length;

  if (user.rating != null) {
    out.push({ title: `Rating: ${user.rating}`, subtitle: user.rank ?? undefined });
  }
  if (user.maxRating != null && user.maxRating !== user.rating) {
    out.push({ title: `Peak rating: ${user.maxRating}` });
  }
  if (accepted > 0) {
    out.push({
      title: `${accepted} accepted submissions`,
      subtitle: `${subs.length} fetched in total`,
    });
  }
  if (changes.length > 0) {
    const best = changes.reduce((b, c) => {
      const d = c.newRating - c.oldRating;
      const bd = b.newRating - b.oldRating;
      return d > bd ? c : b;
    });
    out.push({
      title: `Best contest: ${best.contestName}`,
      subtitle: `+${best.newRating - best.oldRating} rating`,
    });
  }

  return out;
}

/* ============================================================
 * Public: normalized profile
 * ============================================================ */

export interface NormalizedCodeforcesProfile {
  platform: 'codeforces';
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

export async function getCodeforcesUserProfile(
  handle: string,
): Promise<NormalizedCodeforcesProfile> {
  const clean = handle.trim();
  if (!clean) throw new Error('Codeforces handle is required.');

  const user = await getCodeforcesUser(clean);

  const [ratingChanges, submissions] = await Promise.all([
    getCodeforcesRatingHistory(clean),
    getCodeforcesSubmissions(clean),
  ]);

  const accepted = submissions.filter((s) => s.verdict === 'OK');
  const uniqueProblems = new Set(
    submissions
      .map((s) =>
        s.problem.contestId && s.problem.index
          ? `${s.problem.contestId}-${s.problem.index}`
          : null,
      )
      .filter(Boolean),
  ).size;

  const successRate =
    submissions.length > 0
      ? Math.round((accepted.length / submissions.length) * 10000) / 100
      : 0;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  return {
    platform: 'codeforces',
    handle: user.handle,
    displayName: fullName || user.handle,
    avatarUrl: user.avatar ?? user.titlePhoto ?? null,
    profileUrl: `https://codeforces.com/profile/${encodeURIComponent(user.handle)}`,
    bio: user.organization ? `Member of ${user.organization}` : null,
    location: [user.city, user.country].filter(Boolean).join(', ') || null,
    joinedAt: toIsoDate(user.registrationTimeSeconds),

    metrics: [
      { key: 'rating', label: 'Current rating', value: user.rating ?? null, format: 'number' },
      { key: 'maxRating', label: 'Peak rating', value: user.maxRating ?? null, format: 'number' },
      { key: 'rank', label: 'Current rank', value: user.rank ?? null },
      { key: 'maxRank', label: 'Best rank', value: user.maxRank ?? null },
      { key: 'contribution', label: 'Contribution', value: user.contribution, format: 'number' },
      { key: 'submissions', label: 'Recent submissions', value: submissions.length, format: 'number' },
      { key: 'accepted', label: 'Accepted submissions', value: accepted.length, format: 'number' },
      { key: 'successRate', label: 'Acceptance rate', value: successRate, format: 'number' },
      { key: 'uniqueProblems', label: 'Unique problems attempted', value: uniqueProblems, format: 'number' },
      { key: 'contests', label: 'Rated contests', value: ratingChanges.length, format: 'number' },
    ],

    breakdowns: [
      { key: 'languages', label: 'Languages', unit: 'submissions', items: languageBreakdown(submissions) },
      { key: 'tags', label: 'Problem topics', unit: 'submissions', items: tagBreakdown(submissions) },
      { key: 'verdicts', label: 'Submission verdicts', unit: 'submissions', items: verdictBreakdown(submissions) },
    ],

    ratingHistory: buildRatingHistory(ratingChanges),
    activity: buildActivity(submissions),
    highlights: buildHighlights(user, submissions, ratingChanges),

    fetchedAt: new Date().toISOString(),
  };
}