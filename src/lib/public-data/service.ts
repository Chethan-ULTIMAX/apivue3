import type {
  PublicDataResult,
  PublicPlatform,
} from './types';
import { getPublicPlatform } from './registry';

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