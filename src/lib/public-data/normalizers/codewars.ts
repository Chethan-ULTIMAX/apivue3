/**
 * Codewars normalizer.
 */

import type {
  PublicBreakdown,
  PublicDataResult,
  PublicMetric,
  PublicProfile,
} from '../types';
import type { RawCodewarsUser } from '../fetchers/codewars';

/* ============================================================
 * Helpers
 * ============================================================ */

function toPublicProfile(raw: RawCodewarsUser): PublicProfile {
  return {
    platform: 'codewars',
    username: raw.username,
    displayName: raw.name?.trim() || raw.username,
    avatarUrl: null,
    profileUrl: `https://www.codewars.com/users/${raw.username}`,
    bio: raw.clan ? `Clan: ${raw.clan}` : null,
    location: raw.country?.trim() || null,
    joinedAt: null,
  };
}

function buildLanguageBreakdown(raw: RawCodewarsUser): PublicBreakdown {
  const langs = raw.ranks?.languages ?? {};
  const items = Object.entries(langs)
    .map(([label, info]) => ({
      label,
      value: info.score ?? 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return { label: 'Language scores', items };
}

/* ============================================================
 * Public API
 * ============================================================ */

export function normalizeCodewarsData(
  raw: RawCodewarsUser,
): PublicDataResult {
  const metrics: PublicMetric[] = [
    { label: 'Honor', value: raw.honor ?? 0 },
    { label: 'Overall rank', value: raw.ranks?.overall?.name ?? 'Unranked' },
    { label: 'Overall score', value: raw.ranks?.overall?.score ?? 0 },
    {
      label: 'Katas completed',
      value: raw.codeChallenges?.totalCompleted ?? 0,
    },
    {
      label: 'Katas authored',
      value: raw.codeChallenges?.totalAuthored ?? 0,
    },
    {
      label: 'Leaderboard position',
      value: raw.leaderboardPosition ?? 'Unranked',
    },
  ];

  return {
    platform: 'codewars',
    profile: toPublicProfile(raw),
    metrics,
    activity: [],
    breakdowns: [buildLanguageBreakdown(raw)],
    fetchedAt: new Date().toISOString(),
    source: 'public-api',
  };
}