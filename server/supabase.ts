import {
  createClient,
  type User,
} from '@supabase/supabase-js';

import { env } from './env';

/* ============================================================
 * Admin client (service role)
 *
 * ⚠️ NEVER import this into browser code.
 * The service-role key bypasses Row Level Security.
 * ============================================================ */

export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

/* ============================================================
 * Auth-verification client (publishable key)
 *
 * Used to validate user access tokens. Never persists a session.
 * ============================================================ */

const supabaseAuth = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

/* ============================================================
 * Short-lived validation cache
 *
 * `supabaseAuth.auth.getUser(token)` performs a network round-trip
 * to Supabase on every call. On a busy API this adds ~50-200ms and
 * a quota hit for every authenticated request.
 *
 * We cache SUCCESSFUL validations for a short TTL (60s). This is
 * safe because:
 *   - A Supabase JWT is immutable while valid.
 *   - Logout / revocation takes effect within the TTL window.
 *   - Failed validations are never cached.
 * ============================================================ */

const VALIDATION_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 1000;

interface CacheEntry {
  user: User;
  expiresAt: number;
}

const validationCache = new Map<string, CacheEntry>();

function cacheKey(token: string): string {
  // Length + head + tail is enough to avoid accidental collisions
  // without holding the full token in memory as a key.
  return `${token.length}:${token.slice(0, 16)}:${token.slice(-16)}`;
}

function readCache(token: string): User | null {
  const entry = validationCache.get(cacheKey(token));
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    validationCache.delete(cacheKey(token));
    return null;
  }
  return entry.user;
}

function writeCache(token: string, user: User): void {
  validationCache.set(cacheKey(token), {
    user,
    expiresAt: Date.now() + VALIDATION_TTL_MS,
  });

  // Opportunistic cleanup: prune expired entries when the map grows.
  if (validationCache.size > MAX_CACHE_ENTRIES) {
    const now = Date.now();
    for (const [k, v] of validationCache) {
      if (v.expiresAt < now) validationCache.delete(k);
    }
  }
}

/* ============================================================
 * Public API
 * ============================================================ */

/**
 * Verify a Supabase access token and return the authenticated user.
 *
 * Returns `null` when the token is missing, malformed, expired, or
 * rejected by Supabase. Never throws on auth failure — callers
 * decide whether to reject the request.
 */
export async function getAuthenticatedUser(
  token: string | undefined,
): Promise<User | null> {
  const normalized = token?.trim();
  if (!normalized) return null;

  const cached = readCache(normalized);
  if (cached) return cached;

  try {
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser(normalized);

    if (error || !user) return null;

    writeCache(normalized, user);
    return user;
  } catch (err) {
    console.error('[supabase] Token verification failed:', err);
    return null;
  }
}

/**
 * Thrown by `requireAuthenticatedUser`.
 *
 * Route handlers can throw this directly and rely on the error
 * handler to convert it into a 401 response.
 */
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Same as `getAuthenticatedUser`, but throws when the token is
 * invalid. Convenient at the top of a route handler.
 *
 *   const user = await requireAuthenticatedUser(req);
 */
export async function requireAuthenticatedUser(
  token: string | undefined,
): Promise<User> {
  const user = await getAuthenticatedUser(token);
  if (!user) throw new UnauthorizedError();
  return user;
}