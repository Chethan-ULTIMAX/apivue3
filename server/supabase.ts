import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const supabaseAuth = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export async function getAuthenticatedUser(token: string) {
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}