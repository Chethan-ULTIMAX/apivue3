import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { resolveWorkspaceId, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_tickets",
  title: "List tickets",
  description:
    "List tickets (stories) in the workspace, optionally filtered by status, type, priority, epic, or sprint.",
  inputSchema: {
    status: z.enum(["backlog", "todo", "in_progress", "in_review", "done"]).optional()
      .describe("Filter by workflow status."),
    type: z.enum(["bug", "feature", "task"]).optional().describe("Filter by ticket type."),
    priority: z.enum(["P0", "P1", "P2"]).optional().describe("Filter by priority."),
    epic_id: z.string().uuid().optional().describe("Filter by epic id."),
    sprint_id: z.string().uuid().optional().describe("Filter by sprint id."),
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum rows to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, type, priority, epic_id, sprint_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    try {
      const workspaceId = await resolveWorkspaceId(supabase);
      let query = supabase
        .from("tickets")
        .select("id,ticket_key,title,status,type,priority,story_points,epic_id,sprint_id,assignee_id,created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(limit ?? 25);
      if (status) query = query.eq("status", status);
      if (type) query = query.eq("type", type);
      if (priority) query = query.eq("priority", priority);
      if (epic_id) query = query.eq("epic_id", epic_id);
      if (sprint_id) query = query.eq("sprint_id", sprint_id);
      const { data, error } = await query;
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? []) }],
        structuredContent: { tickets: data ?? [] },
      };
    } catch (err) {
      return { content: [{ type: "text", text: (err as Error).message }], isError: true };
    }
  },
});
