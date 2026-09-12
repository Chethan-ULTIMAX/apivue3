/**
 * GitHub public profile fetcher.
 *
 * Contacts api.github.com and returns a typed raw shape. No shaping
 * into APIVue's PublicDataResult happens here — that is the
 * normalizer's job.
 */

const GITHUB_API = 'https://api.github.com';

/* ============================================================
 * Raw types (GitHub API shapes we care about)
 * ============================================================ */

export interface RawGitHubUser {
  login: string;
  id: number;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  twitter_username: string | null;
  created_at: string;
  updated_at: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
}

export interface RawGitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  fork: boolean;
  archived: boolean;
  disabled?: boolean;
  topics?: string[];
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface RawGitHubEvent {
  id: string;
  type: string;
  created_at: string | null;
  repo?: { name: string };
  payload?: {
    ref?: string;
    size?: number;
    action?: string;
    commits?: Array<{ message?: string }>;
  };
}

export interface RawGitHubProfile {
  user: RawGitHubUser;
  repos: RawGitHubRepo[];
  events: RawGitHubEvent[];
}

/* ============================================================
 * HTTP helper
 * ============================================================ */

interface GitHubErrorResponse {
  message?: string;
}

async function githubRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('GitHub user not found.');
    }

    if (response.status === 403 || response.status === 429) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        const reset = response.headers.get('x-ratelimit-reset');
        const resetMsg = reset
          ? ` Try again after ${new Date(Number(reset) * 1000).toLocaleTimeString()}.`
          : ' Please try again later.';
        throw new Error(`GitHub API rate limit reached.${resetMsg}`);
      }
      throw new Error(
        'GitHub refused the request. Please try again in a moment.',
      );
    }

    let detail = '';
    try {
      const body = (await response.json()) as GitHubErrorResponse;
      if (body?.message) detail = ` (${body.message})`;
    } catch {
      /* non-JSON response */
    }

    throw new Error(
      `GitHub request failed with status ${response.status}${detail}.`,
    );
  }

  return (await response.json()) as T;
}

/* ============================================================
 * Public API
 * ============================================================ */

/**
 * Fetches a GitHub user's public profile, their public repositories
 * (up to 100, sorted by stars), and their recent public events.
 *
 * Note: GitHub's public API does not expose private repositories.
 * Any request for them would require OAuth with appropriate scopes.
 */
export async function fetchGitHubPublicProfile(
  username: string,
): Promise<RawGitHubProfile> {
  const cleanUsername = username.trim();

  if (!cleanUsername) {
    throw new Error('Enter a GitHub username.');
  }

  const encoded = encodeURIComponent(cleanUsername);

  const [user, repos, events] = await Promise.all([
    githubRequest<RawGitHubUser>(`/users/${encoded}`),
    githubRequest<RawGitHubRepo[]>(
      `/users/${encoded}/repos?per_page=100&sort=pushed&direction=desc`,
    ),
    githubRequest<RawGitHubEvent[]>(
      `/users/${encoded}/events/public?per_page=30`,
    ),
  ]);

  return { user, repos, events };
}