import type { PublicPlatform } from './types';
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
  fetch: (username: string) => Promise<Awaited<ReturnType<
    typeof fetchGitHubPublicProfile
  >>>;
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
      const data = await fetchGitHubPublicProfile(username);
      return normalizeGitHubData(data);
    },
  },

  codeforces: {
    id: 'codeforces',
    name: 'Codeforces',
    description: 'Explore public competitive-programming activity.',
    placeholder: 'Codeforces handle',
    fetch: async (username) => {
      const data = await fetchCodeforcesPublicProfile(username);
      return normalizeCodeforcesData(data);
    },
  },

  leetcode: {
    id: 'leetcode',
    name: 'LeetCode',
    description: 'Explore publicly available LeetCode activity.',
    placeholder: 'LeetCode username',
    fetch: async (username) => {
      const data = await fetchLeetCodePublicProfile(username);
      return normalizeLeetCodeData(data);
    },
  },

  codewars: {
    id: 'codewars',
    name: 'Codewars',
    description: 'Explore publicly available Codewars activity.',
    placeholder: 'Codewars username',
    fetch: async (username) => {
      const data = await fetchCodewarsPublicProfile(username);
      return normalizeCodewarsData(data);
    },
  },

  stackoverflow: {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    description: 'Explore publicly available Stack Overflow activity.',
    placeholder: 'Stack Overflow user ID (numeric)',
    fetch: async (userId) => {
      const data = await fetchStackOverflowPublicProfile(userId);
      return normalizeStackOverflowData(data);
    },
  },
};

export function getPublicPlatform(
  platform: PublicPlatform
): PublicPlatformDefinition {
  const definition = publicPlatformRegistry[platform];

  if (!definition) {
    throw new Error(`Unsupported public platform: ${platform}`);
  }

  return definition;
}