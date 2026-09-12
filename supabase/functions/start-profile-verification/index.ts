import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
function randomCode(platform: "leetcode" | "codewars") { const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase(); return `APIVUE-${platform === "leetcode" ? "LC" : "CW"}-${hex}`; }
async function sha256(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Missing authorization" }, 401);
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Not authenticated" }, 401);
  let body: { platform?: string; handle?: string }; try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const platform = body.platform?.toLowerCase(); const handle = body.handle?.trim().replace(/^@/, "");
  if (platform !== "leetcode" && platform !== "codewars") return json({ error: "Ownership verification supports LeetCode and Codewars." }, 400);
  if (!handle || handle.length > 120) return json({ error: "A valid username is required." }, 400);
  const storagePlatform = platform === "codewars" ? "codewars_webhook" : "leetcode";
  const recent = await client.from("profile_ownership_verifications").select("id").eq("user_id", userData.user.id).eq("platform", storagePlatform).gte("created_at", new Date(Date.now() - 60_000).toISOString()).limit(5);
  if (recent.data && recent.data.length >= 3) return json({ error: "Please wait a minute before generating another verification challenge." }, 429);
  const code = randomCode(platform); const codeHash = await sha256(code); const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
  const { data: challenge, error } = await client.from("profile_ownership_verifications").insert({ user_id: userData.user.id, platform: storagePlatform, handle, code_hash: codeHash, expires_at: expiresAt }).select("id").single();
  if (error || !challenge) return json({ error: error?.message ?? "Could not create verification challenge" }, 400);
  if (platform === "leetcode") return json({ challengeId: challenge.id, code, platform, handle, expiresAt, verificationMode: "profile_summary", instructions: "Open your public LeetCode profile, choose Edit Profile, and put this exact code in the Summary/About Me field. Save the profile, then return to APIVue and click Verify ownership. Your existing Website and social links stay unchanged." });
  const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/codewars-webhook-verify?challenge=${encodeURIComponent(challenge.id)}`;
  return json({ challengeId: challenge.id, code, platform, handle, expiresAt, verificationMode: "webhook", webhookUrl, instructions: "Open Codewars Account Settings and add a webhook. Use the Payload URL shown here and this code as the webhook Secret. Save the webhook, then return to APIVue and click Check verification. You do not need to change your Clan or any profile information." });
});
