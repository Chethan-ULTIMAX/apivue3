import { createClient } from "npm:@supabase/supabase-js@2";

const APP_URL = "https://chethan-ultimax.github.io/APIVue/dashboard/integrations";
const REDIRECT_URI = "https://ehabrjqrfhgwdlmbcwho.supabase.co/functions/v1/stackoverflow-oauth-callback";
const TOKEN_URL = "https://stackoverflow.com/oauth/access_token/json";
const API_BASE = "https://api.stackexchange.com/2.3";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function redirect(status: string, message?: string) {
  const url = new URL(APP_URL);
  url.searchParams.set("stackoverflow", status);
  if (message) url.searchParams.set("message", message.slice(0, 240));
  return new Response(null, { status: 302, headers: { Location: url.toString(), ...CORS } });
}

function secretKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed.default ?? Object.values(parsed)[0];
    } catch { /* fall through */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function getJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "User-Agent": "APIVue/1.0 (https://chethan-ultimax.github.io/APIVue/)",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch { /* handled below */ }
  if (!response.ok) throw new Error(`Stack Overflow returned ${response.status}.`);
  if (body?.error_id) throw new Error(body.error_message ?? "Stack Exchange API request failed.");
  return body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "GET") return redirect("error", "Method not allowed");

  const incoming = new URL(req.url);
  const code = incoming.searchParams.get("code");
  const state = incoming.searchParams.get("state");
  const oauthError = incoming.searchParams.get("error_description") ?? incoming.searchParams.get("error");
  if (oauthError) return redirect("error", `Stack Overflow authorization was cancelled: ${oauthError}`);
  if (!code || !state) return redirect("error", "Stack Overflow did not return an authorization code.");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(supabaseUrl, secretKey(), { auth: { persistSession: false } });
  const stateHash = await sha256(state);
  const { data: stateRow, error: stateError } = await admin
    .from("stackoverflow_oauth_states")
    .select("id,user_id,expires_at")
    .eq("state_hash", stateHash)
    .maybeSingle();

  if (stateError || !stateRow) return redirect("error", "Invalid or expired Stack Overflow connection request. Start again.");
  if (new Date(stateRow.expires_at).getTime() < Date.now()) {
    await admin.from("stackoverflow_oauth_states").delete().eq("id", stateRow.id);
    return redirect("error", "The Stack Overflow connection request expired. Start again.");
  }

  const clientId = Deno.env.get("STACKOVERFLOW_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("STACKOVERFLOW_CLIENT_SECRET") ?? "";
  const apiKey = Deno.env.get("STACKOVERFLOW_API_KEY") ?? "";
  if (!clientId || !clientSecret || !apiKey) {
    await admin.from("stackoverflow_oauth_states").delete().eq("id", stateRow.id);
    return redirect("error", "Stack Overflow OAuth credentials are not fully configured in APIVue.");
  }

  try {
    const form = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      code,
    });
    const token = await getJson(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const accessToken = String(token.access_token ?? "");
    if (!accessToken) throw new Error("Stack Overflow did not return an access token.");

    const me = await getJson(`${API_BASE}/me?site=stackoverflow&key=${encodeURIComponent(apiKey)}&access_token=${encodeURIComponent(accessToken)}`);
    const user = me?.items?.[0];
    if (!user?.user_id) throw new Error("Stack Overflow did not return the authorized user.");

    const id = String(user.user_id);
    const profile = {
      platform: "stackoverflow",
      handle: id,
      displayName: user.display_name ?? id,
      avatarUrl: user.profile_image ?? null,
      profileUrl: user.link ?? `https://stackoverflow.com/users/${id}`,
      bio: user.about_me ?? null,
      location: user.location ?? null,
      joinedAt: user.creation_date ? new Date(user.creation_date * 1000).toISOString() : null,
      metrics: [
        { key: "reputation", label: "Reputation", value: user.reputation ?? 0, format: "number" },
        { key: "gold", label: "Gold badges", value: user.badge_counts?.gold ?? 0, format: "number" },
        { key: "silver", label: "Silver badges", value: user.badge_counts?.silver ?? 0, format: "number" },
        { key: "bronze", label: "Bronze badges", value: user.badge_counts?.bronze ?? 0, format: "number" },
        { key: "answers", label: "Answers", value: user.answer_count ?? 0, format: "number" },
        { key: "questions", label: "Questions", value: user.question_count ?? 0, format: "number" },
        { key: "views", label: "Profile views", value: user.view_count ?? 0, format: "number" },
      ],
      authType: "stackoverflow-oauth",
      verified: true,
      providerUserId: id,
      fetchedAt: new Date().toISOString(),
    };

    const now = new Date().toISOString();
    const existing = await admin.from("tracked_profiles")
      .select("id")
      .eq("user_id", stateRow.user_id)
      .eq("platform", "stackoverflow")
      .eq("handle", id)
      .maybeSingle();

    let saved;
    if (existing.data?.id) {
      const result = await admin.from("tracked_profiles").update({
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
        profile_url: profile.profileUrl,
        data: profile,
        sync_error: null,
        last_synced_at: now,
      }).eq("id", existing.data.id).select("*").single();
      if (result.error) throw result.error;
      saved = result.data;
    } else {
      const result = await admin.from("tracked_profiles").insert({
        user_id: stateRow.user_id,
        platform: "stackoverflow",
        handle: id,
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
        profile_url: profile.profileUrl,
        data: profile,
        sync_error: null,
        last_synced_at: now,
      }).select("*").single();
      if (result.error) throw result.error;
      saved = result.data;
    }

    const metrics: Record<string, number> = {};
    for (const metric of profile.metrics) if (typeof metric.value === "number") metrics[metric.key] = metric.value;
    await admin.from("profile_snapshots").insert({ profile_id: saved.id, user_id: stateRow.user_id, metrics });
    await admin.from("stackoverflow_oauth_states").delete().eq("id", stateRow.id);
    return redirect("connected");
  } catch (error) {
    await admin.from("stackoverflow_oauth_states").delete().eq("id", stateRow.id);
    return redirect("error", error instanceof Error ? error.message : "Stack Overflow connection failed.");
  }
});
