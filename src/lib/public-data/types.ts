/**
 * Public-data layer types.
 *
 * These types describe the normalized shape that all public platform
 * integrations (GitHub, Codeforces, LeetCode, Codewars, Stack Overflow)
 * must produce. The rest of the application consumes this shape only —
 * it must never depend on any raw platform-specific response.
 *
 * Source of truth for the Explore feature and any public-profile analytics.
 */

export type PublicPlatform =
  | 'github'
  | 'codeforces'
  | 'leetcode'
  | 'codewars'
  | 'stackoverflow';

/**
 * Normalized public profile header info.
 * All fields are nullable because platforms differ in what they expose.
 */
export interface PublicProfile {
  platform: PublicPlatform;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  bio: string | null;
  location: string | null;
  joinedAt: string | null;
}

/**
 * A single normalized metric (e.g. "Followers: 1,234").
 * `value` is intentionally `string | number` so platforms can
 * express metrics that are not strictly numeric (e.g. "Top 5%").
 */
export interface PublicMetric {
  label: string;
  value: string | number;
  description?: string;
}

/**
 * A breakdown is a named group of sub-values
 * (e.g. Language distribution, Event types, Difficulty).
 */
export interface PublicBreakdown {
  label: string;
  items: Array<{
    label: string;
    value: number;
    /** Pre-computed percentage (0–100). Optional; UI may compute its own. */
    percentage?: number;
  }>;
}

/**
 * Normalized repository entry (currently GitHub-specific, but
 * kept generic so other platforms can adopt it if relevant).
 */
export interface PublicRepository {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  isFork: boolean;
  isArchived: boolean;
  topics: string[];
  updatedAt: string | null;
}

/**
 * A normalized activity event.
 * Used for recent-activity feeds and timeline views.
 */
export interface PublicActivity {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  url?: string;
  type: string;
}

/**
 * Final normalized output for a public platform lookup.
 * Everything downstream (analytics, UI, comparison) consumes this.
 *
 * `breakdowns` and `repositories` are optional because not every
 * platform exposes grouped distributions or repository listings.
 * When absent, the UI simply does not render those sections.
 */
export interface PublicDataResult {
  platform: PublicPlatform;
  profile: PublicProfile;
  metrics: PublicMetric[];
  activity: PublicActivity[];
  breakdowns?: PublicBreakdown[];
  repositories?: PublicRepository[];
  fetchedAt: string;
  source: 'public-api';
}

/**
 * Conceptual contract that any public-data fetcher follows.
 * Exposed for documentation; the registry wraps fetchers with
 * normalizers so consumers receive `PublicDataResult`, not raw data.
 */
export interface PublicDataFetcher {
  platform: PublicPlatform;
  fetchProfile(username: string): Promise<PublicDataResult>;
}