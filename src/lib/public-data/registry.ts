import type { PublicDataResult, PublicPlatform } from './types';
import { fetchGitHubPublicProfile } from './fetchers/github';
import { fetchCodeforcesPublicProfile } from './fetchers/codeforces';
import { fetchLeetCodePublicProfile } from './fetchers/leetcode';
import { fetchCodewarsPublicProfile } from './fetchers/codewars';
import { fetchStackOverflowPublicProfile } from './fetchers/stackoverflow';
import { normalizeGitHubData } from './normalizers/github';
import { normalizeCodeforcesData } from './normalizers/codeforces';
import { normalizeLeetCodeData } from './normalizers/leetcode';
import { normalizeCodewarsData } from './normalizers/codewars';
import { normalizeStackOverflowData } from './normalizers/stackoverflow';

export interface PublicPlatformDefinition {
  id: PublicPlatform;
  name: string;
  description: string;
  placeholder: string;
  /**
   * Fetches + normalizes a public profile for this platform.
   * Always returns the fully normalized `PublicDataResult` shape —
   * never the raw platform response.
   */
  fetch: (username: string) => Promise<PublicDataResult>;
}

export const publicPlatformRegistry: Record<
  PublicPlatform,
  PublicPlatformDefinition
> = {
  github: {
    id: 'github',
    name: 'GitHub',
    description: 'Explore publicly available GitHub activity.',
    placeholder: 'GitHub username',
    fetch: async (username) => {
      const raw = await fetchGitHubPublicProfile(username);
      return normalizeGitHubData(raw);
    },
  },

  codeforces: {
    id: 'codeforces',
    name: 'Codeforces',
    description: 'Explore public competitive-programming activity.',
    placeholder: 'Codeforces handle',
    fetch: async (username) => {
      const raw = await fetchCodeforcesPublicProfile(username);
      return normalizeCodeforcesData(raw);
    },
  },

  leetcode: {
    id: 'leetcode',
    name: 'LeetCode',
    description: 'Explore publicly available LeetCode activity.',
    placeholder: 'LeetCode username',
    fetch: async (username) => {
      const raw = await fetchLeetCodePublicProfile(username);
      return normalizeLeetCodeData(raw);
    },
  },

  codewars: {
    id: 'codewars',
    name: 'Codewars',
    description: 'Explore publicly available Codewars activity.',
    placeholder: 'Codewars username',
    fetch: async (username) => {
      const raw = await fetchCodewarsPublicProfile(username);
      return normalizeCodewarsData(raw);
    },
  },

  stackoverflow: {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    description: 'Explore publicly available Stack Overflow activity.',
    placeholder: 'Stack Overflow user ID (numeric)',
    fetch: async (userId) => {
      const raw = await fetchStackOverflowPublicProfile(userId);
      return normalizeStackOverflowData(raw);
    },
  },
};

/**
 * Returns the platform definition, or throws if the platform is unknown.
 * Callers should normally only pass values from the `PublicPlatform` union,
 * so this guard exists mainly for runtime safety (e.g. URL params).
 */
export function getPublicPlatform(
  platform: PublicPlatform
): PublicPlatformDefinition {
  const definition = publicPlatformRegistry[platform];

  if (!definition) {
    throw new Error(`Unsupported public platform: ${platform}`);
  }

  return definition;
}