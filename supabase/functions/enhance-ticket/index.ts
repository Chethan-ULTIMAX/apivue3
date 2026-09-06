import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_FIELDS = ["description", "acceptanceCriteria"] as const;
const MAX_TEXT_LENGTH = 10_000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Workspace membership check — prevent self-registered users from burning AI credits
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: member, error: memberError } = await adminClient
    .from("team_members")
    .select("id")
    .eq("user_id", userData.user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (memberError || !member) {
    return new Response(
      JSON.stringify({ error: "Forbidden — workspace membership required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { text, field, context } = await req.json();

    if (!text || typeof text !== "string" || !text.trim() || text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Text is missing or too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof field !== "string" || !ALLOWED_FIELDS.includes(field as typeof ALLOWED_FIELDS[number])) {
      return new Response(
        JSON.stringify({ error: "Invalid field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contextText = typeof context === "string" && context.trim() && context.length <= MAX_TEXT_LENGTH
      ? context.trim()
      : "";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt =
      field === "acceptanceCriteria"
        ? `You are a senior product manager. Produce clear, structured, testable acceptance criteria for a sprint ticket. Use Given/When/Then format or a concise bullet list. Keep it professional and specific. Return ONLY the acceptance criteria text — no title, no headings like "Acceptance Criteria:", no preamble, no explanation.`
        : `You are a senior product manager. Rewrite the following ticket description to be clear, actionable, and well-structured. Use concise language and include context and expected behavior. Return ONLY the rewritten description as plain prose. Do NOT include a title or ticket name. Do NOT include acceptance criteria, Given/When/Then blocks, "Acceptance Criteria" sections, or any test cases — those live in a separate field.`;

    const userContent =
      field === "acceptanceCriteria" && contextText
        ? `Ticket description:\n${contextText}\n\nExisting acceptance criteria (may be empty — if empty, derive them from the description above):\n${text}`
        : text;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      return new Response(
        JSON.stringify({ error: "AI enhancement failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const enhanced = data.choices?.[0]?.message?.content || text;

    return new Response(
      JSON.stringify({ enhanced }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("enhance-ticket error:", e);
    return new Response(
      JSON.stringify({ error: "Enhancement failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
