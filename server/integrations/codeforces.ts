interface CodeforcesResponse<T> {
  status: 'OK' | 'FAILED';
  comment?: string;
  result: T;
}

interface CodeforcesUser {
  handle: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  avatar?: string;
  titlePhoto?: string;
  contribution: number;
  registrationTimeSeconds: number;
}

async function request<T>(
  endpoint: string
): Promise<T> {
  const response = await fetch(
    `https://codeforces.com/api/${endpoint}`
  );

  if (!response.ok) {
    throw new Error(
      `Codeforces request failed: ${response.status}`
    );
  }

  const data =
    (await response.json()) as CodeforcesResponse<T>;

  if (data.status !== 'OK') {
    throw new Error(
      data.comment ??
        'Codeforces API request failed.'
    );
  }

  return data.result;
}

export async function getCodeforcesUser(
  handle: string
): Promise<CodeforcesUser> {
  const cleanHandle = handle.trim();

  if (!cleanHandle) {
    throw new Error(
      'Codeforces handle is required.'
    );
  }

  const users = await request<CodeforcesUser[]>(
    `user.info?handles=${encodeURIComponent(
      cleanHandle
    )}`
  );

  if (!users.length) {
    throw new Error(
      'Codeforces user was not found.'
    );
  }

  return users[0];
}