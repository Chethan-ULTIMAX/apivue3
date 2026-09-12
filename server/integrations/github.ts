import crypto from 'node:crypto';

import { env } from '../env';

/* ============================================================
 * Raw GitHub API types
 * ============================================================ */

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  email: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  language: string | null;
  fork: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  topics?: string[];
  archived?: boolean;
  disabled?: boolean;
  visibility?: string;
}

interface GitHubEvent {
  id: string;
  type: string;
  actor?: { login: string; avatar_url?: string };
  repo?: { id: number; name: string; url?: string };
  created_at: string;
  payload?: {
    action?: string;
    ref?: string;
    ref_type?: string;
    size?: number;
    commits?: Array<{ message?: string }>;
    distinct_size?: number;
  };
}

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

/* ============================================================
 * OAuth state + PKCE
 * ============================================================ */

const pendingStates = new Map<
  string,
  { sessionId: string; userId: string; codeVerifier: string; createdAt: number }
>();

const STATE_TTL_MS = 10 * 60 * 1000;

function base64Url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function createPkceVerifier(): string {
  return base64Url(crypto.randomBytes(32));
}

function createPkceChallenge(verifier: string): string {
  return base64Url(crypto.createHash('sha256').update(verifier).digest());
}

/* ============================================================
 * HTTP helper
 * ============================================================ */

function githubHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'APIVue/1.0',
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function githubRequest<T>(url: string, accessToken?: string): Promise<T> {
  const response = await fetch(url, { headers: githubHeaders(accessToken) });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('GitHub authorization is invalid or lacks the required scope.');
    }
    if (response.status === 404) {
      throw new Error('GitHub resource not found.');
    }
    if (response.status === 429) {
      throw new Error('GitHub rate limit reached. Try again later.');
    }
    throw new Error(`GitHub request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

/* ============================================================
 * Public: OAuth flow
 * ============================================================ */

export async function createGitHubAuthorizationUrl(
  sessionId: string,
  userId: string,
): Promise<string> {
  const state = base64Url(crypto.randomBytes(32));
  const codeVerifier = createPkceVerifier();
  const codeChallenge = createPkceChallenge(codeVerifier);

  pendingStates.set(state, { sessionId, userId, codeVerifier, createdAt: Date.now() });

  // Opportunistic cleanup of expired entries.
  const cutoff = Date.now() - STATE_TTL_MS;
  for (const [key, value] of pendingStates) {
    if (value.createdAt < cutoff) pendingStates.delete(key);
  }

  const params = new URLSearchParams({
    client_id: env.githubClientId,
    redirect_uri: env.githubCallbackUrl,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: 'read:user',
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export function consumeGitHubState(state: string, sessionId: string) {
  const pending = pendingStates.get(state);
  if (!pending) return null;
  pendingStates.delete(state);

  if (Date.now() - pending.createdAt > STATE_TTL_MS) return null;
  if (pending.sessionId !== sessionId) return null;

  return pending;
}

export async function exchangeGitHubCode(
  code: string,
  codeVerifier: string,
): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'APIVue/1.0',
    },
    body: new URLSearchParams({
      client_id: env.githubClientId,
      client_secret: env.githubClientSecret,
      code,
      redirect_uri: env.githubCallbackUrl,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed with status ${response.status}.`);
  }

  const data = (await response.json()) as GitHubTokenResponse;

  if (!data.access_token) {
    throw new Error(
      data.error_description ?? data.error ?? 'GitHub did not return an access token.',
    );
  }

  return data.access_token;
}

/* ============================================================
 * Public: raw GitHub fetchers
 * ============================================================ */

export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  if (!accessToken.trim()) throw new Error('GitHub access token is required.');
  return githubRequest<GitHubUser>('https://api.github.com/user', accessToken);
}

export async function getGitHubRepositories(
  accessToken: string,
): Promise<GitHubRepository[]> {
  if (!accessToken.trim()) throw new Error('GitHub access token is required.');

  const all: GitHubRepository[] = [];
  const perPage = 100;

  for (let page = 1; page <= 3; page++) {
    const batch = await githubRequest<GitHubRepository[]>(
      `https://api.github.com/user/repos?sort=updated&direction=desc&per_page=${perPage}&page=${page}`,
      accessToken,
    );
    all.push(...batch);
    if (batch.length < perPage) break;
  }

  return all;
}

export async function getGitHubEvents(accessToken: string): Promise<GitHubEvent[]> {
  if (!accessToken.trim()) throw new Error('GitHub access token is required.');

  const login = (await getGitHubUser(accessToken)).login;
  const all: GitHubEvent[] = [];
  const perPage = 100;

  for (let page = 1; page <= 3; page++) {
    const batch = await githubRequest<GitHubEvent[]>(
      `https://api.github.com/users/${encodeURIComponent(login)}/events/public?per_page=${perPage}&page=${page}`,
      accessToken,
    );
    all.push(...batch);
    if (batch.length < perPage) break;
  }

  return all;
}

/* ============================================================
 * Normalization helpers
 *
 * IMPORTANT: every returned array here uses the SAME field names
 * as the frontend ProfileData type from
 * `src/lib/integrations/types.ts`:
 *   breakdowns[].items → { label, value }
 *   ratingHistory      → { date, value }
 *   activity           → { date, count }
 *   highlights         → { title, url?, subtitle? }
 * ============================================================ */

function buildLanguageBreakdown(repos: GitHubRepository[]) {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  return Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

function buildEventBreakdown(events: GitHubEvent[]) {
  const counts = new Map<string, number>();
  for (const event of events) {
    counts.set(event.type, (counts.get(event.type) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function buildTopicBreakdown(repos: GitHubRepository[]) {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    for (const topic of repo.topics ?? []) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);
}

/**
 * Groups GitHub events by day so the frontend can render them
 * alongside other platforms' activity charts (same { date, count }
 * shape as Codeforces submissions, LeetCode calendar, etc).
 */
function buildDailyActivity(events: GitHubEvent[]): Array<{ date: string; count: number }> {
  const byDay = new Map<string, number>();
  for (const event of events) {
    const key = event.created_at.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  return Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildTopRepositoryBreakdown(repos: GitHubRepository[]) {
  return repos
    .filter((r) => !r.fork && !r.archived && !r.disabled)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 10)
    .map((r) => ({ label: r.name, value: r.stargazers_count }));
}

function buildHighlights(
  user: GitHubUser,
  stats: { totalStars: number; original: number; events: number },
): Array<{ title: string; url?: string; subtitle?: string }> {
  const out: Array<{ title: string; url?: string; subtitle?: string }> = [];

  if (user.public_repos > 0) {
    out.push({
      title: `${user.public_repos} public repositories`,
      subtitle: `${stats.original} original · ${stats.events} recent events`,
    });
  }
  if (user.followers > 0) {
    out.push({ title: `${user.followers} followers` });
  }
  if (stats.totalStars > 0) {
    out.push({ title: `${stats.totalStars} total stars`, subtitle: 'Across original repositories' });
  }
  if (user.blog) {
    out.push({ title: user.blog, url: user.blog.startsWith('http') ? user.blog : `https://${user.blog}` });
  }

  return out;
}

/* ============================================================
 * Public: normalized profile
 * ============================================================ */

export interface NormalizedGitHubProfile {
  platform: 'github';
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

export async function getGitHubUserProfile(
  accessToken: string,
): Promise<NormalizedGitHubProfile> {
  const user = await getGitHubUser(accessToken);

  const [repositories, events] = await Promise.all([
    getGitHubRepositories(accessToken).catch(() => [] as GitHubRepository[]),
    getGitHubEvents(accessToken).catch(() => [] as GitHubEvent[]),
  ]);

  const originals = repositories.filter((r) => !r.fork && !r.archived && !r.disabled);
  const forks = repositories.filter((r) => r.fork);

  const totalStars = originals.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks = originals.reduce((sum, r) => sum + r.forks_count, 0);
  const totalOpenIssues = originals.reduce((sum, r) => sum + r.open_issues_count, 0);

  const languageItems = buildLanguageBreakdown(repositories);
  const eventItems = buildEventBreakdown(events);
  const topicItems = buildTopicBreakdown(repositories);
  const topRepoItems = buildTopRepositoryBreakdown(repositories);
  const activity = buildDailyActivity(events);

  return {
    platform: 'github',
    handle: user.login,
    displayName: user.name?.trim() || user.login,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    bio: user.bio,
    location: user.location,
    joinedAt: user.created_at,

    metrics: [
      { key: 'public_repos', label: 'Public repositories', value: user.public_repos, format: 'number' },
      { key: 'followers', label: 'Followers', value: user.followers, format: 'number' },
      { key: 'following', label: 'Following', value: user.following, format: 'number' },
      { key: 'public_gists', label: 'Public gists', value: user.public_gists, format: 'number' },
      { key: 'repository_stars', label: 'Total stars', value: totalStars, format: 'number' },
      { key: 'repository_forks', label: 'Total forks', value: totalForks, format: 'number' },
      { key: 'open_issues', label: 'Open issues', value: totalOpenIssues, format: 'number' },
      { key: 'original_repositories', label: 'Original repositories', value: originals.length, format: 'number' },
      { key: 'forked_repositories', label: 'Forked repositories', value: forks.length, format: 'number' },
      { key: 'recent_events', label: 'Recent events', value: events.length, format: 'number' },
    ],

    breakdowns: [
      { key: 'languages', label: 'Languages by repository', unit: 'repositories', items: languageItems },
      { key: 'events', label: 'Activity by event type', unit: 'events', items: eventItems },
      { key: 'topics', label: 'Repository topics', unit: 'repositories', items: topicItems },
      { key: 'top_repositories', label: 'Top repositories (by stars)', unit: 'stars', items: topRepoItems },
    ],

    ratingHistory: [],
    activity,
    highlights: buildHighlights(user, {
      totalStars,
      original: originals.length,
      events: events.length,
    }),

    fetchedAt: new Date().toISOString(),
  };
}