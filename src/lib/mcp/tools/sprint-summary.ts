import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { resolveWorkspaceId, supabaseForUser } from "../supabase";

type Row = { status: string; story_points: number | null };

export default defineTool({
  name: "sprint_summary",
  title: "Sprint summary",
  description: "Summarise a sprint: ticket counts and story points by status, plus completion percentage.",
  inputSchema: {
    sprint_id: z.string().uuid().optional().describe("Sprint id. Defaults to the active sprint."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ sprint_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    try {
      const workspaceId = await resolveWorkspaceId(supabase);
      let sprintId = sprint_id;
      let sprintName: string | null = null;
      if (!sprintId) {
        const { data } = await supabase
          .from("sprints")
          .select("id,name")
          .eq("workspace_id", workspaceId)
          .eq("is_active", true)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!data) return { content: [{ type: "text", text: "No active sprint found" }], isError: true };
        sprintId = data.id as string;
        sprintName = data.name as string;
      }

      const { data, error } = await supabase
        .from("tickets")
        .select("status,story_points")
        .eq("workspace_id", workspaceId)
        .eq("sprint_id", sprintId);
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };

      const rows = (data ?? []) as Row[];
      const byStatus: Record<string, { tickets: number; points: number }> = {};
      let totalPoints = 0;
      let donePoints = 0;
      for (const r of rows) {
        const pts = r.story_points ?? 0;
        byStatus[r.status] ??= { tickets: 0, points: 0 };
        byStatus[r.status].tickets += 1;
        byStatus[r.status].points += pts;
        totalPoints += pts;
        if (r.status === "done") donePoints += pts;
      }
      const summary = {
        sprint_id: sprintId,
        sprint_name: sprintName,
        total_tickets: rows.length,
        total_points: totalPoints,
        done_points: donePoints,
        completion_percent: totalPoints ? Math.round((donePoints / totalPoints) * 100) : 0,
        by_status: byStatus,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(summary) }],
        structuredContent: { summary },
      };
    } catch (err) {
      return { content: [{ type: "text", text: (err as Error).message }], isError: true };
    }
  },
});
