import crypto from 'node:crypto';
import { env } from '../env';

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  private_repos?: number;
  total_private_repos?: number;
}

interface GitHubTokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

const pendingStates = new Map<
  string,
  {
    sessionId: string;
    userId: string;
    codeVerifier: string;
    createdAt: number;
  }
>();

function base64Url(buffer: Buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function createPkceVerifier() {
  return base64Url(crypto.randomBytes(32));
}

async function createPkceChallenge(
  verifier: string
) {
  const digest = crypto
    .createHash('sha256')
    .update(verifier)
    .digest();

  return base64Url(digest);
}

export async function createGitHubAuthorizationUrl(
  sessionId: string,
  userId: string
) {
  const state = base64Url(
    crypto.randomBytes(32)
  );

  const codeVerifier = createPkceVerifier();
  const codeChallenge =
    await createPkceChallenge(codeVerifier);

  pendingStates.set(state, {
    sessionId,
    userId,
    codeVerifier,
    createdAt: Date.now(),
  });

  const params = new URLSearchParams({
    client_id: env.githubClientId,
    redirect_uri: env.githubCallbackUrl,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',

    // Keep permissions minimal for now.
    scope: 'read:user',
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export function consumeGitHubState(
  state: string,
  sessionId: string
) {
  const pending = pendingStates.get(state);

  if (!pending) {
    return null;
  }

  pendingStates.delete(state);

  // State expires after 10 minutes.
  if (
    Date.now() - pending.createdAt >
    10 * 60 * 1000
  ) {
    return null;
  }

  if (pending.sessionId !== sessionId) {
    return null;
  }

  return pending;
}

export async function exchangeGitHubCode(
  code: string,
  codeVerifier: string
) {
  const response = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',

      headers: {
        Accept: 'application/json',
        'Content-Type':
          'application/x-www-form-urlencoded',
      },

      body: new URLSearchParams({
        client_id: env.githubClientId,
        client_secret: env.githubClientSecret,
        code,
        redirect_uri: env.githubCallbackUrl,
        code_verifier: codeVerifier,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub token exchange failed: ${response.status}`
    );
  }

  const data =
    (await response.json()) as GitHubTokenResponse;

  if (!data.access_token) {
    throw new Error(
      data.error_description ??
        data.error ??
        'GitHub did not return an access token.'
    );
  }

  return data.access_token;
}

export async function getGitHubUser(
  accessToken: string
): Promise<GitHubUser> {
  const response = await fetch(
    'https://api.github.com/user',
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub user request failed: ${response.status}`
    );
  }

  return response.json() as Promise<GitHubUser>;
}