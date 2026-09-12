/**
 * LeetCode public profile fetcher.
 *
 * Uses LeetCode's public GraphQL endpoint. Response shapes are typed
 * against the fields we request in the query.
 */

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

/* ============================================================
 * Raw types
 * ============================================================ */

export interface RawLeetCodeDifficultyCount {
  difficulty: string;
  count: number;
  submissions?: number;
}

export interface RawLeetCodeLanguageCount {
  languageName: string;
  problemsSolved: number;
}

export interface RawLeetCodeBadge {
  displayName: string;
}

export interface RawLeetCodeMatchedUser {
  username: string;
  profile: {
    realName: string | null;
    userAvatar: string | null;
    ranking: number | null;
    aboutMe: string | null;
    countryName: string | null;
    reputation: number;
  };
  submitStatsGlobal: {
    acSubmissionNum: RawLeetCodeDifficultyCount[];
  };
  languageProblemCount: RawLeetCodeLanguageCount[];
  submissionCalendar: string | null;
  badges: RawLeetCodeBadge[] | null;
}

export interface RawLeetCodeContestRanking {
  attendedContestsCount: number;
  rating: number;
  globalRanking: number;
  topPercentage: number;
}

export interface RawLeetCodeData {
  matchedUser: RawLeetCodeMatchedUser | null;
  userContestRanking: RawLeetCodeContestRanking | null;
  allQuestionsCount: RawLeetCodeDifficultyCount[];
}

/* ============================================================
 * Query
 * ============================================================ */

const LEETCODE_QUERY = `
query apivue($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      userAvatar
      ranking
      aboutMe
      countryName
      reputation
    }
    submitStatsGlobal {
      acSubmissionNum { difficulty count submissions }
    }
    languageProblemCount { languageName problemsSolved }
    submissionCalendar
    badges { displayName }
  }
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    topPercentage
  }
  allQuestionsCount { difficulty count }
}
`;

/* ============================================================
 * HTTP helper
 * ============================================================ */

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function leetcodeRequest<T>(variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(LEETCODE_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
    },
    body: JSON.stringify({ query: LEETCODE_QUERY, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `LeetCode request failed with status ${response.status}.`,
    );
  }

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((e) => e.message).join('; '));
  }

  if (!payload.data) {
    throw new Error('LeetCode returned an empty response.');
  }

  return payload.data;
}

/* ============================================================
 * Public API
 * ============================================================ */

export async function fetchLeetCodePublicProfile(
  username: string,
): Promise<RawLeetCodeData> {
  const cleanUsername = username.trim();

  if (!cleanUsername) {
    throw new Error('Enter a LeetCode username.');
  }

  const data = await leetcodeRequest<RawLeetCodeData>({
    username: cleanUsername,
  });

  if (!data.matchedUser) {
    throw new Error('LeetCode user not found.');
  }

  return data;
}