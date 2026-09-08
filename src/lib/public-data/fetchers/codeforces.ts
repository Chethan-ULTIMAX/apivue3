import type {
  PublicActivity,
  PublicDataResult,
  PublicProfile,
} from '../types';

const CODEFORCES_API = 'https://codeforces.com/api';

interface CodeforcesUser {
  handle: string;
  email?: string;
  vkId?: string;
  openId?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank?: string;
  rating?: number;
  maxRank?: string;
  maxRating?: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar?: string;
  titlePhoto?: string;
}

interface CodeforcesRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

interface CodeforcesSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: {
    contestId?: number;
    index: string;
    name: string;
    type: string;
    points?: number;
    rating?: number;
    tags?: string[];
  };
  verdict?: string;
  programmingLanguage?: string;
}

interface CodeforcesResponse<T> {
  status: 'OK' | 'FAILED';
  comment?: string;
  result: T;
}

async function codeforcesRequest<T>(
  endpoint: string
): Promise<T> {
  const response = await fetch(`${CODEFORCES_API}${endpoint}`);

  if (!response.ok) {
    throw new Error(
      `Codeforces request failed with status ${response.status}.`
    );
  }

  const data = (await response.json()) as CodeforcesResponse<T>;

  if (data.status !== 'OK') {
    throw new Error(
      data.comment || 'Codeforces request failed.'
    );
  }

  return data.result;
}

export async function fetchCodeforcesPublicProfile(
  username: string
): Promise<PublicDataResult> {
  const handle = username.trim();

  if (!handle) {
    throw new Error('Enter a Codeforces handle.');
  }

  const encodedHandle = encodeURIComponent(handle);

  const [users, ratings, submissions] = await Promise.all([
    codeforcesRequest<CodeforcesUser[]>(
      `/user.info?handles=${encodedHandle}`
    ),
    codeforcesRequest<CodeforcesRatingChange[]>(
      `/user.rating?handle=${encodedHandle}`
    ),
    codeforcesRequest<CodeforcesSubmission[]>(
      `/user.status?handle=${encodedHandle}&from=1&count=20`
    ),
  ]);

  const user = users[0];

  if (!user) {
    throw new Error('Codeforces user not found.');
  }

  const profile: PublicProfile = {
    platform: 'codeforces',
    username: user.handle,
    displayName:
      [user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ') || null,
    avatarUrl: user.avatar ?? null,
    profileUrl: `https://codeforces.com/profile/${encodeURIComponent(
      user.handle
    )}`,
    bio: user.organization ?? null,
    location:
      [user.city, user.country]
        .filter(Boolean)
        .join(', ') || null,
    joinedAt: new Date(
      user.registrationTimeSeconds * 1000
    ).toISOString(),
  };

  const activity: PublicActivity[] = submissions.map(
    (submission) => ({
      id: String(submission.id),
      title: submission.problem.name,
      description: [
        submission.problem.rating
          ? `${submission.problem.rating} rated`
          : null,
        submission.verdict
          ? submission.verdict
          : null,
        submission.programmingLanguage
          ? submission.programmingLanguage
          : null,
      ]
        .filter(Boolean)
        .join(' · '),
      timestamp: new Date(
        submission.creationTimeSeconds * 1000
      ).toISOString(),
      url: submission.contestId
        ? `https://codeforces.com/contest/${submission.contestId}/problem/${submission.problem.index}`
        : profile.profileUrl,
      type: 'submission',
    })
  );

  const acceptedSubmissions = submissions.filter(
    (submission) => submission.verdict === 'OK'
  );

  return {
    platform: 'codeforces',
    profile,
    metrics: [
      {
        label: 'Current rating',
        value: user.rating ?? 'Unrated',
      },
      {
        label: 'Max rating',
        value: user.maxRating ?? '—',
      },
      {
        label: 'Current rank',
        value: user.rank ?? 'Unrated',
      },
      {
        label: 'Accepted recently',
        value: acceptedSubmissions.length,
      },
      {
        label: 'Rated contests',
        value: ratings.length,
      },
      {
        label: 'Contribution',
        value: user.contribution,
      },
    ],
    activity,
    fetchedAt: new Date().toISOString(),
    source: 'public-api',
  };
}