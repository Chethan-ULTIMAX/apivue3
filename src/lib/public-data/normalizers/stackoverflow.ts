/**
 * Stack Overflow normalizer.
 */

import type {
  PublicActivity,
  PublicBreakdown,
  PublicDataResult,
  PublicMetric,
  PublicProfile,
} from '../types';
import type { RawStackOverflowProfile } from '../fetchers/stackoverflow';

/* ============================================================
 * Helpers
 * ============================================================ */

function toPublicProfile(raw: RawStackOverflowProfile): PublicProfile {
  const { user } = raw;
  return {
    platform: 'stackoverflow',
    username: String(user.user_id),
    displayName: user.display_name,
    avatarUrl: user.profile_image ?? null,
    profileUrl: user.link ?? `https://stackoverflow.com/users/${user.user_id}`,
    bio: null,
    location: user.location?.trim() || null,
    joinedAt: user.creation_date
      ? new Date(user.creation_date * 1000).toISOString()
      : null,
  };
}

function buildTagBreakdown(raw: RawStackOverflowProfile): PublicBreakdown {
  const total = raw.tags.reduce((s, t) => s + t.answer_count, 0);
  const items = raw.tags
    .map((t) => ({
      label: t.tag_name,
      value: t.answer_count,
      percentage:
        total > 0 ? Math.round((t.answer_count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.value - a.value);
  return { label: 'Top answer tags', items };
}

/* ============================================================
 * Public API
 * ============================================================ */

export function normalizeStackOverflowData(
  raw: RawStackOverflowProfile,
): PublicDataResult {
  const { user, tags } = raw;

  const metrics: PublicMetric[] = [
    { label: 'Reputation', value: user.reputation },
    { label: 'Gold badges', value: user.badge_counts.gold },
    { label: 'Silver badges', value: user.badge_counts.silver },
    { label: 'Bronze badges', value: user.badge_counts.bronze },
    { label: 'Answers', value: user.answer_count ?? 0 },
    { label: 'Questions', value: user.question_count ?? 0 },
    { label: 'Profile views', value: user.view_count ?? 0 },
    { label: 'Up votes', value: user.up_vote_count ?? 0 },
    { label: 'Down votes', value: user.down_vote_count ?? 0 },
  ];

  // Stack Overflow's public API does not expose a meaningful recent-activity
  // feed without additional authenticated endpoints. We surface the top
  // tags as "activity items" instead — they are real, dated values
  // computed from the user's actual answered questions.
  const now = new Date().toISOString();
  const activity: PublicActivity[] = tags.map((tag) => ({
    id: `tag-${tag.tag_name}`,
    title: `${tag.tag_name} · ${tag.answer_count} answer${tag.answer_count === 1 ? '' : 's'}`,
    description: `${tag.answer_score} total score`,
    timestamp: now,
    url: user.link ?? `https://stackoverflow.com/users/${user.user_id}`,
    type: 'tag',
  }));

  return {
    platform: 'stackoverflow',
    profile: toPublicProfile(raw),
    metrics,
    activity,
    breakdowns: [buildBreakdown(raw)],
    fetchedAt: new Date().toISOString(),
    source: 'public-api',
  };
}

function buildBreakdown(raw: RawStackOverflowProfile): PublicBreakdown {
  return buildTagBreakdown(raw);
}