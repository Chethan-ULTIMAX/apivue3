import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import type { ActivityEntry, Comment, Epic, Sprint, Ticket, TeamMember, UATTestPlan, UATTestCase } from "@/lib/types";


const WORKSPACE_SLUG = "default";

async function fetchWorkspaceId(): Promise<string | null> {
  const { data } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", WORKSPACE_SLUG)
    .maybeSingle();
  return (data as any)?.id ?? null;
}

export function useWorkspaceData() {
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    (async () => {
      const workspaceId = await fetchWorkspaceId();
      if (!workspaceId || cancelled) return;
      useStore.getState().setWorkspaceId(workspaceId);

      const db: any = supabase;
      const [epicsRes, ticketsRes, sprintsRes, membersRes, plansRes, casesRes, labelsRes, commentsRes, activityRes] = await Promise.all([
        db.from("epics").select("*").eq("workspace_id", workspaceId).order("sort_order", { ascending: true }),
        db.from("tickets").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
        db.from("sprints").select("*").eq("workspace_id", workspaceId).order("start_date", { ascending: false }),
        db.from("team_members").select("id,user_id,name,avatar,email,job_title,available_days").eq("workspace_id", workspaceId).eq("is_active", true).order("name"),
        db.from("uat_test_plans").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
        db.from("uat_test_cases").select("*").eq("workspace_id", workspaceId).order("sort_order", { ascending: true }),
        db.from("ticket_labels").select("ticket_id,label").eq("workspace_id", workspaceId),
        db.from("comments").select("id,ticket_id,author_id,content,created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
        db.from("activity_entries").select("id,ticket_id,actor_id,action,created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
      ]);




      if (cancelled) return;

      const epics: Epic[] = (epicsRes.data ?? []).map((e: any) => ({
        id: e.id, name: e.name, color: e.color,
        targetQuarter: e.target_quarter ?? undefined,
        startDate: e.start_date ?? undefined, endDate: e.end_date ?? undefined,
      }));

      const sprints: Sprint[] = (sprintsRes.data ?? []).map((s: any) => ({
        id: s.id, name: s.name, startDate: s.start_date, endDate: s.end_date,
        isActive: !!s.is_active, goal: s.goal ?? undefined,
      }));

      const labelsByTicket: Record<string, string[]> = {};
      (labelsRes.data ?? []).forEach((r: any) => {
        (labelsByTicket[r.ticket_id] = labelsByTicket[r.ticket_id] || []).push(r.label);
      });

      const commentsByTicket: Record<string, Comment[]> = {};
      (commentsRes.data ?? []).forEach((c: any) => {
        (commentsByTicket[c.ticket_id] = commentsByTicket[c.ticket_id] || []).push({
          id: c.id, authorId: c.author_id, content: c.content, createdAt: c.created_at,
        });
      });

      const activityByTicket: Record<string, ActivityEntry[]> = {};
      (activityRes.data ?? []).forEach((a: any) => {
        (activityByTicket[a.ticket_id] = activityByTicket[a.ticket_id] || []).push({
          id: a.id, action: a.action, userId: a.actor_id, createdAt: a.created_at,
        });
      });

      const tickets: Ticket[] = (ticketsRes.data ?? []).map((t: any) => ({
        id: t.id, ticketId: t.ticket_key, title: t.title, description: t.description ?? "",
        status: t.status, type: t.type, priority: t.priority,
        storyPoints: t.story_points ?? 0, assigneeId: t.assignee_id,
        epicId: t.epic_id ?? "", sprintId: t.sprint_id, labels: (labelsByTicket[t.id] ?? []) as any,
        subtasks: [], comments: commentsByTicket[t.id] ?? [], activity: activityByTicket[t.id] ?? [],

        acceptanceCriteria: t.acceptance_criteria ?? undefined,
        createdAt: t.created_at, completedAt: t.completed_at ?? undefined,
      }));


      const members: TeamMember[] = (membersRes.data ?? []).map((m: any) => ({
        id: m.id, name: m.name, avatar: m.avatar, email: m.email,
        role: m.job_title, availableDays: m.available_days ?? 10,
      }));

      const currentMember = (membersRes.data ?? []).find((m: any) => m.user_id === user.id);

      const casesByPlan: Record<string, UATTestCase[]> = {};
      (casesRes.data ?? []).forEach((c: any) => {
        const tc: UATTestCase = {
          id: c.id, title: c.title, description: c.description ?? "",
          expectedResult: c.expected_result ?? "", status: c.status,
          testerId: c.tester_id, notes: c.notes ?? "",
          executedAt: c.executed_at, linkedTicketId: c.linked_ticket_id,
        };
        (casesByPlan[c.plan_id] = casesByPlan[c.plan_id] || []).push(tc);
      });

      const uatPlans: UATTestPlan[] = (plansRes.data ?? []).map((p: any) => ({
        id: p.id, name: p.name, description: p.description ?? "",
        sprintId: p.sprint_id, epicId: p.epic_id,
        testCases: casesByPlan[p.id] ?? [],
        status: p.status, createdAt: p.created_at, updatedAt: p.updated_at,
        signedOffBy: p.signed_off_by, signedOffAt: p.signed_off_at,
      }));

      useStore.setState({
        epics, sprints, tickets, members, uatPlans,
        currentMemberId: currentMember?.id ?? null,
        activeSprint: sprints.find((s) => s.isActive) ?? null,
      });

    })();

    return () => { cancelled = true; };
  }, [user, authLoading]);
}
