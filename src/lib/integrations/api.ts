/**
 * Frontend client for the APIVue backend integration API.
 *
 * Every request:
 *   - attaches the current Supabase bearer token (if available)
 *   - includes cookies (defence in depth if the backend also uses cookies)
 *   - throws a user-friendly Error on non-2xx responses
 *
 * Base URL comes from VITE_API_URL, defaulting to localhost:8787 for dev.
 */

import { supabase } from '@/integrations/supabase/client';
import type { IntegrationStatus } from './types';

const API_BASE = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8787'
).replace(/\/+$/, '');

/* ============================================================
 * Low-level request helper
 * ============================================================ */

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
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

  const response = await fetch(`${API_BASE}${path}`, {
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
      // Response was not JSON — keep the default message.
    }

    throw new Error(message);
  }

  // Some endpoints (e.g. disconnect) may return 204 No Content.
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/* ============================================================
 * Status
 * ============================================================ */

/** Fetches the connected-account status for every integration. */
export function getIntegrationStatus(): Promise<IntegrationStatus> {
  return request<IntegrationStatus>('/api/integrations');
}

/* ============================================================
 * GitHub — OAuth flow
 * ============================================================ */

/**
 * Starts the GitHub OAuth flow by redirecting the browser to the
 * authorization URL returned by the backend.
 */
export async function connectGitHub(): Promise<void> {
  const { url } = await request<{ url: string }>(
    '/api/integrations/github/connect',
  );
  window.location.href = url;
}

/** Disconnects the linked GitHub account. */
export async function disconnectGitHub(): Promise<void> {
  await request<unknown>('/api/integrations/github/disconnect', {
    method: 'POST',
  });
}

/**
 * Triggers a fresh sync of GitHub data for the connected account.
 * Returns the timestamp and username that were synced.
 */
export function syncGitHub(): Promise<{
  syncedAt: string;
  username: string;
}> {
  return request<{ syncedAt: string; username: string }>(
    '/api/integrations/github/sync',
    { method: 'POST' },
  );
}

/* ============================================================
 * Username-based integrations
 * ============================================================ */

export async function connectCodeforces(handle: string): Promise<void> {
  await request<unknown>('/api/integrations/codeforces/connect', {
    method: 'POST',
    body: JSON.stringify({ handle }),
  });
}

export async function disconnectCodeforces(): Promise<void> {
  await request<unknown>('/api/integrations/codeforces/disconnect', {
    method: 'POST',
  });
}

export async function connectLeetCode(handle: string): Promise<void> {
  await request<unknown>('/api/integrations/leetcode/connect', {
    method: 'POST',
    body: JSON.stringify({ handle }),
  });
}

export async function disconnectLeetCode(): Promise<void> {
  await request<unknown>('/api/integrations/leetcode/disconnect', {
    method: 'POST',
  });
}

export async function connectCodewars(handle: string): Promise<void> {
  await request<unknown>('/api/integrations/codewars/connect', {
    method: 'POST',
    body: JSON.stringify({ handle }),
  });
}

export async function disconnectCodewars(): Promise<void> {
  await request<unknown>('/api/integrations/codewars/disconnect', {
    method: 'POST',
  });
}

export async function connectStackOverflow(userId: string): Promise<void> {
  await request<unknown>('/api/integrations/stackoverflow/connect', {
    method: 'POST',
    body: JSON.stringify({ handle: userId }),
  });
}

export async function disconnectStackOverflow(): Promise<void> {
  await request<unknown>('/api/integrations/stackoverflow/disconnect', {
    method: 'POST',
  });
}