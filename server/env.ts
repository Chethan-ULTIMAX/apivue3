import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 8787),

  clientUrl:
    process.env.CLIENT_URL ?? 'http://localhost:8080',

  sessionSecret: required('SESSION_SECRET'),

  githubClientId: required('GITHUB_CLIENT_ID'),
  githubClientSecret: required('GITHUB_CLIENT_SECRET'),
  githubCallbackUrl: required('GITHUB_CALLBACK_URL'),
  supabaseUrl: required('SUPABASE_URL'),
  supabasePublishableKey: required('SUPABASE_PUBLISHABLE_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
};