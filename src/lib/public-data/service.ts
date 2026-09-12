import type { PublicDataResult, PublicPlatform } from './types';
import { getPublicPlatform } from './registry';

/**
 * High-level entry point for the Explore feature.
 *
 * Fetches and normalizes a public profile for the given platform.
 * Throws a user-friendly Error for invalid input or unknown platforms.
 *
 * Recommended usage:
 *   const result = await explorePublicProfile('github', 'torvalds');
 */
export async function explorePublicProfile(
  platform: PublicPlatform,
  username: string
): Promise<PublicDataResult> {
  const cleanUsername = username.trim();

  if (!cleanUsername) {
    throw new Error('Please enter a username or handle.');
  }

  const definition = getPublicPlatform(platform);
  return definition.fetch(cleanUsername);
}