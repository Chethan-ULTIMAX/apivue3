import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const CLIENT_ID = Deno.env.get("GITHUB_APP_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("GITHUB_APP_CLIENT_SECRET") ?? "";
const CALLBACK_URL = "https://ehabrjqrfhgwdlmbcwho.supabase.co/functions/v1/github-oauth-callback";
const FRONTEND_URL = "https://chethan-ultimax.github.io/APIVue/";

function secretKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try { const parsed = JSON.parse(raw); return parsed.default ?? Object.values(parsed)[0]; } catch { /* fallback */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
}

function redirect(status: string, message?: string) {
  const url = new URL(FRONTEND_URL);
  url.searchParams.set("github", status);
  if (message) url.searchParams.set("message", message.slice(0, 180));
  return new Response(null, { status: 302, headers: { Location: url.toString(), ...corsHeaders } });
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return redirect("error", "Method not allowed");
  if (!CLIENT_ID || !CLIENT_SECRET) return redirect("error", "GitHub App credentials are not configured.");

  const incoming = new URL(req.url);
  const code = incoming.searchParams.get("code");
  const state = incoming.searchParams.get("state");
  const setupAction = incoming.searchParams.get("setup_action");
  if (!code || !state) return redirect("error", setupAction === "request" ? "GitHub installation authorization did not return a code. Please install the app on your account and try again." : "Missing OAuth authorization code or state.");

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, secretKey(), { auth: { persistSession: false } });
  const stateHash = await sha256Hex(state);
  const { data: stateRow, error: stateError } = await admin.from("github_oauth_states").select("id,user_id,expires_at").eq("state_hash", stateHash).maybeSingle();
  if (stateError || !stateRow) return redirect("error", "Invalid or expired OAuth state. Please start the connection again.");
  if (new Date(stateRow.expires_at).getTime() < Date.now()) {
    await admin.from("github_oauth_states").delete().eq("id", stateRow.id);
    return redirect("error", "The GitHub authorization request expired. Please try again.");
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, redirect_uri: CALLBACK_URL }),
    });
    const tokenBody = await tokenResponse.json() as { access_token?: string; error?: string; error_description?: string };
    if (!tokenResponse.ok || !tokenBody.access_token) throw new Error(tokenBody.error_description ?? tokenBody.error ?? "GitHub token exchange failed.");
    const githubToken = tokenBody.access_token;

    const ghHeaders = { Authorization: `Bearer ${githubToken}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    const meResponse = await fetch("https://api.github.com/user", { headers: ghHeaders });
    if (!meResponse.ok) throw new Error("GitHub account verification failed.");
    const me = await meResponse.json() as { login: string; name?: string | null; avatar_url?: string; html_url?: string };

    const repos: unknown[] = [];
    for (let page = 1; page <= 10; page++) {
      const response = await fetch(`https://api.github.com/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&per_page=100&page=${page}&sort=updated`, { headers: ghHeaders });
      if (!response.ok) throw new Error("GitHub repository access failed. Check the app installation permissions.");
      const batch = await response.json() as unknown[];
      repos.push(...batch);
      if (batch.length < 100) break;
    }

    const privateRepos = repos.filter((repo) => (repo as { private?: boolean })?.private === true);
    const publicRepos = repos.filter((repo) => (repo as { private?: boolean })?.private !== true);
    const profile = {
      platform: "github",
      handle: me.login,
      displayName: me.name ?? me.login,
      avatarUrl: me.avatar_url ?? null,
      profileUrl: me.html_url ?? `https://github.com/${me.login}`,
      privateAccess: true,
      privateRepoCount: privateRepos.length,
      accessibleRepoCount: repos.length,
      connectedGitHubLogin: me.login,
      repositories: repos,
      privateRepositories: privateRepos,
      publicRepositories: publicRepos,
    };

    const { data: saved, error: upsertError } = await admin.from("tracked_profiles").upsert({
      user_id: stateRow.user_id,
      platform: "github",
      handle: me.login,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      profile_url: profile.profileUrl,
      data: profile,
      sync_error: null,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: "user_id,platform,handle" }).select("id").single();
    if (upsertError || !saved) throw new Error(upsertError?.message ?? "Could not save the GitHub connection.");

    const { error: snapshotError } = await admin.from("profile_snapshots").insert({
      profile_id: saved.id,
      user_id: stateRow.user_id,
      metrics: { repository_total: repos.length, private_repository_total: privateRepos.length },
    });
    if (snapshotError) throw new Error(snapshotError.message);

    await admin.from("github_oauth_states").delete().eq("id", stateRow.id);
    return redirect("connected");
  } catch (error) {
    await admin.from("github_oauth_states").delete().eq("id", stateRow.id);
    return redirect("error", error instanceof Error ? error.message : "GitHub authorization failed.");
  }
});