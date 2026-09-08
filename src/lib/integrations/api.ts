import type {
  IntegrationStatus,
} from './types';

const API_BASE =
  import.meta.env.VITE_API_URL ??
  'http://localhost:8787';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API_BASE}${path}`,
    {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
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
  window.location.href =
    `${API_BASE}/api/integrations/github/connect`;
}

export async function disconnectGitHub() {
  return request(
    '/api/integrations/github/disconnect',
    {
      method: 'POST',
    }
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