import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { resolveWorkspaceId, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_ticket",
  title: "Get ticket",
  description: "Fetch one ticket with its description, acceptance criteria, labels and comments.",
  inputSchema: {
    ticket: z.string().min(1).describe("Ticket id (uuid) or ticket key such as AUTH-101."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ ticket }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    try {
      const workspaceId = await resolveWorkspaceId(supabase);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticket);
      const { data: row, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq(isUuid ? "id" : "ticket_key", ticket)
        .maybeSingle();
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      if (!row) return { content: [{ type: "text", text: `Ticket not found: ${ticket}` }], isError: true };

      const [labels, comments] = await Promise.all([
        supabase.from("ticket_labels").select("label").eq("ticket_id", row.id),
        supabase
          .from("comments")
          .select("id,content,created_at,author_id")
          .eq("ticket_id", row.id)
          .order("created_at", { ascending: true }),
      ]);
      const result = {
        ...row,
        labels: (labels.data ?? []).map((l: { label: string }) => l.label),
        comments: comments.data ?? [],
      };
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: { ticket: result },
      };
    } catch (err) {
      return { content: [{ type: "text", text: (err as Error).message }], isError: true };
    }
  },
});
