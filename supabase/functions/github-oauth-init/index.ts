import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const CLIENT_ID = Deno.env.get("GITHUB_APP_CLIENT_ID") ?? "";
const CALLBACK_URL = "https://ehabrjqrfhgwdlmbcwho.supabase.co/functions/v1/github-oauth-callback";
const INSTALL_URL = "https://github.com/apps/apivue-developer-explorer/installations/new";
const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function secretKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed.default ?? Object.values(parsed)[0];
    } catch { /* fallback */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!CLIENT_ID) return json({ error: "GitHub App Client ID is not configured." }, 500);

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing authorization" }, 401);

  const publishable = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, publishable, { auth: { persistSession: false } });
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) return json({ error: "Not authenticated" }, 401);

  const stateBytes = new Uint8Array(32);
  crypto.getRandomValues(stateBytes);
  const state = Array.from(stateBytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(state));
  const stateHash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, secretKey(), { auth: { persistSession: false } });
  const { error: insertError } = await admin.from("github_oauth_states").insert({
    user_id: data.user.id,
    state_hash: stateHash,
  });
  if (insertError) return json({ error: insertError.message }, 500);

  // Always start with GitHub's App OAuth flow. This fixes the common case where
  // the App is already installed: GitHub then shows the installation settings
  // page instead of returning to our callback, leaving APIVue looking disconnected.
  // If the user has not installed the App yet, the callback sends them through
  // the installation flow and reuses the same short-lived state.
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", CALLBACK_URL);
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "false");

  return json({
    url: url.toString(),
    installUrl: INSTALL_URL,
    flow: "github-app-oauth",
  });
});
