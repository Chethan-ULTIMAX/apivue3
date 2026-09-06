import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { resolveWorkspaceId, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_epics",
  title: "List epics",
  description: "List the workspace epics with their target quarter and dates.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(50).describe("Maximum rows to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    try {
      const workspaceId = await resolveWorkspaceId(supabase);
      const { data, error } = await supabase
        .from("epics")
        .select("id,name,color,target_quarter,start_date,end_date,sort_order")
        .eq("workspace_id", workspaceId)
        .order("sort_order", { ascending: true })
        .limit(limit ?? 50);
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? []) }],
        structuredContent: { epics: data ?? [] },
      };
    } catch (err) {
      return { content: [{ type: "text", text: (err as Error).message }], isError: true };
    }
  },
});
