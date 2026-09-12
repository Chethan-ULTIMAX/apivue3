import { supabaseAdmin } from '../supabase';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface GitHubConnection {
  provider: 'github';
  providerUserId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  accessToken: string;
  connectedAt: string;
  lastSyncedAt?: string | null;
}

export interface ServerGitHubConnection
  extends GitHubConnection {
  userId: string;
}

export interface CodeforcesConnection {
  provider: 'codeforces';
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  connectedAt: string;
  lastSyncedAt?: string | null;
}

export interface ServerCodeforcesConnection
  extends CodeforcesConnection {
  userId: string;
}

export interface LeetCodeConnection {
  provider: 'leetcode';
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  connectedAt: string;
  lastSyncedAt?: string | null;
}

export interface ServerLeetCodeConnection
  extends LeetCodeConnection {
  userId: string;
}

export interface CodewarsConnection {
  provider: 'codewars';
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  connectedAt: string;
  lastSyncedAt?: string | null;
}

export interface ServerCodewarsConnection
  extends CodewarsConnection {
  userId: string;
}

export interface StackOverflowConnection {
  provider: 'stackoverflow';
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  connectedAt: string;
  lastSyncedAt?: string | null;
}

export interface ServerStackOverflowConnection
  extends StackOverflowConnection {
  userId: string;
}

/* -------------------------------------------------------------------------- */
/* Server-only GitHub OAuth token storage                                     */
/* -------------------------------------------------------------------------- */

/**
 * GitHub OAuth access tokens are intentionally NOT stored in
 * the client-readable connected_accounts table.
 *
 * This is a development-only server-memory store.
 *
 * Production should replace this with encrypted server-side
 * persistent storage or a dedicated secret/token store.
 */
const githubAccessTokens = new Map<
  string,
  string
>();

/**
 * Store a GitHub access token only on the server.
 */
function setGitHubAccessToken(
  userId: string,
  accessToken: string
): void {
  githubAccessTokens.set(
    userId,
    accessToken
  );
}

/**
 * Retrieve a GitHub access token from server memory.
 */
function getGitHubAccessToken(
  userId: string
): string | null {
  return (
    githubAccessTokens.get(userId) ??
    null
  );
}

/**
 * Remove a GitHub access token from server memory.
 */
function deleteGitHubAccessToken(
  userId: string
): void {
  githubAccessTokens.delete(userId);
}

/* -------------------------------------------------------------------------- */
/* Database helpers                                                           */
/* -------------------------------------------------------------------------- */

interface ConnectionRow {
  provider: string;
  provider_user_id: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  profile_url: string | null;
  connected_at: string;
  last_synced_at: string | null;
  metadata:
    | Record<string, unknown>
    | null;
}

/**
 * Read a single connected account from Supabase.
 *
 * provider_user_id is deliberately included because GitHub
 * and other integrations need the provider's actual identity.
 */
async function getConnectionFromDb(
  userId: string,
  provider: string
): Promise<ConnectionRow | null> {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from('connected_accounts')
    .select(
      [
        'provider',
        'provider_user_id',
        'username',
        'display_name',
        'avatar_url',
        'profile_url',
        'connected_at',
        'last_synced_at',
        'metadata',
      ].join(', ')
    )
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();

  if (error) {
    console.error(
      `Failed to load ${provider} connection:`,
      error
    );

    return null;
  }

  if (!data) {
    return null;
  }

  return data as unknown as ConnectionRow;
}

/**
 * Delete a connection from the database.
 */
async function deleteConnectionFromDb(
  userId: string,
  provider: string
): Promise<void> {
  const {
    error,
  } = await supabaseAdmin
    .from('connected_accounts')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);

  if (error) {
    throw new Error(
      `Unable to delete ${provider} connection: ${error.message}`
    );
  }
}

/* -------------------------------------------------------------------------- */
/* GitHub                                                                     */
/* -------------------------------------------------------------------------- */

export async function saveGitHubConnection(
  _sessionId: string,
  connection: ServerGitHubConnection
): Promise<void> {
  /*
   * Keep the OAuth token outside Supabase.
   */
  setGitHubAccessToken(
    connection.userId,
    connection.accessToken
  );

  const {
    error,
  } = await supabaseAdmin
    .from('connected_accounts')
    .upsert(
      {
        user_id: connection.userId,
        provider: 'github',
        provider_user_id:
          String(connection.providerUserId),
        username: connection.username,
        display_name:
          connection.displayName,
        avatar_url:
          connection.avatarUrl,
        profile_url:
          connection.profileUrl,

        /*
         * Never put accessToken here.
         *
         * This metadata is safe, non-secret information.
         */
        metadata: {
          access: 'oauth',
          scope: 'read:user',
        },

        connected_at:
          connection.connectedAt,

        last_synced_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          'user_id,provider',
      }
    );

  if (error) {
    /*
     * Do not leave an OAuth token in memory if the
     * database connection could not be persisted.
     */
    deleteGitHubAccessToken(
      connection.userId
    );

    throw new Error(
      `Unable to save GitHub connection: ${error.message}`
    );
  }
}

export async function getGitHubConnection(
  _sessionId: string,
  userId: string
): Promise<ServerGitHubConnection | null> {
  const data =
    await getConnectionFromDb(
      userId,
      'github'
    );

  if (!data) {
    return null;
  }

  const providerUserId =
    Number(data.provider_user_id);

  if (
    !Number.isFinite(providerUserId)
  ) {
    console.error(
      'Invalid GitHub provider user ID.'
    );

    return null;
  }

  const accessToken =
    getGitHubAccessToken(userId);

  return {
    provider: 'github',
    providerUserId,
    username: data.username ?? '',
    displayName:
      data.display_name ?? null,
    avatarUrl:
      data.avatar_url ?? null,
    profileUrl:
      data.profile_url ?? '',
    accessToken:
      accessToken ?? '',
    connectedAt:
      data.connected_at,
    lastSyncedAt:
      data.last_synced_at ?? null,
    userId,
  };
}

export async function deleteGitHubConnection(
  _sessionId: string,
  userId: string
): Promise<void> {
  /*
   * Remove the server-only OAuth token first.
   */
  deleteGitHubAccessToken(userId);

  await deleteConnectionFromDb(
    userId,
    'github'
  );
}

/* -------------------------------------------------------------------------- */
/* Codeforces                                                                 */
/* -------------------------------------------------------------------------- */

export async function saveCodeforcesConnection(
  _sessionId: string,
  connection: ServerCodeforcesConnection
): Promise<void> {
  const {
    error,
  } = await supabaseAdmin
    .from('connected_accounts')
    .upsert(
      {
        user_id: connection.userId,
        provider: 'codeforces',
        provider_user_id:
          connection.handle,
        username:
          connection.handle,
        display_name:
          connection.displayName,
        avatar_url:
          connection.avatarUrl,
        profile_url:
          connection.profileUrl,
        metadata: {
          access: 'public',
        },
        connected_at:
          connection.connectedAt,
        last_synced_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          'user_id,provider',
      }
    );

  if (error) {
    throw new Error(
      `Unable to save Codeforces connection: ${error.message}`
    );
  }
}

export async function getCodeforcesConnection(
  _sessionId: string,
  userId: string
): Promise<ServerCodeforcesConnection | null> {
  const data =
    await getConnectionFromDb(
      userId,
      'codeforces'
    );

  if (!data) {
    return null;
  }

  return {
    provider: 'codeforces',
    handle:
      data.username ?? '',
    displayName:
      data.display_name ?? null,
    avatarUrl:
      data.avatar_url ?? null,
    profileUrl:
      data.profile_url ?? '',
    connectedAt:
      data.connected_at,
    lastSyncedAt:
      data.last_synced_at ?? null,
    userId,
  };
}

export async function deleteCodeforcesConnection(
  _sessionId: string,
  userId: string
): Promise<void> {
  await deleteConnectionFromDb(
    userId,
    'codeforces'
  );
}

/* -------------------------------------------------------------------------- */
/* LeetCode                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveLeetCodeConnection(
  _sessionId: string,
  connection: ServerLeetCodeConnection
): Promise<void> {
  const {
    error,
  } = await supabaseAdmin
    .from('connected_accounts')
    .upsert(
      {
        user_id: connection.userId,
        provider: 'leetcode',
        provider_user_id:
          connection.handle,
        username:
          connection.handle,
        display_name:
          connection.displayName,
        avatar_url:
          connection.avatarUrl,
        profile_url:
          connection.profileUrl,
        metadata: {
          access: 'public',
        },
        connected_at:
          connection.connectedAt,
        last_synced_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          'user_id,provider',
      }
    );

  if (error) {
    throw new Error(
      `Unable to save LeetCode connection: ${error.message}`
    );
  }
}

export async function getLeetCodeConnection(
  _sessionId: string,
  userId: string
): Promise<ServerLeetCodeConnection | null> {
  const data =
    await getConnectionFromDb(
      userId,
      'leetcode'
    );

  if (!data) {
    return null;
  }

  return {
    provider: 'leetcode',
    handle:
      data.username ?? '',
    displayName:
      data.display_name ?? null,
    avatarUrl:
      data.avatar_url ?? null,
    profileUrl:
      data.profile_url ?? '',
    connectedAt:
      data.connected_at,
    lastSyncedAt:
      data.last_synced_at ?? null,
    userId,
  };
}

export async function deleteLeetCodeConnection(
  _sessionId: string,
  userId: string
): Promise<void> {
  await deleteConnectionFromDb(
    userId,
    'leetcode'
  );
}

/* -------------------------------------------------------------------------- */
/* Codewars                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveCodewarsConnection(
  _sessionId: string,
  connection: ServerCodewarsConnection
): Promise<void> {
  const {
    error,
  } = await supabaseAdmin
    .from('connected_accounts')
    .upsert(
      {
        user_id: connection.userId,
        provider: 'codewars',
        provider_user_id:
          connection.handle,
        username:
          connection.handle,
        display_name:
          connection.displayName,
        avatar_url:
          connection.avatarUrl,
        profile_url:
          connection.profileUrl,
        metadata: {
          access: 'public',
        },
        connected_at:
          connection.connectedAt,
        last_synced_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          'user_id,provider',
      }
    );

  if (error) {
    throw new Error(
      `Unable to save Codewars connection: ${error.message}`
    );
  }
}

export async function getCodewarsConnection(
  _sessionId: string,
  userId: string
): Promise<ServerCodewarsConnection | null> {
  const data =
    await getConnectionFromDb(
      userId,
      'codewars'
    );

  if (!data) {
    return null;
  }

  return {
    provider: 'codewars',
    handle:
      data.username ?? '',
    displayName:
      data.display_name ?? null,
    avatarUrl:
      data.avatar_url ?? null,
    profileUrl:
      data.profile_url ?? '',
    connectedAt:
      data.connected_at,
    lastSyncedAt:
      data.last_synced_at ?? null,
    userId,
  };
}

export async function deleteCodewarsConnection(
  _sessionId: string,
  userId: string
): Promise<void> {
  await deleteConnectionFromDb(
    userId,
    'codewars'
  );
}

/* -------------------------------------------------------------------------- */
/* Stack Overflow                                                             */
/* -------------------------------------------------------------------------- */

export async function saveStackOverflowConnection(
  _sessionId: string,
  connection: ServerStackOverflowConnection
): Promise<void> {
  const {
    error,
  } = await supabaseAdmin
    .from('connected_accounts')
    .upsert(
      {
        user_id: connection.userId,
        provider: 'stackoverflow',
        provider_user_id:
          connection.handle,
        username:
          connection.handle,
        display_name:
          connection.displayName,
        avatar_url:
          connection.avatarUrl,
        profile_url:
          connection.profileUrl,
        metadata: {
          access: 'public',
        },
        connected_at:
          connection.connectedAt,
        last_synced_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          'user_id,provider',
      }
    );

  if (error) {
    throw new Error(
      `Unable to save Stack Overflow connection: ${error.message}`
    );
  }
}

export async function getStackOverflowConnection(
  _sessionId: string,
  userId: string
): Promise<ServerStackOverflowConnection | null> {
  const data =
    await getConnectionFromDb(
      userId,
      'stackoverflow'
    );

  if (!data) {
    return null;
  }

  return {
    provider: 'stackoverflow',
    handle:
      data.username ?? '',
    displayName:
      data.display_name ?? null,
    avatarUrl:
      data.avatar_url ?? null,
    profileUrl:
      data.profile_url ?? '',
    connectedAt:
      data.connected_at,
    lastSyncedAt:
      data.last_synced_at ?? null,
    userId,
  };
}

export async function deleteStackOverflowConnection(
  _sessionId: string,
  userId: string
): Promise<void> {
  await deleteConnectionFromDb(
    userId,
    'stackoverflow'
  );
}