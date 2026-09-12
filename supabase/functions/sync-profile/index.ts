import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { adapters, supportedPlatforms } from "../_shared/platforms.ts";

const BodySchema = z.object({
  platform: z.string().min(1).max(40),
  handle: z.string().min(1).max(120),
  save: z.boolean().optional().default(true),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing authorization" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return json({ error: "Not authenticated" }, 401);
  const userId = userData.user.id;

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);

  const platform = parsed.data.platform.toLowerCase();
  const handle = parsed.data.handle.trim().replace(/^@/, "");
  const adapter = adapters[platform];
  if (!adapter) return json({ error: `Unsupported platform "${platform}". Supported: ${supportedPlatforms.join(", ")}` }, 400);

  let profile;
  try { profile = await adapter.fetchProfile(handle); } catch (err) { return json({ error: (err as Error).message || "Could not fetch this profile" }, 502); }
  if (!parsed.data.save) return json({ profile });

  const { data: saved, error: upsertError } = await supabase.from("tracked_profiles").upsert({
    user_id: userId,
    platform,
    handle,
    display_name: profile.displayName,
    avatar_url: profile.avatarUrl,
    profile_url: profile.profileUrl,
    data: profile,
    sync_error: null,
    last_synced_at: new Date().toISOString(),
  }, { onConflict: "user_id,platform,handle" }).select("*").single();
  if (upsertError) return json({ error: upsertError.message }, 400);

  const metrics: Record<string, number> = {};
  for (const m of profile.metrics) if (typeof m.value === "number") metrics[m.key] = m.value;
  const totalActivity = profile.activity.reduce((s, a) => s + a.count, 0);
  if (totalActivity) metrics.activity_total = totalActivity;
  const { error: snapshotError } = await supabase.from("profile_snapshots").insert({ profile_id: saved.id, user_id: userId, metrics });
  if (snapshotError) return json({ error: snapshotError.message }, 400);
  return json({ profile: saved });
});
