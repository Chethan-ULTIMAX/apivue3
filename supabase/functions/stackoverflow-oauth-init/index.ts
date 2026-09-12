import { createClient } from "npm:@supabase/supabase-js@2";

const APP_URL = "https://chethan-ultimax.github.io/APIVue/dashboard/integrations";
const REDIRECT_URI = "https://ehabrjqrfhgwdlmbcwho.supabase.co/functions/v1/stackoverflow-oauth-callback";
const AUTH_URL = "https://stackoverflow.com/oauth";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function randomState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing authorization" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
  );
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return json({ error: "Not authenticated" }, 401);

  const clientId = Deno.env.get("STACKOVERFLOW_CLIENT_ID") ?? "";
  if (!clientId) return json({ error: "Stack Overflow OAuth credentials are not configured in APIVue." }, 500);

  const state = randomState();
  const stateHash = await sha256(state);
  const { error: insertError } = await supabase.from("stackoverflow_oauth_states").insert({
    user_id: userData.user.id,
    state_hash: stateHash,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
  if (insertError) return json({ error: insertError.message }, 500);

  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("state", state);

  return json({ url: url.toString(), redirect: APP_URL });
});
