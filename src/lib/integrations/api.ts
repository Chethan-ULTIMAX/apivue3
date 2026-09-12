/**
 * Browser client for the optional Express integration API.
 *
 * GitHub Pages hosts the static frontend; the Express service hosts
 * authenticated connections and provider synchronization.
 */

import { supabase } from '@/integrations/supabase/client';
import type { IntegrationId, IntegrationStatus } from './types';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE = (configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:8787' : ''))
  .replace(/\/+$/, '');

function getApiBase(): string {
  if (API_BASE) return API_BASE;
  throw new Error(
    'APIVue backend is not configured for this deployment. Set VITE_API_URL to the public API server URL.',
  );
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string> | undefined) ?? {}),
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const data = (await response.json()) as
        | { error?: string; message?: string }
        | undefined;
      if (data?.error) message = data.error;
      else if (data?.message) message = data.message;
    } catch {
      /* keep the default message */
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function getIntegrationStatus(): Promise<IntegrationStatus> {
  return request<IntegrationStatus>('/api/integrations');
}

export async function connectGitHub(): Promise<void> {
  const { url } = await request<{ url: string }>('/api/integrations/github/connect');
  window.location.href = url;
}

export async function disconnectGitHub(): Promise<void> {
  await request<unknown>('/api/integrations/github/disconnect', { method: 'POST' });
}

export function syncGitHub(): Promise<{ syncedAt: string; username: string }> {
  return request<{ syncedAt: string; username: string }>(
    '/api/integrations/github/sync',
    { method: 'POST' },
  );
}

/**
 * Sync any connected public-data provider through the same normalized
 * server pipeline. GitHub intentionally remains on its OAuth-specific
 * route because its access token is server-only.
 */
export function syncIntegration(
  provider: Exclude<IntegrationId, 'github'>,
): Promise<{ syncedAt: string; handle: string; provider: string }> {
  return request<{ syncedAt: string; handle: string; provider: string }>(
    `/api/integrations/${provider}/sync`,
    { method: 'POST' },
  );
}

export async function connectCodeforces(handle: string): Promise<void> {
  await request<unknown>('/api/integrations/codeforces/connect', {
    method: 'POST',
    body: JSON.stringify({ handle }),
  });
}

export async function disconnectCodeforces(): Promise<void> {
  await request<unknown>('/api/integrations/codeforces/disconnect', { method: 'POST' });
}

export async function connectLeetCode(handle: string): Promise<void> {
  await request<unknown>('/api/integrations/leetcode/connect', {
    method: 'POST',
    body: JSON.stringify({ handle }),
  });
}

export async function disconnectLeetCode(): Promise<void> {
  await request<unknown>('/api/integrations/leetcode/disconnect', { method: 'POST' });
}

export async function connectCodewars(handle: string): Promise<void> {
  await request<unknown>('/api/integrations/codewars/connect', {
    method: 'POST',
    body: JSON.stringify({ handle }),
  });
}

export async function disconnectCodewars(): Promise<void> {
  await request<unknown>('/api/integrations/codewars/disconnect', { method: 'POST' });
}

export async function connectStackOverflow(userId: string): Promise<void> {
  await request<unknown>('/api/integrations/stackoverflow/connect', {
    method: 'POST',
    body: JSON.stringify({ handle: userId }),
  });
}

export async function disconnectStackOverflow(): Promise<void> {
  await request<unknown>('/api/integrations/stackoverflow/disconnect', { method: 'POST' });
}
