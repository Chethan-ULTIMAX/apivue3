import { create } from "zustand";
import { Ticket, TicketStatus, Sprint, TeamMember, Epic, Comment, Notification, SprintRetro, TicketLabel, UATTestPlan, UATTestCase, UATTestCaseStatus } from "./types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const db: any = supabase;

const reportError = (label: string, error: any) => {
  console.error(`[store] ${label} failed:`, error);
  toast.error(`Failed to save: ${error?.message || label}`);
};

interface AppState {
  workspaceId: string | null;
  currentMemberId: string | null;
  tickets: Ticket[];
  sprints: Sprint[];
  members: TeamMember[];
  epics: Epic[];
  activeSprint: Sprint | null;
  notifications: Notification[];
  retros: SprintRetro[];
  uatPlans: UATTestPlan[];
  loading: boolean;

  setWorkspaceId: (id: string | null) => void;
  setCurrentMemberId: (id: string | null) => void;

  moveTicket: (ticketId: string, newStatus: TicketStatus) => void;
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  addTicket: (ticket: Ticket) => void;
  deleteTicket: (ticketId: string) => void;
  assignToSprint: (ticketId: string, sprintId: string | null) => void;
  addComment: (ticketId: string, comment: Comment) => void;
  toggleSubtask: (ticketId: string, subtaskId: string) => void;
  completeSprint: (sprintId: string) => void;
  startSprint: (sprintId: string) => void;
  createSprint: (sprint: Sprint) => void;
  updateSprint: (sprintId: string, updates: Partial<Sprint>) => void;
  deleteSprint: (sprintId: string) => void;
  addEpic: (epic: Epic) => void;
  updateEpic: (epicId: string, updates: Partial<Epic>) => void;
  deleteEpic: (epicId: string) => void;
  addMember: (member: TeamMember) => void;
  updateMember: (memberId: string, updates: Partial<TeamMember>) => void;
  removeMember: (memberId: string) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  saveRetro: (retro: SprintRetro) => void;
  toggleLabel: (ticketId: string, label: TicketLabel) => void;
  addUATTestPlan: (plan: UATTestPlan) => void;
  updateUATTestPlan: (planId: string, updates: Partial<UATTestPlan>) => void;
  deleteUATTestPlan: (planId: string) => void;
  updateTestCase: (planId: string, caseId: string, updates: Partial<UATTestCase>) => void;
  signOffUATPlan: (planId: string, memberId: string) => void;
}

// ---------- persistence helpers ----------
const ticketToDb = (t: Partial<Ticket>) => {
  const row: any = {};
  if (t.id !== undefined) row.id = t.id;
  if (t.ticketId !== undefined) row.ticket_key = t.ticketId;
  if (t.title !== undefined) row.title = t.title;
  if (t.description !== undefined) row.description = t.description;
  if (t.acceptanceCriteria !== undefined) row.acceptance_criteria = t.acceptanceCriteria || null;
  if (t.status !== undefined) row.status = t.status;
  if (t.type !== undefined) row.type = t.type;
  if (t.priority !== undefined) row.priority = t.priority;
  if (t.storyPoints !== undefined) row.story_points = t.storyPoints;
  if (t.assigneeId !== undefined) row.assignee_id = t.assigneeId;
  if (t.epicId !== undefined) row.epic_id = t.epicId || null;
  if (t.sprintId !== undefined) row.sprint_id = t.sprintId;
  if (t.completedAt !== undefined) row.completed_at = t.completedAt || null;
  return row;
};

const syncTicketLabels = (workspaceId: string, ticketId: string, prev: TicketLabel[], next: TicketLabel[]) => {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  const toAdd = next.filter((l) => !prevSet.has(l));
  const toRemove = prev.filter((l) => !nextSet.has(l));
  if (toAdd.length > 0) {
    db.from("ticket_labels").insert(toAdd.map((label) => ({ workspace_id: workspaceId, ticket_id: ticketId, label })))
      .then(({ error }: any) => error && reportError("addLabels", error));
  }
  if (toRemove.length > 0) {
    db.from("ticket_labels").delete().eq("ticket_id", ticketId).in("label", toRemove)
      .then(({ error }: any) => error && reportError("removeLabels", error));
  }
};

const epicToDb = (e: Partial<Epic>) => {
  const row: any = {};
  if (e.id !== undefined) row.id = e.id;
  if (e.name !== undefined) row.name = e.name;
  if (e.color !== undefined) row.color = e.color;
  if (e.targetQuarter !== undefined) row.target_quarter = e.targetQuarter || null;
  if (e.startDate !== undefined) row.start_date = e.startDate || null;
  if (e.endDate !== undefined) row.end_date = e.endDate || null;
  return row;
};

const sprintToDb = (s: Partial<Sprint>) => {
  const row: any = {};
  if (s.id !== undefined) row.id = s.id;
  if (s.name !== undefined) row.name = s.name;
  if (s.startDate !== undefined) row.start_date = s.startDate;
  if (s.endDate !== undefined) row.end_date = s.endDate;
  if (s.isActive !== undefined) row.is_active = s.isActive;
  if (s.goal !== undefined) row.goal = s.goal || null;
  return row;
};

const uatCaseToDb = (tc: Partial<UATTestCase>) => {
  const row: any = {};
  if (tc.id !== undefined) row.id = tc.id;
  if (tc.title !== undefined) row.title = tc.title;
  if (tc.description !== undefined) row.description = tc.description;
  if (tc.expectedResult !== undefined) row.expected_result = tc.expectedResult;
  if (tc.status !== undefined) row.status = tc.status;
  if (tc.testerId !== undefined) row.tester_id = tc.testerId;
  if (tc.notes !== undefined) row.notes = tc.notes;
  if (tc.executedAt !== undefined) row.executed_at = tc.executedAt;
  if (tc.linkedTicketId !== undefined) row.linked_ticket_id = tc.linkedTicketId;
  return row;
};

// Fire-and-forget: record an activity entry both in the store and in the DB.
// The row is attributed to the current member so the UI can render the actor's name.
const logActivity = (
  set: any,
  get: () => AppState,
  ticketId: string,
  action: string,
) => {
  const workspaceId = get().workspaceId;
  const memberId = get().currentMemberId;
  if (!workspaceId || !memberId) return;
  const entry = { id: crypto.randomUUID(), action, userId: memberId, createdAt: new Date().toISOString() };
  set((state: AppState) => ({
    tickets: state.tickets.map((t) =>
      t.id === ticketId ? { ...t, activity: [...(t.activity || []), entry] } : t
    ),
  }));
  db.from("activity_entries").insert({
    id: entry.id, workspace_id: workspaceId, ticket_id: ticketId,
    actor_id: memberId, action,
  }).then(({ error }: any) => error && reportError("logActivity", error));
};


export const useStore = create<AppState>((set, get) => ({
  workspaceId: null,
  currentMemberId: null,
  tickets: [],
  sprints: [],
  members: [],
  epics: [],
  activeSprint: null,
  notifications: [],
  retros: [],
  uatPlans: [],
  loading: false,

  setWorkspaceId: (id) => set({ workspaceId: id }),
  setCurrentMemberId: (id) => set({ currentMemberId: id }),


  moveTicket: (ticketId, newStatus) => {
    const ticket = get().tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === newStatus) return;
    const completedAt = newStatus === "done" ? new Date().toISOString() : ticket.completedAt;
    set({
      tickets: get().tickets.map((t) =>
        t.id === ticketId ? { ...t, status: newStatus, completedAt } : t
      ),
    });
    toast.success(`Ticket moved to ${newStatus.replace("_", " ")}`);
    db.from("tickets").update({ status: newStatus, completed_at: completedAt ?? null }).eq("id", ticketId)
      .then(({ error }: any) => error && reportError("moveTicket", error));
    logActivity(set, get, ticketId, `moved to ${newStatus.replace("_", " ")}`);
  },

  updateTicket: (ticketId, updates) => {
    const prev = get().tickets.find((t) => t.id === ticketId);
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? { ...t, ...updates } : t)),
    }));
    const row = ticketToDb(updates);
    if (Object.keys(row).length > 0) {
      db.from("tickets").update(row).eq("id", ticketId)
        .then(({ error }: any) => error && reportError("updateTicket", error));
    }
    if (updates.labels && prev) {
      const workspaceId = get().workspaceId;
      if (workspaceId) syncTicketLabels(workspaceId, ticketId, prev.labels || [], updates.labels);
    }
    logActivity(set, get, ticketId, "updated");
  },

  addTicket: (ticket) => {
    set((state) => ({ tickets: [...state.tickets, ticket] }));
    toast.success("Ticket created");
    const workspaceId = get().workspaceId;
    if (!workspaceId) { reportError("addTicket", new Error("Workspace not loaded")); return; }
    const row = { ...ticketToDb(ticket), workspace_id: workspaceId };
    db.from("tickets").insert(row)
      .then(({ error }: any) => error && reportError("addTicket", error));
    if (ticket.labels && ticket.labels.length > 0) {
      syncTicketLabels(workspaceId, ticket.id, [], ticket.labels);
    }
    logActivity(set, get, ticket.id, "created");
  },


  deleteTicket: (ticketId) => {
    set((state) => ({ tickets: state.tickets.filter((t) => t.id !== ticketId) }));
    toast.success("Ticket deleted");
    db.from("tickets").delete().eq("id", ticketId)
      .then(({ error }: any) => error && reportError("deleteTicket", error));
  },

  assignToSprint: (ticketId, sprintId) => {
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? { ...t, sprintId } : t)),
    }));
    db.from("tickets").update({ sprint_id: sprintId }).eq("id", ticketId)
      .then(({ error }: any) => error && reportError("assignToSprint", error));
    logActivity(set, get, ticketId, sprintId ? "assigned to sprint" : "removed from sprint");
  },

  addComment: (ticketId, comment) => {
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId ? { ...t, comments: [...(t.comments || []), comment] } : t
      ),
    }));
    const workspaceId = get().workspaceId;
    if (!workspaceId) { reportError("addComment", new Error("Workspace not loaded")); return; }
    db.from("comments").insert({
      id: comment.id, workspace_id: workspaceId, ticket_id: ticketId,
      author_id: comment.authorId, content: comment.content,
    }).then(({ error }: any) => error && reportError("addComment", error));
    logActivity(set, get, ticketId, "commented on");
  },



  toggleSubtask: (ticketId, subtaskId) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, subtasks: (t.subtasks || []).map((st) => st.id === subtaskId ? { ...st, completed: !st.completed } : st) }
          : t
      ),
    })),

  completeSprint: (sprintId) => {
    const state = get();
    const updatedSprints = state.sprints.map((s) => s.id === sprintId ? { ...s, isActive: false } : s);
    const updatedTickets = state.tickets.map((t) =>
      t.sprintId === sprintId && t.status !== "done"
        ? { ...t, sprintId: null, status: "backlog" as TicketStatus }
        : t
    );
    const sprint = state.sprints.find((s) => s.id === sprintId);
    const newNotification: Notification = {
      id: `n-${Date.now()}`, type: "sprint_completed", title: "Sprint completed",
      description: `${sprint?.name || "Sprint"} has been completed`, read: false,
      createdAt: new Date().toISOString(),
    };
    set({ sprints: updatedSprints, tickets: updatedTickets, activeSprint: null, notifications: [newNotification, ...state.notifications] });
    toast.success("Sprint completed! Incomplete tickets moved to backlog.");
    db.from("sprints").update({ is_active: false }).eq("id", sprintId)
      .then(({ error }: any) => error && reportError("completeSprint:sprint", error));
    db.from("tickets").update({ sprint_id: null, status: "backlog" })
      .eq("sprint_id", sprintId).neq("status", "done")
      .then(({ error }: any) => error && reportError("completeSprint:tickets", error));
  },

  startSprint: (sprintId) => {
    const workspaceId = get().workspaceId;
    set((state) => {
      const updatedSprints = state.sprints.map((s) => ({ ...s, isActive: s.id === sprintId }));
      return { sprints: updatedSprints, activeSprint: updatedSprints.find((s) => s.id === sprintId) || null };
    });
    if (!workspaceId) return;
    (async () => {
      const { error: e1 } = await db.from("sprints").update({ is_active: false }).eq("workspace_id", workspaceId);
      if (e1) return reportError("startSprint:deactivate", e1);
      const { error: e2 } = await db.from("sprints").update({ is_active: true }).eq("id", sprintId);
      if (e2) reportError("startSprint:activate", e2);
    })();
  },

  createSprint: (sprint) => {
    set((state) => ({ sprints: [...state.sprints, sprint] }));
    toast.success(`${sprint.name} created`);
    const workspaceId = get().workspaceId;
    if (!workspaceId) { reportError("createSprint", new Error("Workspace not loaded")); return; }
    db.from("sprints").insert({ ...sprintToDb(sprint), workspace_id: workspaceId })
      .then(({ error }: any) => error && reportError("createSprint", error));
  },

  updateSprint: (sprintId, updates) => {
    set((state) => ({
      sprints: state.sprints.map((s) => (s.id === sprintId ? { ...s, ...updates } : s)),
      activeSprint: state.activeSprint?.id === sprintId ? { ...state.activeSprint, ...updates } : state.activeSprint,
    }));
    const row = sprintToDb(updates);
    if (Object.keys(row).length === 0) return;
    db.from("sprints").update(row).eq("id", sprintId)
      .then(({ error }: any) => error && reportError("updateSprint", error));
  },

  deleteSprint: (sprintId) => {
    set((state) => ({
      sprints: state.sprints.filter((s) => s.id !== sprintId),
      tickets: state.tickets.map((t) => t.sprintId === sprintId ? { ...t, sprintId: null } : t),
      activeSprint: state.activeSprint?.id === sprintId ? null : state.activeSprint,
    }));
    toast.success("Sprint deleted");
    db.from("tickets").update({ sprint_id: null }).eq("sprint_id", sprintId)
      .then(({ error }: any) => error && reportError("deleteSprint:tickets", error));
    db.from("sprints").delete().eq("id", sprintId)
      .then(({ error }: any) => error && reportError("deleteSprint", error));
  },

  addEpic: (epic) => {
    set((state) => ({ epics: [...state.epics, epic] }));
    toast.success(`Epic "${epic.name}" created`);
    const workspaceId = get().workspaceId;
    if (!workspaceId) { reportError("addEpic", new Error("Workspace not loaded")); return; }
    db.from("epics").insert({ ...epicToDb(epic), workspace_id: workspaceId })
      .then(({ error }: any) => error && reportError("addEpic", error));
  },

  updateEpic: (epicId, updates) => {
    set((state) => ({
      epics: state.epics.map((e) => (e.id === epicId ? { ...e, ...updates } : e)),
    }));
    const row = epicToDb(updates);
    if (Object.keys(row).length === 0) return;
    db.from("epics").update(row).eq("id", epicId)
      .then(({ error }: any) => error && reportError("updateEpic", error));
  },

  deleteEpic: (epicId) => {
    set((state) => ({ epics: state.epics.filter((e) => e.id !== epicId) }));
    toast.success("Epic deleted");
    db.from("epics").delete().eq("id", epicId)
      .then(({ error }: any) => error && reportError("deleteEpic", error));
  },

  addMember: (member) => {
    set((state) => ({ members: [...state.members, member] }));
    toast.success(`${member.name} added to the team`);
  },

  updateMember: (memberId, updates) =>
    set((state) => ({
      members: state.members.map((m) => (m.id === memberId ? { ...m, ...updates } : m)),
    })),

  removeMember: (memberId) => {
    const member = get().members.find((m) => m.id === memberId);
    set((state) => ({ members: state.members.filter((m) => m.id !== memberId) }));
    toast.success(`${member?.name || "Member"} removed from team`);
  },

  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  saveRetro: (retro) => {
    set((state) => ({ retros: [...state.retros, retro] }));
    toast.success("Sprint retrospective saved");
  },

  toggleLabel: (ticketId, label) => {
    const ticket = get().tickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    const has = (ticket.labels || []).includes(label);
    const nextLabels = has ? ticket.labels.filter((l) => l !== label) : [...(ticket.labels || []), label];
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === ticketId ? { ...t, labels: nextLabels } : t)),
    }));
    const workspaceId = get().workspaceId;
    if (workspaceId) syncTicketLabels(workspaceId, ticketId, ticket.labels || [], nextLabels);
  },

  addUATTestPlan: (plan) => {
    set((state) => ({ uatPlans: [...state.uatPlans, plan] }));
    toast.success("Test plan created");
    const workspaceId = get().workspaceId;
    if (!workspaceId) { reportError("addUATTestPlan", new Error("Workspace not loaded")); return; }
    (async () => {
      const { error: e1 } = await db.from("uat_test_plans").insert({
        id: plan.id, workspace_id: workspaceId, name: plan.name,
        description: plan.description, sprint_id: plan.sprintId, epic_id: plan.epicId,
        status: plan.status,
      });
      if (e1) return reportError("addUATTestPlan", e1);
      if (plan.testCases.length > 0) {
        const rows = plan.testCases.map((tc, idx) => ({
          ...uatCaseToDb(tc), workspace_id: workspaceId, plan_id: plan.id, sort_order: idx,
        }));
        const { error: e2 } = await db.from("uat_test_cases").insert(rows);
        if (e2) reportError("addUATTestPlan:cases", e2);
      }
    })();
  },

  updateUATTestPlan: (planId, updates) => {
    set((state) => ({
      uatPlans: state.uatPlans.map((p) => (p.id === planId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)),
    }));
    const row: any = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.sprintId !== undefined) row.sprint_id = updates.sprintId;
    if (updates.epicId !== undefined) row.epic_id = updates.epicId;
    if (updates.status !== undefined) row.status = updates.status;
    if (Object.keys(row).length === 0) return;
    db.from("uat_test_plans").update(row).eq("id", planId)
      .then(({ error }: any) => error && reportError("updateUATTestPlan", error));
  },

  deleteUATTestPlan: (planId) => {
    set((state) => ({ uatPlans: state.uatPlans.filter((p) => p.id !== planId) }));
    toast.success("Test plan deleted");
    db.from("uat_test_plans").delete().eq("id", planId)
      .then(({ error }: any) => error && reportError("deleteUATTestPlan", error));
  },

  updateTestCase: (planId, caseId, updates) => {
    set((state) => ({
      uatPlans: state.uatPlans.map((p) =>
        p.id === planId
          ? { ...p, updatedAt: new Date().toISOString(),
              testCases: p.testCases.map((tc) => (tc.id === caseId ? { ...tc, ...updates } : tc)) }
          : p
      ),
    }));
    const row = uatCaseToDb(updates);
    if (Object.keys(row).length === 0) return;
    db.from("uat_test_cases").update(row).eq("id", caseId)
      .then(({ error }: any) => error && reportError("updateTestCase", error));
  },

  signOffUATPlan: (planId, memberId) => {
    const signedOffAt = new Date().toISOString();
    set((state) => ({
      uatPlans: state.uatPlans.map((p) =>
        p.id === planId
          ? { ...p, status: "signed_off", signedOffBy: memberId, signedOffAt, updatedAt: signedOffAt }
          : p
      ),
    }));
    db.from("uat_test_plans").update({ status: "signed_off", signed_off_by: memberId, signed_off_at: signedOffAt }).eq("id", planId)
      .then(({ error }: any) => error && reportError("signOffUATPlan", error));
  },
}));
