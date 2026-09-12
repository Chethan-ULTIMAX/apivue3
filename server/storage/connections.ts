import { supabaseAdmin } from '../supabase';

export interface GitHubConnection {
  provider: 'github';
  providerUserId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  accessToken: string;
  connectedAt: string;
}

export interface ServerGitHubConnection extends GitHubConnection {
  userId: string;
}

export interface CodeforcesConnection {
  provider: 'codeforces';
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  connectedAt: string;
}

export interface ServerCodeforcesConnection extends CodeforcesConnection {
  userId: string;
}

export interface LeetCodeConnection {
  provider: 'leetcode';
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  connectedAt: string;
}

export interface ServerLeetCodeConnection extends LeetCodeConnection {
  userId: string;
}

export interface CodewarsConnection {
  provider: 'codewars';
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  connectedAt: string;
}

export interface ServerCodewarsConnection extends CodewarsConnection {
  userId: string;
}

export interface StackOverflowConnection {
  provider: 'stackoverflow';
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  connectedAt: string;
}

export interface ServerStackOverflowConnection extends StackOverflowConnection {
  userId: string;
}

async function getConnectionFromDb(userId: string, provider: string) {
  const { data, error } = await supabaseAdmin
    .from('connected_accounts')
    .select('username, display_name, avatar_url, profile_url, connected_at, last_synced_at, metadata')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function saveGitHubConnection(
  sessionId: string,
  connection: ServerGitHubConnection
) {
  await supabaseAdmin
    .from('connected_accounts')
    .upsert({
      user_id: connection.userId,
      provider: 'github',
      provider_user_id: String(connection.providerUserId),
      username: connection.username,
      display_name: connection.displayName,
      avatar_url: connection.avatarUrl,
      profile_url: connection.profileUrl,
      metadata: { access: 'oauth', scope: 'read:user', access_token: connection.accessToken },
      connected_at: connection.connectedAt,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });
}

export async function getGitHubConnection(
  sessionId: string,
  userId: string
): Promise<ServerGitHubConnection | null> {
  const data = await getConnectionFromDb(userId, 'github');
  if (!data) return null;
  return {
    provider: 'github',
    providerUserId: Number(data.provider_user_id),
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    profileUrl: data.profile_url,
    accessToken: data.metadata?.access_token ?? '',
    connectedAt: data.connected_at,
    userId,
  };
}

export async function deleteGitHubConnection(
  sessionId: string,
  userId: string
) {
  await supabaseAdmin
    .from('connected_accounts')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'github');
}

export async function saveCodeforcesConnection(
  sessionId: string,
  connection: ServerCodeforcesConnection
) {
  await supabaseAdmin
    .from('connected_accounts')
    .upsert({
      user_id: connection.userId,
      provider: 'codeforces',
      provider_user_id: connection.handle,
      username: connection.handle,
      display_name: connection.displayName,
      avatar_url: connection.avatarUrl,
      profile_url: connection.profileUrl,
      metadata: { access: 'public' },
      connected_at: connection.connectedAt,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });
}

export async function getCodeforcesConnection(
  sessionId: string,
  userId: string
): Promise<ServerCodeforcesConnection | null> {
  const data = await getConnectionFromDb(userId, 'codeforces');
  if (!data) return null;
  return {
    provider: 'codeforces',
    handle: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    profileUrl: data.profile_url,
    connectedAt: data.connected_at,
    userId,
  };
}

export async function deleteCodeforcesConnection(
  sessionId: string,
  userId: string
) {
  await supabaseAdmin
    .from('connected_accounts')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'codeforces');
}

export async function saveLeetCodeConnection(
  sessionId: string,
  connection: ServerLeetCodeConnection
) {
  await supabaseAdmin
    .from('connected_accounts')
    .upsert({
      user_id: connection.userId,
      provider: 'leetcode',
      provider_user_id: connection.handle,
      username: connection.handle,
      display_name: connection.displayName,
      avatar_url: connection.avatarUrl,
      profile_url: connection.profileUrl,
      metadata: { access: 'public' },
      connected_at: connection.connectedAt,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });
}

export async function getLeetCodeConnection(
  sessionId: string,
  userId: string
): Promise<ServerLeetCodeConnection | null> {
  const data = await getConnectionFromDb(userId, 'leetcode');
  if (!data) return null;
  return {
    provider: 'leetcode',
    handle: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    profileUrl: data.profile_url,
    connectedAt: data.connected_at,
    userId,
  };
}

export async function deleteLeetCodeConnection(
  sessionId: string,
  userId: string
) {
  await supabaseAdmin
    .from('connected_accounts')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'leetcode');
}

export async function saveCodewarsConnection(
  sessionId: string,
  connection: ServerCodewarsConnection
) {
  await supabaseAdmin
    .from('connected_accounts')
    .upsert({
      user_id: connection.userId,
      provider: 'codewars',
      provider_user_id: connection.handle,
      username: connection.handle,
      display_name: connection.displayName,
      avatar_url: connection.avatarUrl,
      profile_url: connection.profileUrl,
      metadata: { access: 'public' },
      connected_at: connection.connectedAt,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });
}

export async function getCodewarsConnection(
  sessionId: string,
  userId: string
): Promise<ServerCodewarsConnection | null> {
  const data = await getConnectionFromDb(userId, 'codewars');
  if (!data) return null;
  return {
    provider: 'codewars',
    handle: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    profileUrl: data.profile_url,
    connectedAt: data.connected_at,
    userId,
  };
}

export async function deleteCodewarsConnection(
  sessionId: string,
  userId: string
) {
  await supabaseAdmin
    .from('connected_accounts')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'codewars');
}

export async function saveStackOverflowConnection(
  sessionId: string,
  connection: ServerStackOverflowConnection
) {
  await supabaseAdmin
    .from('connected_accounts')
    .upsert({
      user_id: connection.userId,
      provider: 'stackoverflow',
      provider_user_id: connection.handle,
      username: connection.handle,
      display_name: connection.displayName,
      avatar_url: connection.avatarUrl,
      profile_url: connection.profileUrl,
      metadata: { access: 'public' },
      connected_at: connection.connectedAt,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id,provider' });
}

export async function getStackOverflowConnection(
  sessionId: string,
  userId: string
): Promise<ServerStackOverflowConnection | null> {
  const data = await getConnectionFromDb(userId, 'stackoverflow');
  if (!data) return null;
  return {
    provider: 'stackoverflow',
    handle: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    profileUrl: data.profile_url,
    connectedAt: data.connected_at,
    userId,
  };
}

export async function deleteStackOverflowConnection(
  sessionId: string,
  userId: string
) {
  await supabaseAdmin
    .from('connected_accounts')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'stackoverflow');
}