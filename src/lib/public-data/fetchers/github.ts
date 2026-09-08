import type {
  PublicActivity,
  PublicDataResult,
  PublicProfile,
} from '../types';

const GITHUB_API = 'https://api.github.com';

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  location: string | null;
  created_at: string;
  public_repos: number;
  followers: number;
  following: number;
  public_gists: number;
}

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string | null;
  repo?: {
    name: string;
  };
  payload?: {
    ref?: string;
    commits?: Array<{
      message?: string;
    }>;
  };
}

async function githubRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('GitHub user not found.');
    }

    if (response.status === 403) {
      throw new Error(
        'GitHub public API rate limit reached. Please try again later.'
      );
    }

    throw new Error(`GitHub request failed with status ${response.status}.`);
  }

  return response.json();
}

export async function fetchGitHubPublicProfile(
  username: string
): Promise<PublicDataResult> {
  const cleanUsername = username.trim();

  if (!cleanUsername) {
    throw new Error('Enter a GitHub username.');
  }

  const [user, events] = await Promise.all([
    githubRequest<GitHubUser>(
      `/users/${encodeURIComponent(cleanUsername)}`
    ),
    githubRequest<GitHubEvent[]>(
      `/users/${encodeURIComponent(cleanUsername)}/events/public?per_page=10`
    ),
  ]);

  const profile: PublicProfile = {
    platform: 'github',
    username: user.login,
    displayName: user.name,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    bio: user.bio,
    location: user.location,
    joinedAt: user.created_at,
  };

  const activity: PublicActivity[] = events
    .filter((event) => event.created_at)
    .map((event) => ({
      id: event.id,
      title: formatGitHubEventTitle(event),
      description: event.repo
        ? `Repository: ${event.repo.name}`
        : undefined,
      timestamp: event.created_at!,
      url: event.repo
        ? `https://github.com/${event.repo.name}`
        : user.html_url,
      type: event.type,
    }));

  return {
    platform: 'github',
    profile,
    metrics: [
      {
        label: 'Public repositories',
        value: user.public_repos,
      },
      {
        label: 'Followers',
        value: user.followers,
      },
      {
        label: 'Following',
        value: user.following,
      },
      {
        label: 'Public gists',
        value: user.public_gists,
      },
    ],
    activity,
    fetchedAt: new Date().toISOString(),
    source: 'public-api',
  };
}

function formatGitHubEventTitle(event: GitHubEvent): string {
  switch (event.type) {
    case 'PushEvent':
      return 'Pushed code';

    case 'PullRequestEvent':
      return 'Updated a pull request';

    case 'IssuesEvent':
      return 'Updated an issue';

    case 'IssueCommentEvent':
      return 'Commented on an issue';

    case 'CreateEvent':
      return 'Created something';

    case 'DeleteEvent':
      return 'Deleted something';

    case 'ForkEvent':
      return 'Forked a repository';

    case 'WatchEvent':
      return 'Starred a repository';

    case 'ReleaseEvent':
      return 'Published a release';

    default:
      return event.type.replace(/Event$/, '');
  }
}