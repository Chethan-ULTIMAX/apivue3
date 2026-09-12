import { supabase } from '@/integrations/supabase/client';
import type { IntegrationId, IntegrationStatus } from './types';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE = (configuredApiUrl || '').replace(/\/+$/, '');
const STACKOVERFLOW_CLIENT_ID = '40519';
const STACKOVERFLOW_REDIRECT_URI = 'https://ehabrjqrfhgwdlmbcwho.supabase.co/functions/v1/stackoverflow-oauth-callback';
const STACKOVERFLOW_PKCE_KEY = 'apivue.stackoverflow.pkce.verifier';
const OWNERSHIP_CHALLENGE_KEY = 'apivue.ownership.challenge';

type SyncProfile = { id?: string; platform: string; handle: string; displayName?: string | null; avatarUrl?: string | null; profileUrl?: string | null; lastSyncedAt?: string; last_synced_at?: string };
type GitHubPrivateSync = { syncedAt: string; username: string; privateAccess: boolean; accessibleRepoCount: number; privateRepoCount: number };
export type OwnershipChallenge = { code: string; platform: 'leetcode' | 'codewars'; handle: string; expiresAt: string; instructions: string; verificationMode?: 'profile_summary' | 'webhook'; webhookUrl?: string; challengeId?: string };

async function backendRequest<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error('The optional APIVue Node backend is not configured.');
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...((options?.headers as Record<string, string> | undefined) ?? {}) };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, credentials: 'include', headers });
  if (!response.ok) { let message = `Request failed with status ${response.status}.`; try { const body = await response.json() as { error?: string; message?: string }; message = body.error ?? body.message ?? message; } catch { /* keep default */ } throw new Error(message); }
  return response.status === 204 ? undefined as T : await response.json() as T;
}

async function syncPublicProfile(platform: IntegrationId, handle: string): Promise<SyncProfile> {
  const clean = handle.trim().replace(/^@/, '');
  if (!clean) throw new Error('A username or platform handle is required.');
  const { data, error } = await supabase.functions.invoke('sync-profile', { body: { platform, handle: clean, save: true } });
  if (error) { let message = error.message; const context = (error as { context?: { json?: () => Promise<unknown> } }).context; if (context?.json) { try { const body = await context.json() as { error?: string }; if (body?.error) message = body.error; } catch { /* keep default */ } } throw new Error(message); }
  const payload = data as { error?: string; profile?: SyncProfile };
  if (payload.error) throw new Error(payload.error);
  if (!payload.profile) throw new Error('The provider returned no profile data.');
  return payload.profile;
}

export async function connectPublicProfile(platform: Exclude<IntegrationId, 'github' | 'codeforces' | 'stackoverflow'>, handle: string): Promise<SyncProfile> {
  return syncPublicProfile(platform, handle);
}

async function invokeOAuth(functionName: string, provider: string, body: Record<string, unknown> = {}): Promise<void> {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) { let message = error.message; const context = (error as { context?: { json?: () => Promise<unknown> } }).context; if (context?.json) { try { const responseBody = await context.json() as { error?: string }; if (responseBody?.error) message = responseBody.error; } catch { /* keep default */ } } throw new Error(message); }
  const payload = data as { error?: string; url?: string };
  if (payload.error) throw new Error(payload.error);
  if (!payload.url) throw new Error(`${provider} authorization URL was not returned.`);
  window.location.assign(payload.url);
}

async function startOwnershipVerification(platform: 'leetcode' | 'codewars', handle: string): Promise<OwnershipChallenge> {
  const clean = handle.trim().replace(/^@/, '');
  if (!clean) throw new Error('A username is required.');
  const { data, error } = await supabase.functions.invoke('start-profile-verification', { body: { platform, handle: clean } });
  if (error) throw new Error(error.message);
  const result = data as { error?: string; challengeId?: string } & Partial<OwnershipChallenge>;
  if (result.error) throw new Error(result.error);
  if (!result.code || !result.expiresAt || !result.instructions) throw new Error('The verification challenge was incomplete.');
  const challenge = { ...result, challengeId: result.challengeId } as OwnershipChallenge;
  sessionStorage.setItem(OWNERSHIP_CHALLENGE_KEY, JSON.stringify(challenge));
  return challenge;
}

export async function beginOwnershipVerification(platform: 'leetcode' | 'codewars', handle: string): Promise<void> {
  await startOwnershipVerification(platform, handle);
  window.location.assign(`${import.meta.env.BASE_URL}dashboard/integrations/verify/${platform}`);
}

export function getOwnershipChallenge(): OwnershipChallenge | null {
  try { const raw = sessionStorage.getItem(OWNERSHIP_CHALLENGE_KEY); return raw ? JSON.parse(raw) as OwnershipChallenge : null; } catch { return null; }
}
export function clearOwnershipChallenge(): void { sessionStorage.removeItem(OWNERSHIP_CHALLENGE_KEY); }

export async function verifyOwnership(platform: 'leetcode' | 'codewars', handle: string, code: string): Promise<void> {
  if (platform === 'codewars') {
    const challenge = getOwnershipChallenge();
    if (!challenge?.challengeId) throw new Error('The Codewars verification challenge is missing. Start verification again.');
    const { data, error } = await supabase.functions.invoke('check-profile-ownership', { body: { platform, handle, challengeId: challenge.challengeId } });
    if (error) throw new Error(error.message);
    const result = data as { error?: string; verified?: boolean; expired?: boolean };
    if (result.error) throw new Error(result.error);
    if (result.expired) throw new Error('The Codewars verification challenge expired. Generate a new one.');
    if (!result.verified) throw new Error('Codewars has not confirmed the webhook yet. Save the webhook in Codewars and try again.');
    clearOwnershipChallenge();
    return;
  }
  const { data, error } = await supabase.functions.invoke('verify-profile-ownership', { body: { platform, handle, code } });
  if (error) { let message = error.message; const context = (error as { context?: { json?: () => Promise<unknown> } }).context; if (context?.json) { try { const body = await context.json() as { error?: string }; if (body?.error) message = body.error; } catch { /* keep default */ } } throw new Error(message); }
  const result = data as { error?: string; verified?: boolean };
  if (result.error) throw new Error(result.error);
  if (!result.verified) throw new Error('Ownership verification did not complete.');
  clearOwnershipChallenge();
}

function base64Url(bytes: Uint8Array): string { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); }
function randomVerifier(length = 64): string { const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'; const bytes = new Uint8Array(length); crypto.getRandomValues(bytes); return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join(''); }
async function createPkceChallenge(verifier: string): Promise<string> { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)); return base64Url(new Uint8Array(digest)); }

export async function completeStackOverflowOAuth(code: string, state: string): Promise<void> {
  const verifier = sessionStorage.getItem(STACKOVERFLOW_PKCE_KEY);
  if (!verifier) throw new Error('Stack Overflow sign-in session is missing. Please start the connection again.');
  const form = new URLSearchParams({ client_id: STACKOVERFLOW_CLIENT_ID, redirect_uri: STACKOVERFLOW_REDIRECT_URI, code, code_verifier: verifier });
  const response = await fetch('https://stackoverflow.com/oauth/access_token/json', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: form.toString() });
  const text = await response.text();
  let payload: { access_token?: string; error?: { type?: string; message?: string }; error_message?: string } = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { /* handled below */ }
  if (!response.ok || !payload.access_token) { const providerMessage = payload.error?.message ?? payload.error_message; throw new Error(providerMessage ? `Stack Overflow OAuth failed: ${providerMessage}` : `Stack Overflow OAuth token exchange failed (${response.status}).`); }
  const { data, error } = await supabase.functions.invoke('stackoverflow-oauth-complete', { body: { state, access_token: payload.access_token } });
  sessionStorage.removeItem(STACKOVERFLOW_PKCE_KEY);
  if (error) { let message = error.message; const context = (error as { context?: { json?: () => Promise<unknown> } }).context; if (context?.json) { try { const body = await context.json() as { error?: string }; if (body?.error) message = body.error; } catch { /* keep default */ } } throw new Error(message); }
  const result = data as { error?: string };
  if (result.error) throw new Error(result.error);
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  if (API_BASE) { try { return await backendRequest<IntegrationStatus>('/api/integrations'); } catch { /* serverless fallback below */ } }
  const { data, error } = await supabase.from('tracked_profiles').select('platform,handle,display_name,avatar_url,profile_url,last_synced_at,data').order('last_synced_at', { ascending: false });
  if (error) throw new Error(error.message);
  const status: IntegrationStatus = { github: { connected: false }, codeforces: { connected: false }, leetcode: { connected: false }, codewars: { connected: false }, stackoverflow: { connected: false } };
  for (const row of data ?? []) { const id = row.platform as IntegrationId; if (!(id in status) || status[id].connected) continue; const payload = row.data as Record<string, unknown> | null; const privateAccess = payload?.privateAccess === true || payload?.private_access === true; const repoCount = typeof payload?.accessibleRepoCount === 'number' ? payload.accessibleRepoCount : typeof payload?.accessible_repo_count === 'number' ? payload.accessible_repo_count : undefined; const ownershipVerified = payload?.ownershipVerified === true || payload?.ownership_verified === true; status[id] = { connected: true, username: row.handle, handle: row.handle, displayName: row.display_name, avatarUrl: row.avatar_url, profileUrl: row.profile_url ?? undefined, lastSyncedAt: row.last_synced_at ?? undefined, privateAccess, accessibleRepoCount: repoCount, ownershipVerified, verificationMethod: typeof payload?.verificationMethod === 'string' ? payload.verificationMethod : undefined }; }
  return status;
}

export async function connectGitHub(): Promise<void> { await invokeOAuth('github-oauth-init', 'GitHub'); }
export async function connectCodeforces(_handle?: string): Promise<void> { await invokeOAuth('codeforces-oauth-init', 'Codeforces'); }
export async function connectStackOverflow(_handle?: string): Promise<void> { const verifier = randomVerifier(); const challenge = await createPkceChallenge(verifier); sessionStorage.setItem(STACKOVERFLOW_PKCE_KEY, verifier); await invokeOAuth('stackoverflow-oauth-init', 'Stack Overflow', { code_challenge: challenge }); }
export async function disconnectGitHub(): Promise<void> { await disconnectPublicProfile('github'); }
export async function syncGitHub(): Promise<GitHubPrivateSync> { const { data, error } = await supabase.functions.invoke('sync-github-private', { body: {} }); if (error) { let message = error.message; const context = (error as { context?: { json?: () => Promise<unknown> } }).context; if (context?.json) { try { const body = await context.json() as { error?: string }; if (body?.error) message = body.error; } catch { /* keep default */ } } throw new Error(message); } const payload = data as Partial<GitHubPrivateSync> & { error?: string }; if (payload.error) throw new Error(payload.error); if (!payload.syncedAt || !payload.username) throw new Error('GitHub sync returned an incomplete result.'); return payload as GitHubPrivateSync; }
export async function syncIntegration(provider: Exclude<IntegrationId, 'github'>): Promise<{ syncedAt: string; handle: string; provider: string }> { const status = await getIntegrationStatus(); const handle = status[provider].username ?? status[provider].handle; if (!handle) throw new Error(`${provider} is not connected.`); const profile = await syncPublicProfile(provider, handle); return { syncedAt: profile.lastSyncedAt ?? profile.last_synced_at ?? new Date().toISOString(), handle: profile.handle, provider }; }
export async function disconnectCodeforces(): Promise<void> { await disconnectPublicProfile('codeforces'); }
export async function connectLeetCode(handle: string): Promise<void> { await beginOwnershipVerification('leetcode', handle); }
export async function disconnectLeetCode(): Promise<void> { await disconnectPublicProfile('leetcode'); }
export async function connectCodewars(handle: string): Promise<void> { await beginOwnershipVerification('codewars', handle); }
export async function disconnectCodewars(): Promise<void> { await disconnectPublicProfile('codewars'); }
export async function disconnectStackOverflow(): Promise<void> { await disconnectPublicProfile('stackoverflow'); }

async function disconnectPublicProfile(provider: IntegrationId): Promise<void> { const { data, error } = await supabase.from('tracked_profiles').select('id').eq('platform', provider).limit(1); if (error) throw new Error(error.message); const id = data?.[0]?.id; if (!id) return; const { error: deleteError } = await supabase.from('tracked_profiles').delete().eq('id', id); if (deleteError) throw new Error(deleteError.message); }

if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('stackoverflow') === 'oauth_callback') {
    const code = params.get('code');
    const state = params.get('state');
    if (code && state) {
      void completeStackOverflowOAuth(code, state).then(() => {
        const url = new URL(window.location.href); url.searchParams.delete('code'); url.searchParams.delete('state'); url.searchParams.set('stackoverflow', 'connected'); window.location.replace(url.toString());
      }).catch((error) => {
        const url = new URL(window.location.href); url.searchParams.delete('code'); url.searchParams.delete('state'); url.searchParams.set('stackoverflow', 'error'); url.searchParams.set('message', error instanceof Error ? error.message : 'Stack Overflow connection failed.'); window.location.replace(url.toString());
      });
    }
  }
}
