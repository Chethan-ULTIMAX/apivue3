/**
 * Public-data barrel export.
 *
 * Consumers should normally import from this file:
 *   import { explorePublicProfile, getPublicPlatform } from '@/lib/public-data';
 *
 * Fetchers are exported for advanced use cases (e.g. bypassing the
 * registry), but the recommended entry point is `explorePublicProfile`.
 *
 * Normalizers are intentionally NOT exported. They are an internal
 * implementation detail of the registry and should not be called
 * directly from application code.
 */

export * from './types';
export * from './registry';
export * from './service';

// Advanced / direct fetcher access
export { fetchGitHubPublicProfile } from './fetchers/github';
export { fetchCodeforcesPublicProfile } from './fetchers/codeforces';
export { fetchLeetCodePublicProfile } from './fetchers/leetcode';
export { fetchCodewarsPublicProfile } from './fetchers/codewars';
export { fetchStackOverflowPublicProfile } from './fetchers/stackoverflow';