/**
 * Browser integration client.
 *
 * GitHub Pages is a static host. Username-based integrations therefore use
 * the authenticated Supabase `sync-profile` Edge Function instead of
 * requiring a separate Node service. If the optional Node backend exists,
 * GitHub OAuth can still be used when no username is supplied.
 */

import { supabase } from '@/integrations/supabase/client';
import type { IntegrationId, IntegrationStatus } from './types';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE = (configuredApiUrl || '').replace(/\/+$/, '');

type SyncProfile = {
  id?: string;
  platform: string;
  handle: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  profileUrl?: string | null;
  lastSyncedAt?: string;
  last_synced_at?: string;
};

async function backendRequest<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error('The optional APIVue Node backend is not configured.');
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string> | undefined) ?? {}),
  };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, credentials: 'include', headers });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const body = await response.json() as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch { /* keep default */ }
    throw new Error(message);
  }
  return response.status === 204 ? undefined as T : await response.json() as T;
}

async function syncPublicProfile(platform: IntegrationId, handle: string): Promise<SyncProfile> {
  const clean = handle.trim().replace(/^@/, '');
  if (!clean) throw new Error('A username or platform handle is required.');

  const { data, error } = await supabase.functions.invoke('sync-profile', {
    body: { platform, handle: clean, save: true },
  });
  if (error) {
    let message = error.message;
    const context = (error as { context?: { json?: () => Promise<unknown> } }).context;
    if (context?.json) {
      try {
        const body = await context.json() as { error?: string };
        if (body?.error) message = body.error;
      } catch { /* keep default */ }
    }
    throw new Error(message);
  }
  const payload = data as { error?: string; profile?: SyncProfile };
  if (payload.error) throw new Error(payload.error);
  if (!payload.profile) throw new Error('The provider returned no profile data.');
  return payload.profile;
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  if (API_BASE) {
    try { return await backendRequest<IntegrationStatus>('/api/integrations'); }
    catch { /* serverless fallback below */ }
  }

  const { data, error } = await supabase
    .from('tracked_profiles')
    .select('platform,handle,display_name,avatar_url,profile_url,last_synced_at')
    .order('last_synced_at', { ascending: false });
  if (error) throw new Error(error.message);

  const status: IntegrationStatus = {
    github: { connected: false },
    codeforces: { connected: false },
    leetcode: { connected: false },
    codewars: { connected: false },
    stackoverflow: { connected: false },
  };
  for (const row of data ?? []) {
    const id = row.platform as IntegrationId;
    if (!(id in status) || status[id].connected) continue;
    status[id] = {
      connected: true,
      username: row.handle,
      handle: row.handle,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      profileUrl: row.profile_url ?? undefined,
      lastSyncedAt: row.last_synced_at ?? undefined,
    };
  }
  return status;
}

export async function connectGitHub(handle = ''): Promise<void> {
  if (!handle.trim() && API_BASE) {
    const { url } = await backendRequest<{ url: string }>('/api/integrations/github/connect');
    window.location.href = url;
    return;
  }
  await syncPublicProfile('github', handle);
}

async function disconnectPublicProfile(provider: IntegrationId): Promise<void> {
  const { data, error } = await supabase.from('tracked_profiles').select('id').eq('platform', provider).limit(1);
  if (error) throw new Error(error.message);
  const id = data?.[0]?.id;
  if (!id) return;
  const { error: deleteError } = await supabase.from('tracked_profiles').delete().eq('id', id);
  if (deleteError) throw new Error(deleteError.message);
}

export async function disconnectGitHub(): Promise<void> { await disconnectPublicProfile('github'); }

export async function syncGitHub(): Promise<{ syncedAt: string; username: string }> {
  const status = await getIntegrationStatus();
  const handle = status.github.username ?? status.github.handle;
  if (!handle) throw new Error('GitHub is not connected.');
  const profile = await syncPublicProfile('github', handle);
  return { syncedAt: profile.lastSyncedAt ?? profile.last_synced_at ?? new Date().toISOString(), username: profile.handle };
}

export async function syncIntegration(provider: Exclude<IntegrationId, 'github'>): Promise<{ syncedAt: string; handle: string; provider: string }> {
  const status = await getIntegrationStatus();
  const handle = status[provider].username ?? status[provider].handle;
  if (!handle) throw new Error(`${provider} is not connected.`);
  const profile = await syncPublicProfile(provider, handle);
  return { syncedAt: profile.lastSyncedAt ?? profile.last_synced_at ?? new Date().toISOString(), handle: profile.handle, provider };
}

export async function connectCodeforces(handle: string): Promise<void> { await syncPublicProfile('codeforces', handle); }
export async function disconnectCodeforces(): Promise<void> { await disconnectPublicProfile('codeforces'); }
export async function connectLeetCode(handle: string): Promise<void> { await syncPublicProfile('leetcode', handle); }
export async function disconnectLeetCode(): Promise<void> { await disconnectPublicProfile('leetcode'); }
export async function connectCodewars(handle: string): Promise<void> { await syncPublicProfile('codewars', handle); }
export async function disconnectCodewars(): Promise<void> { await disconnectPublicProfile('codewars'); }
export async function connectStackOverflow(userId: string): Promise<void> { await syncPublicProfile('stackoverflow', userId); }
export async function disconnectStackOverflow(): Promise<void> { await disconnectPublicProfile('stackoverflow'); }
