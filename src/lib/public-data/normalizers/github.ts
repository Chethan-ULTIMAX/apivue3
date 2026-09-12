/**
 * GitHub normalizer.
 *
 * Converts RawGitHubProfile into APIVue's PublicDataResult shape.
 * All derived data (breakdowns, top repositories, aggregate metrics)
 * is computed here from real fields. Nothing is invented.
 */

import type {
  PublicActivity,
  PublicBreakdown,
  PublicDataResult,
  PublicMetric,
  PublicProfile,
  PublicRepository,
} from '../types';
import type {
  RawGitHubEvent,
  RawGitHubProfile,
  RawGitHubRepo,
} from '../fetchers/github';

/* ============================================================
 * Helpers
 * ============================================================ */

function toPublicProfile(raw: RawGitHubProfile): PublicProfile {
  const { user } = raw;
  return {
    platform: 'github',
    username: user.login,
    displayName: user.name?.trim() || null,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    bio: user.bio?.trim() || null,
    location: user.location?.trim() || null,
    joinedAt: user.created_at,
  };
}

function toPublicRepository(repo: RawGitHubRepo): PublicRepository {
  return {
    name: repo.name,
    url: repo.html_url,
    description: repo.description?.trim() || null,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    isFork: repo.fork,
    isArchived: repo.archived,
    topics: repo.topics ?? [],
    updatedAt: repo.pushed_at || repo.updated_at,
  };
}

function formatEventTitle(event: RawGitHubEvent): string {
  switch (event.type) {
    case 'PushEvent': {
      const n = event.payload?.size ?? event.payload?.commits?.length ?? 0;
      return n > 0
        ? `Pushed ${n} commit${n === 1 ? '' : 's'}`
        : 'Pushed code';
    }
    case 'PullRequestEvent':
      return event.payload?.action
        ? `${capitalize(event.payload.action)} a pull request`
        : 'Updated a pull request';
    case 'IssuesEvent':
      return event.payload?.action
        ? `${capitalize(event.payload.action)} an issue`
        : 'Updated an issue';
    case 'IssueCommentEvent':
      return 'Commented on an issue';
    case 'PullRequestReviewEvent':
      return 'Reviewed a pull request';
    case 'CreateEvent':
      return event.payload?.ref
        ? `Created ${event.payload.ref}`
        : 'Created a reference';
    case 'DeleteEvent':
      return event.payload?.ref
        ? `Deleted ${event.payload.ref}`
        : 'Deleted a reference';
    case 'ForkEvent':
      return 'Forked a repository';
    case 'WatchEvent':
      return 'Starred a repository';
    case 'ReleaseEvent':
      return 'Published a release';
    case 'PublicEvent':
      return 'Made a repository public';
    default:
      return event.type.replace(/Event$/, '') || 'Activity';
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toPublicActivity(event: RawGitHubEvent): PublicActivity | null {
  if (!event.created_at) return null;
  return {
    id: event.id,
    title: formatEventTitle(event),
    description: event.repo ? event.repo.name : undefined,
    timestamp: event.created_at,
    url: event.repo ? `https://github.com/${event.repo.name}` : undefined,
    type: event.type,
  };
}

/* ============================================================
 * Aggregations
 * ============================================================ */

function buildLanguageBreakdown(repos: RawGitHubRepo[]): PublicBreakdown {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (repo.fork) continue; // Only count original repos
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  const items = Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return { label: 'Languages', items };
}

function buildTopRepositories(repos: RawGitHubRepo[]): PublicRepository[] {
  return repos
    .filter((r) => !r.fork && !r.archived && !r.disabled)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6)
    .map(toPublicRepository);
}

function buildMetrics(raw: RawGitHubProfile): PublicMetric[] {
  const { user, repos } = raw;

  const originals = repos.filter((r) => !r.fork);
  const forks = repos.filter((r) => r.fork);
  const totalStars = originals.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = originals.reduce((s, r) => s + r.forks_count, 0);
  const openIssues = originals.reduce((s, r) => s + r.open_issues_count, 0);

  return [
    { label: 'Public repositories', value: user.public_repos },
    { label: 'Followers', value: user.followers },
    { label: 'Following', value: user.following },
    { label: 'Public gists', value: user.public_gists },
    { label: 'Total stars', value: totalStars },
    { label: 'Total forks', value: totalForks },
    { label: 'Original repositories', value: originals.length },
    { label: 'Forked repositories', value: forks.length },
    { label: 'Open issues', value: openIssues },
  ];
}

/* ============================================================
 * Public API
 * ============================================================ */

export function normalizeGitHubData(raw: RawGitHubProfile): PublicDataResult {
  const activity: PublicActivity[] = [];
  for (const event of raw.events) {
    const item = toPublicActivity(event);
    if (item) activity.push(item);
  }

  const breakdowns: PublicBreakdown[] = [buildLanguageBreakdown(raw.repos)];
  const repositories = buildTopRepositories(raw.repos);

  return {
    platform: 'github',
    profile: toPublicProfile(raw),
    metrics: buildMetrics(raw),
    activity,
    breakdowns,
    repositories,
    fetchedAt: new Date().toISOString(),
    source: 'public-api',
  };
}