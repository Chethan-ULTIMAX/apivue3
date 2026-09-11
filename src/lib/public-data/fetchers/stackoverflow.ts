import type {
  PublicActivity,
  PublicDataResult,
  PublicProfile,
} from '../types';

interface StackOverflowUser {
  items: Array<{
    user_id: number;
    display_name: string;
    profile_image?: string;
    link?: string;
    location?: string;
    reputation: number;
    badge_counts: {
      gold: number;
      silver: number;
      bronze: number;
    };
    answer_count?: number;
    question_count?: number;
    down_vote_count?: number;
    up_vote_count?: number;
    view_count?: number;
    creation_date?: number;
  }>;
}

interface StackOverflowTags {
  items: Array<{
    tag_name: string;
    answer_count: number;
    answer_score: number;
  }>;
}

export async function fetchStackOverflowPublicProfile(
  userId: string
): Promise<PublicDataResult> {
  const cleanUserId = userId.replace(/[^0-9]/g, '').trim();

  if (!cleanUserId) {
    throw new Error('Enter a Stack Overflow user ID (numeric).');
  }

  const [userResponse, tagsResponse] = await Promise.all([
    fetch(`https://api.stackexchange.com/2.3/users/${cleanUserId}?site=stackoverflow&filter=default`),
    fetch(`https://api.stackexchange.com/2.3/users/${cleanUserId}/top-answer-tags?site=stackoverflow&pagesize=10`),
  ]);

  if (!userResponse.ok) {
    if (userResponse.status === 404 || userResponse.status === 400) {
      throw new Error('Stack Overflow user not found.');
    }
    throw new Error(`Stack Overflow request failed with status ${userResponse.status}.`);
  }

  const userData: StackOverflowUser = await userResponse.json();
  const user = userData.items[0];

  if (!user) {
    throw new Error('Stack Overflow user not found.');
  }

  let tags: StackOverflowTags = { items: [] };
  if (tagsResponse.ok) {
    tags = await tagsResponse.json();
  }

  const profile: PublicProfile = {
    platform: 'stackoverflow',
    username: cleanUserId,
    displayName: user.display_name,
    avatarUrl: user.profile_image ?? null,
    profileUrl: user.link ?? `https://stackoverflow.com/users/${cleanUserId}`,
    bio: null,
    location: user.location ?? null,
    joinedAt: user.creation_date ? new Date(user.creation_date * 1000).toISOString() : null,
  };

  const activity: PublicActivity[] = tags.items.map((tag) => ({
    id: tag.tag_name,
    title: `Top tag: ${tag.tag_name}`,
    description: `${tag.answer_count} answers, ${tag.answer_score} score`,
    timestamp: new Date().toISOString(),
    url: `https://stackoverflow.com/users/${cleanUserId}/${profile.displayName}?tab=profile`,
    type: 'tag',
  }));

  return {
    platform: 'stackoverflow',
    profile,
    metrics: [
      {
        label: 'Reputation',
        value: user.reputation,
      },
      {
        label: 'Gold badges',
        value: user.badge_counts.gold,
      },
      {
        label: 'Silver badges',
        value: user.badge_counts.silver,
      },
      {
        label: 'Bronze badges',
        value: user.badge_counts.bronze,
      },
      {
        label: 'Answers',
        value: user.answer_count ?? 0,
      },
      {
        label: 'Questions',
        value: user.question_count ?? 0,
      },
      {
        label: 'Profile views',
        value: user.view_count ?? 0,
      },
      {
        label: 'Up votes',
        value: user.up_vote_count ?? 0,
      },
      {
        label: 'Down votes',
        value: user.down_vote_count ?? 0,
      },
    ],
    activity,
    fetchedAt: new Date().toISOString(),
    source: 'public-api',
  };
}
