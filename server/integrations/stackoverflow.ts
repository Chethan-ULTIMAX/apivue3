import { env } from '../env';

interface StackOverflowUser {
  items: Array<{
    user_id: number;
    user_type: string;
    creation_date: number;
    display_name: string;
    profile_image?: string;
    link?: string;
    location?: string;
    reputation: number;
    reputation_change_year?: number;
    reputation_change_quarter?: number;
    reputation_change_month?: number;
    reputation_change_week?: number;
    reputation_change_day?: number;
    last_access_date?: number;
    last_modified_date?: number;
    is_employee?: boolean;
    website_url?: string;
    badges: {
      gold: number;
      silver: number;
      bronze: number;
    };
    answer_count?: number;
    question_count?: number;
    down_vote_count?: number;
    up_vote_count?: number;
    view_count?: number;
  }>;
}

interface StackOverflowTags {
  items: Array<{
    tag_name: string;
    answer_count: number;
    answer_score: number;
  }>;
}

async function getStackOverflowUser(userId: string): Promise<StackOverflowUser> {
  const response = await fetch(
    `https://api.stackexchange.com/2.3/users/${userId}?site=stackoverflow&filter=default`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Stack Overflow user "${userId}" not found`);
    }
    throw new Error(`Stack Overflow request failed with status ${response.status}`);
  }

  return response.json();
}

async function getStackOverflowUserTags(userId: string): Promise<StackOverflowTags> {
  const response = await fetch(
    `https://api.stackexchange.com/2.3/users/${userId}/top-answer-tags?site=stackoverflow&pagesize=10`
  );

  if (!response.ok) {
    return { items: [] };
  }

  return response.json();
}

export async function getStackOverflowUserProfile(handle: string) {
  const userId = handle.replace(/[^0-9]/g, '');

  if (!userId) {
    throw new Error('Stack Overflow needs a numeric user id, e.g. 22656');
  }

  const [userResponse, tagsResponse] = await Promise.all([
    getStackOverflowUser(userId),
    getStackOverflowUserTags(userId),
  ]);

  const user = userResponse.items[0];

  if (!user) {
    throw new Error(`Stack Overflow user "${handle}" not found`);
  }

  const tags = tagsResponse.items ?? [];

  return {
    platform: 'stackoverflow',
    handle: userId,
    displayName: user.display_name,
    avatarUrl: user.profile_image ?? null,
    profileUrl: user.link ?? `https://stackoverflow.com/users/${userId}`,
    bio: null,
    location: user.location ?? null,
    joinedAt: user.creation_date ? new Date(user.creation_date * 1000).toISOString() : null,
    metrics: [
      { key: 'reputation', label: 'Reputation', value: user.reputation ?? 0, format: 'number' },
      { key: 'gold', label: 'Gold badges', value: user.badge_counts?.gold ?? 0, format: 'number' },
      { key: 'silver', label: 'Silver badges', value: user.badge_counts?.silver ?? 0, format: 'number' },
      { key: 'bronze', label: 'Bronze badges', value: user.badge_counts?.bronze ?? 0, format: 'number' },
      { key: 'answers', label: 'Answers', value: user.answer_count ?? 0, format: 'number' },
      { key: 'questions', label: 'Questions', value: user.question_count ?? 0, format: 'number' },
      { key: 'views', label: 'Profile views', value: user.view_count ?? 0, format: 'number' },
      { key: 'upvotes', label: 'Up votes', value: user.up_vote_count ?? 0, format: 'number' },
      { key: 'downvotes', label: 'Down votes', value: user.down_vote_count ?? 0, format: 'number' },
    ],
    breakdowns: [
      {
        key: 'topics',
        label: 'Top answer tags',
        unit: 'score',
        items: tags.map((t: any) => ({ name: t.tag_name, value: t.answer_score ?? 0 })),
      },
    ],
    ratingHistory: [],
    activity: [],
    highlights: [],
    fetchedAt: new Date().toISOString(),
  };
}
