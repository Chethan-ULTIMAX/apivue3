import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { resolveWorkspaceId, supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_ticket",
  title: "Create ticket",
  description: "Create a new ticket (story) in the backlog with title, description and acceptance criteria.",
  inputSchema: {
    title: z.string().trim().min(3).max(200).describe("Short ticket title."),
    description: z.string().trim().min(1).describe("What needs to be done."),
    acceptance_criteria: z.string().trim().min(1).describe("What 'done' looks like."),
    type: z.enum(["bug", "feature", "task"]).default("task"),
    priority: z.enum(["P0", "P1", "P2"]).default("P2"),
    story_points: z.number().int().min(1).max(21).default(3),
    epic_id: z.string().uuid().optional().describe("Optional epic to attach the ticket to."),
    sprint_id: z.string().uuid().optional().describe("Optional sprint to attach the ticket to."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    try {
      const workspaceId = await resolveWorkspaceId(supabase);
      const { count } = await supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId);
      const ticketKey = `TICK-${100 + (count ?? 0) + 1}`;

      const { data, error } = await supabase
        .from("tickets")
        .insert({
          workspace_id: workspaceId,
          ticket_key: ticketKey,
          title: input.title,
          description: input.description,
          acceptance_criteria: input.acceptance_criteria,
          status: "backlog",
          type: input.type ?? "task",
          priority: input.priority ?? "P2",
          story_points: input.story_points ?? 3,
          epic_id: input.epic_id ?? null,
          sprint_id: input.sprint_id ?? null,
        })
        .select()
        .maybeSingle();
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
        structuredContent: { ticket: data },
      };
    } catch (err) {
      return { content: [{ type: "text", text: (err as Error).message }], isError: true };
    }
  },
});
