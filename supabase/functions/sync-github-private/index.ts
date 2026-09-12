import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { App } from "npm:octokit@5";

const APP_ID = "4921367";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function githubWithInstallation(installationId: number, path: string) {
  const privateKey = Deno.env.get("GITHUB_APP_PRIVATE_KEY") ?? "";
  if (!privateKey) throw new Error("GitHub App private key is not configured.");
  const app = new App({ appId: APP_ID, privateKey });
  const octokit = await app.getInstallationOctokit(installationId);
  return octokit.request(path, { headers: { "X-GitHub-Api-Version": "2026-03-10" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing APIVue authorization" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return json({ error: "Not authenticated" }, 401);

  try {
    const { data: profile, error: profileError } = await supabase.from("tracked_profiles").select("id,handle,data").eq("user_id", userData.user.id).eq("platform", "github").order("last_synced_at", { ascending: false }).limit(1).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return json({ error: "GitHub is not connected. Connect GitHub first." }, 404);

    const current = (profile.data ?? {}) as Record<string, unknown>;
    let installationId = typeof current.installationId === "number" ? current.installationId : undefined;
    if (!installationId) {
      const privateKey = Deno.env.get("GITHUB_APP_PRIVATE_KEY") ?? "";
      if (!privateKey) throw new Error("GitHub App private key is not configured.");
      const app = new App({ appId: APP_ID, privateKey });
      const response = await app.octokit.request("GET /users/{username}/installation", { username: profile.handle, headers: { "X-GitHub-Api-Version": "2026-03-10" } });
      installationId = response.data.id;
    }

    const repos: unknown[] = [];
    for (let page = 1; page <= 10; page += 1) {
      const response = await githubWithInstallation(installationId, `GET /installation/repositories?per_page=100&page=${page}`);
      const batch = (response.data as { repositories?: unknown[] }).repositories ?? [];
      repos.push(...batch);
      if (batch.length < 100) break;
    }
    const privateRepos = repos.filter((repo) => (repo as { private?: boolean })?.private === true);
    const publicRepos = repos.filter((repo) => (repo as { private?: boolean })?.private !== true);
    const now = new Date().toISOString();
    const nextData = { ...current, privateAccess: privateRepos.length > 0, privateRepoCount: privateRepos.length, accessibleRepoCount: repos.length, installationId, repositories: repos, privateRepositories: privateRepos, publicRepositories: publicRepos, connectedGitHubLogin: profile.handle };
    const { error: updateError } = await supabase.from("tracked_profiles").update({ data: nextData, sync_error: null, last_synced_at: now }).eq("id", profile.id).eq("user_id", userData.user.id);
    if (updateError) throw updateError;
    const { error: snapshotError } = await supabase.from("profile_snapshots").insert({ profile_id: profile.id, user_id: userData.user.id, metrics: { repository_total: repos.length, private_repository_total: privateRepos.length } });
    if (snapshotError) throw snapshotError;
    return json({ login: profile.handle, syncedAt: now, privateAccess: privateRepos.length > 0, accessibleRepoCount: repos.length, privateRepoCount: privateRepos.length });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "GitHub private sync failed" }, 502);
  }
});
