import type {
  IntegrationStatus,
} from './types';
import { supabase } from '@/integrations/supabase/client';

const API_BASE =
  import.meta.env.VITE_API_URL ??
  'http://localhost:8787';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(
    `${API_BASE}${path}`,
    {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(options?.headers ?? {}),
      },
    }
  );

  if (!response.ok) {
    let message =
      `Request failed with status ${response.status}.`;

    try {
      const data =
        await response.json();

      if (data.error) {
        message = data.error;
      }
    } catch {
      // Keep the default error.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getIntegrationStatus() {
  return request<IntegrationStatus>(
    '/api/integrations'
  );
}

export function connectGitHub() {
  return request<{ url: string }>('/api/integrations/github/connect').then(({ url }) => {
    window.location.href = url;
  });
}

export async function disconnectGitHub() {
  return request(
    '/api/integrations/github/disconnect',
    {
      method: 'POST',
    }
  );
}

export async function syncGitHub() {
  return request<{ syncedAt: string; username: string }>(
    '/api/integrations/github/sync',
    { method: 'POST' },
  );
}

export async function connectCodeforces(
  handle: string
) {
  return request(
    '/api/integrations/codeforces/connect',
    {
      method: 'POST',
      body: JSON.stringify({
        handle,
      }),
    }
  );
}

export async function disconnectCodeforces() {
  return request(
    '/api/integrations/codeforces/disconnect',
    {
      method: 'POST',
    }
  );
}