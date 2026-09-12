import 'dotenv/config';

type NodeEnv = 'development' | 'production' | 'test';

/* ============================================================
 * Helpers
 * ============================================================ */

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to your .env file.`,
    );
  }
  return value;
}

function optional(name: string): string {
  return process.env[name]?.trim() ?? '';
}

function nodeEnv(): NodeEnv {
  const raw = (process.env.NODE_ENV ?? 'development').trim().toLowerCase();
  if (raw === 'production' || raw === 'test' || raw === 'development') {
    return raw;
  }
  console.warn(`[env] Unrecognized NODE_ENV="${raw}". Using "development".`);
  return 'development';
}

function portFromEnvironment(): number {
  const raw = process.env.PORT?.trim();
  if (!raw) return 8787;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT environment variable: ${raw}`);
  }
  return port;
}

function normalizeUrl(value: string, name: string): string {
  const normalized = value.trim().replace(/\/+$/, '');
  try {
    new URL(normalized);
  } catch {
    throw new Error(`Invalid URL in ${name}: ${value}`);
  }
  return normalized;
}

/* ============================================================
 * Resolve
 * ============================================================ */

const NODE_ENV = nodeEnv();

export const env = {
  nodeEnv: NODE_ENV,
  isProduction: NODE_ENV === 'production',
  isDevelopment: NODE_ENV === 'development',
  isTest: NODE_ENV === 'test',

  /** Express server port. Default: 8787. */
  port: portFromEnvironment(),

  /** Public frontend origin used for CORS + OAuth redirects. */
  clientUrl: normalizeUrl(
    process.env.CLIENT_URL ?? 'http://localhost:8080',
    'CLIENT_URL',
  ),

  /**
   * Session signing secret.
   *
   * Reserved for future signed-cookie sessions. Not used by the
   * current code path. Required in production; optional in dev/test.
   */
  sessionSecret: NODE_ENV === 'production'
    ? required('SESSION_SECRET')
    : optional('SESSION_SECRET'),

  /** GitHub OAuth — server-only. */
  githubClientId: required('GITHUB_CLIENT_ID'),
  githubClientSecret: required('GITHUB_CLIENT_SECRET'),
  githubCallbackUrl: normalizeUrl(
    required('GITHUB_CALLBACK_URL'),
    'GITHUB_CALLBACK_URL',
  ),

  /** Supabase — server-only. */
  supabaseUrl: normalizeUrl(required('SUPABASE_URL'), 'SUPABASE_URL'),
  supabasePublishableKey: required('SUPABASE_PUBLISHABLE_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
} as const;

/* ============================================================
 * Startup warnings (development only)
 * ============================================================ */

if (NODE_ENV === 'development') {
  if (!env.sessionSecret) {
    console.warn(
      '[env] SESSION_SECRET is not set. Not required by the current code, ' +
        'but you will need it before enabling signed sessions.',
    );
  }
}