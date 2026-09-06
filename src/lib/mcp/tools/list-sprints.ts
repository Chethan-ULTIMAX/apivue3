import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { resolveWorkspaceId, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_sprints",
  title: "List sprints",
  description: "List sprints with dates, goal and whether they are active.",
  inputSchema: {
    active_only: z.boolean().default(false).describe("Return only the active sprint(s)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ active_only }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    try {
      const workspaceId = await resolveWorkspaceId(supabase);
      let query = supabase
        .from("sprints")
        .select("id,name,goal,start_date,end_date,is_active")
        .eq("workspace_id", workspaceId)
        .order("start_date", { ascending: false });
      if (active_only) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? []) }],
        structuredContent: { sprints: data ?? [] },
      };
    } catch (err) {
      return { content: [{ type: "text", text: (err as Error).message }], isError: true };
    }
  },
});
