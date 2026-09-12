/**
 * Codeforces normalizer.
 */

import type {
  PublicActivity,
  PublicBreakdown,
  PublicDataResult,
  PublicMetric,
  PublicProfile,
} from '../types';
import type {
  RawCodeforcesProfile,
  RawCodeforcesSubmission,
} from '../fetchers/codeforces';

/* ============================================================
 * Helpers
 * ============================================================ */

function toPublicProfile(raw: RawCodeforcesProfile): PublicProfile {
  const { user } = raw;
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || null;

  return {
    platform: 'codeforces',
    username: user.handle,
    displayName,
    avatarUrl: user.avatar ?? user.titlePhoto ?? null,
    profileUrl: `https://codeforces.com/profile/${encodeURIComponent(
      user.handle,
    )}`,
    bio: user.organization?.trim() || null,
    location: [user.city, user.country].filter(Boolean).join(', ') || null,
    joinedAt: new Date(user.registrationTimeSeconds * 1000).toISOString(),
  };
}

function submissionTitle(sub: RawCodeforcesSubmission): string {
  const parts: string[] = [];
  if (sub.problem.rating) parts.push(`${sub.problem.rating} rated`);
  if (sub.verdict) parts.push(sub.verdict);
  if (sub.programmingLanguage) parts.push(sub.programmingLanguage);
  return parts.join(' · ');
}

function toPublicActivity(sub: RawCodeforcesSubmission, profileUrl: string): PublicActivity {
  return {
    id: String(sub.id),
    title: sub.problem.name,
    description: submissionTitle(sub) || undefined,
    timestamp: new Date(sub.creationTimeSeconds * 1000).toISOString(),
    url: sub.contestId
      ? `https://codeforces.com/contest/${sub.contestId}/problem/${sub.problem.index}`
      : profileUrl,
    type: 'submission',
  };
}

function buildTagBreakdown(
  submissions: RawCodeforcesSubmission[],
): PublicBreakdown {
  const counts = new Map<string, number>();
  for (const sub of submissions) {
    if (sub.verdict !== 'OK') continue;
    for (const tag of sub.problem.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  const items = Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return { label: 'Tags solved', items };
}

/* ============================================================
 * Public API
 * ============================================================ */

export function normalizeCodeforcesData(
  raw: RawCodeforcesProfile,
): PublicDataResult {
  const { user, ratings, submissions } = raw;

  const accepted = submissions.filter((s) => s.verdict === 'OK');
  const profileUrl = `https://codeforces.com/profile/${encodeURIComponent(
    user.handle,
  )}`;

  const activity: PublicActivity[] = submissions
    .map((s) => toPublicActivity(s, profileUrl))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const metrics: PublicMetric[] = [
    { label: 'Current rating', value: user.rating ?? 'Unrated' },
    { label: 'Max rating', value: user.maxRating ?? '—' },
    { label: 'Current rank', value: user.rank ?? 'Unrated' },
    { label: 'Max rank', value: user.maxRank ?? '—' },
    { label: 'Accepted recently', value: accepted.length },
    { label: 'Rated contests', value: ratings.length },
    { label: 'Contribution', value: user.contribution },
    { label: 'Friends', value: user.friendOfCount },
  ];

  return {
    platform: 'codeforces',
    profile: toPublicProfile(raw),
    metrics,
    activity,
    breakdowns: [buildTagBreakdown(submissions)],
    fetchedAt: new Date().toISOString(),
    source: 'public-api',
  };
}