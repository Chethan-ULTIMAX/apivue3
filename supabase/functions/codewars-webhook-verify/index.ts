import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  const challengeId = url.searchParams.get("challenge");
  const secret = req.headers.get("X-Webhook-Secret") ?? "";
  if (!challengeId || !secret) return json({ error: "Missing verification challenge or webhook secret" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const secretHash = await sha256(secret.trim());
  const { data: challenge, error: challengeError } = await admin.from("profile_ownership_verifications").select("*").eq("id", challengeId).eq("platform", "codewars_webhook").eq("code_hash", secretHash).is("verified_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (challengeError) return json({ error: challengeError.message }, 500);
  if (!challenge) return json({ error: "Invalid or expired verification webhook" }, 401);

  try {
    const response = await fetch(`https://www.codewars.com/api/v1/users/${encodeURIComponent(challenge.handle)}`, { headers: { Accept: "application/json", "User-Agent": "APIVue/1.0" } });
    if (!response.ok) return json({ error: `Codewars returned ${response.status}` }, 502);
    const user = await response.json();
    if (String(user.username ?? "").toLowerCase() !== String(challenge.handle).toLowerCase()) return json({ error: "Codewars handle mismatch" }, 400);

    const profile = {
      platform: "codewars",
      handle: user.username ?? challenge.handle,
      displayName: user.name || user.username || challenge.handle,
      avatarUrl: null,
      profileUrl: `https://www.codewars.com/users/${encodeURIComponent(user.username ?? challenge.handle)}`,
      bio: null,
      location: null,
      joinedAt: null,
      metrics: [
        { key: "honor", label: "Honor", value: user.honor || 0, format: "number" },
        { key: "completed", label: "Completed kata", value: user.codeChallenges?.totalCompleted || 0, format: "number" },
        { key: "authored", label: "Authored kata", value: user.codeChallenges?.totalAuthored || 0, format: "number" },
        { key: "rank", label: "Overall rank", value: user.ranks?.overall?.name || null, format: "text" },
      ],
      breakdowns: [{ key: "languages", label: "Languages", unit: "score", items: Object.entries(user.ranks?.languages || {}).map(([name, value]: any) => ({ name, value: Number(value?.score || 0) })).slice(0, 10) }],
      ratingHistory: [],
      activity: [],
      highlights: [],
      fetchedAt: new Date().toISOString(),
      ownershipVerified: true,
      verificationMethod: "codewars_webhook",
      verificationVerifiedAt: new Date().toISOString(),
    };

    const existing = await admin.from("tracked_profiles").select("id").eq("user_id", challenge.user_id).eq("platform", "codewars").eq("handle", challenge.handle).maybeSingle();
    let saved;
    if (existing.data?.id) {
      const result = await admin.from("tracked_profiles").update({ display_name: profile.displayName, avatar_url: profile.avatarUrl, profile_url: profile.profileUrl, data: profile, sync_error: null, last_synced_at: new Date().toISOString() }).eq("id", existing.data.id).select("*").single();
      if (result.error) throw result.error;
      saved = result.data;
    } else {
      const result = await admin.from("tracked_profiles").insert({ user_id: challenge.user_id, platform: "codewars", handle: challenge.handle, display_name: profile.displayName, avatar_url: profile.avatarUrl, profile_url: profile.profileUrl, data: profile, sync_error: null, last_synced_at: new Date().toISOString() }).select("*").single();
      if (result.error) throw result.error;
      saved = result.data;
    }

    const metrics: Record<string, number> = {};
    for (const metric of profile.metrics) if (typeof metric.value === "number") metrics[metric.key] = metric.value;
    const snapshot = await admin.from("profile_snapshots").insert({ profile_id: saved.id, user_id: challenge.user_id, metrics });
    if (snapshot.error) throw snapshot.error;

    const marked = await admin.from("profile_ownership_verifications").update({ verified_at: new Date().toISOString() }).eq("id", challenge.id);
    if (marked.error) throw marked.error;

    return json({ verified: true, handle: challenge.handle });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Verification failed" }, 500);
  }
});
