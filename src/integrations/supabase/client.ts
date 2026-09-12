/**
 * Supabase client.
 *
 * Configured with:
 *   - persistent sessions in localStorage
 *   - automatic token refresh
 *   - a custom fetch that handles Supabase's newer opaque API keys
 *     (the `sb_publishable_*` / `sb_secret_*` format), which are not
 *     bearer JWTs and must not be sent as an Authorization header.
 *
 * The project must be configured with these environment variables:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Supabase configuration. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.',
  );
}

/**
 * Supabase's newer API keys are opaque strings, not JWTs.
 * If the SDK ever sends one as a bearer token, strip it — otherwise
 * every request would fail with a malformed JWT error.
 */
function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request
        ? input.headers
        : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get('Authorization') === `Bearer ${supabaseKey}`
    ) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

/**
 * The shared Supabase client.
 *
 * Import like this:
 *   import { supabase } from '@/integrations/supabase/client';
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});