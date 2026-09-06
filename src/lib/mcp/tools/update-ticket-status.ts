import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { resolveWorkspaceId, supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_ticket_status",
  title: "Update ticket status",
  description: "Move a ticket to another workflow status (backlog, todo, in_progress, in_review, done).",
  inputSchema: {
    ticket: z.string().min(1).describe("Ticket id (uuid) or ticket key such as AUTH-101."),
    status: z.enum(["backlog", "todo", "in_progress", "in_review", "done"]),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ ticket, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    try {
      const workspaceId = await resolveWorkspaceId(supabase);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticket);
      const { data, error } = await supabase
        .from("tickets")
        .update({
          status,
          completed_at: status === "done" ? new Date().toISOString() : null,
        })
        .eq("workspace_id", workspaceId)
        .eq(isUuid ? "id" : "ticket_key", ticket)
        .select("id,ticket_key,title,status,completed_at")
        .maybeSingle();
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      if (!data) return { content: [{ type: "text", text: `Ticket not found: ${ticket}` }], isError: true };
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
        structuredContent: { ticket: data },
      };
    } catch (err) {
      return { content: [{ type: "text", text: (err as Error).message }], isError: true };
    }
  },
});
