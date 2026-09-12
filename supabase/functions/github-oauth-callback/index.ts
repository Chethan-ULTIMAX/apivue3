import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const CLIENT_ID = Deno.env.get("GITHUB_APP_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("GITHUB_APP_CLIENT_SECRET") ?? "";
const APP_ID = "4921367";
const CALLBACK_URL = "https://ehabrjqrfhgwdlmbcwho.supabase.co/functions/v1/github-oauth-callback";
const FRONTEND_URL = "https://chethan-ultimax.github.io/APIVue/";
const INSTALL_URL = "https://github.com/apps/apivue-developer-explorer/installations/new";

function secretKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try { const parsed = JSON.parse(raw); return parsed.default ?? Object.values(parsed)[0]; } catch { /* fallback */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
}

function redirect(status: string, message?: string, installUrl?: string) {
  const url = new URL(FRONTEND_URL);
  url.searchParams.set("github", status);
  if (message) url.searchParams.set("message", message.slice(0, 180));
  if (installUrl) url.searchParams.set("install", installUrl);
  return new Response(null, { status: 302, headers: { Location: url.toString(), ...corsHeaders } });
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function github(path: string, token: string) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2026-03-10", "User-Agent": "APIVue" },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text.slice(0, 260)}`);
  }
  return response.json();
}

async function exchangeCode(code: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, redirect_uri: CALLBACK_URL }),
  });
  const body = await response.json() as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !body.access_token) throw new Error(body.error_description ?? body.error ?? "GitHub token exchange failed.");
  return body.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return redirect("error", "Method not allowed");
  if (!CLIENT_ID || !CLIENT_SECRET) return redirect("error", "GitHub App credentials are not configured.");

  const incoming = new URL(req.url);
  const code = incoming.searchParams.get("code");
  const state = incoming.searchParams.get("state");
  const error = incoming.searchParams.get("error");
  if (error) return redirect("error", `GitHub authorization was cancelled: ${error}`);
  if (!code || !state) return redirect("error", "Missing GitHub authorization code or state.");

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, secretKey(), { auth: { persistSession: false } });
  const stateHash = await sha256Hex(state);
  const { data: stateRow, error: stateError } = await admin.from("github_oauth_states").select("id,user_id,expires_at").eq("state_hash", stateHash).maybeSingle();
  if (stateError || !stateRow) return redirect("error", "Invalid or expired GitHub connection request. Start the connection again.");
  if (new Date(stateRow.expires_at).getTime() < Date.now()) {
    await admin.from("github_oauth_states").delete().eq("id", stateRow.id);
    return redirect("error", "The GitHub connection request expired. Please try again.");
  }

  try {
    const githubToken = await exchangeCode(code);
    const me = await github("/user", githubToken) as { login: string; name?: string | null; avatar_url?: string; html_url?: string };
    const installationsBody = await github("/user/installations?per_page=100", githubToken) as { installations?: Array<{ id: number; app_id?: number; account?: { login?: string; type?: string }; repository_selection?: string; permissions?: Record<string, string> }> };
    const installation = (installationsBody.installations ?? []).find((item) => String(item.app_id ?? "") === APP_ID);

    if (!installation) {
      const installUrl = new URL(INSTALL_URL);
      installUrl.searchParams.set("state", state);
      installUrl.searchParams.set("redirect_uri", CALLBACK_URL);
      return redirect("needs-install", `GitHub is authorized. Install APIVue Developer Explorer on @${me.login} to enable repository access.`, installUrl.toString());
    }

    const repos: unknown[] = [];
    for (let page = 1; page <= 10; page += 1) {
      const batch = await github(`/user/installations/${installation.id}/repositories?per_page=100&page=${page}`, githubToken) as { repositories?: unknown[] };
      const current = batch.repositories ?? [];
      repos.push(...current);
      if (current.length < 100) break;
    }

    const privateRepos = repos.filter((repo) => (repo as { private?: boolean })?.private === true);
    const publicRepos = repos.filter((repo) => (repo as { private?: boolean })?.private !== true);
    const profile = {
      platform: "github",
      handle: me.login,
      displayName: me.name ?? me.login,
      avatarUrl: me.avatar_url ?? null,
      profileUrl: me.html_url ?? `https://github.com/${me.login}`,
      privateAccess: privateRepos.length > 0,
      privateRepoCount: privateRepos.length,
      accessibleRepoCount: repos.length,
      installationId: installation.id,
      repositorySelection: installation.repository_selection ?? "selected",
      permissions: installation.permissions ?? {},
      connectedGitHubLogin: me.login,
      repositories: repos,
      privateRepositories: privateRepos,
      publicRepositories: publicRepos,
      connectedAt: new Date().toISOString(),
    };

    const { data: saved, error: upsertError } = await admin.from("tracked_profiles").upsert({ user_id: stateRow.user_id, platform: "github", handle: me.login, display_name: profile.displayName, avatar_url: profile.avatarUrl, profile_url: profile.profileUrl, data: profile, sync_error: null, last_synced_at: new Date().toISOString() }, { onConflict: "user_id,platform,handle" }).select("id").single();
    if (upsertError || !saved) throw new Error(upsertError?.message ?? "Could not save the GitHub connection.");
    const { error: snapshotError } = await admin.from("profile_snapshots").insert({ profile_id: saved.id, user_id: stateRow.user_id, metrics: { repository_total: repos.length, private_repository_total: privateRepos.length } });
    if (snapshotError) throw new Error(snapshotError.message);

    await admin.from("github_oauth_states").delete().eq("id", stateRow.id);
    return redirect("connected");
  } catch (err) {
    await admin.from("github_oauth_states").delete().eq("id", stateRow.id);
    return redirect("error", err instanceof Error ? err.message : "GitHub authorization failed.");
  }
});
