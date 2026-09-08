import type { PublicPlatform } from './types';
import { fetchGitHubPublicProfile } from './fetchers/github';
import { fetchCodeforcesPublicProfile } from './fetchers/codeforces';
import { normalizeGitHubData } from './normalizers/github';
import { normalizeCodeforcesData } from './normalizers/codeforces';

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