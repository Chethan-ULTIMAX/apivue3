export type TicketType = "bug" | "feature" | "task";
export type Priority = "P0" | "P1" | "P2";
export type TicketStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";
export type TicketLabel = "bug" | "feature" | "tech-debt" | "urgent" | "design" | "infra";
export type PlatformRole = "admin" | "product_owner" | "developer" | "qa_tester" | "viewer";

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  admin: "Admin",
  product_owner: "Product owner",
  developer: "Developer",
  qa_tester: "QA tester",
  viewer: "Viewer",
};

export const PLATFORM_ROLES = Object.keys(PLATFORM_ROLE_LABELS) as PlatformRole[];

export const LABEL_COLORS: Record<TicketLabel, string> = {
  bug: "bg-destructive/15 text-destructive border-destructive/30",
  feature: "bg-info/15 text-info border-info/30",
  "tech-debt": "bg-warning/15 text-warning border-warning/30",
  urgent: "bg-priority-p0/15 text-priority-p0 border-priority-p0/30",
  design: "bg-epic-auth/15 text-epic-auth border-epic-auth/30",
  infra: "bg-muted text-muted-foreground border-border",
};

export const ALL_LABELS: TicketLabel[] = ["bug", "feature", "tech-debt", "urgent", "design", "infra"];

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  role?: string;
  platformRole?: PlatformRole;
  availableDays?: number;
}

export interface Epic {
  id: string;
  name: string;
  color: string;
  targetQuarter?: string; // e.g. "Q1 2026", "Q2 2026"
  startDate?: string;
  endDate?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  userId: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  status: TicketStatus;
  type: TicketType;
  priority: Priority;
  storyPoints: number;
  assigneeId: string | null;
  epicId: string;
  sprintId: string | null;
  labels: TicketLabel[];
  subtasks: Subtask[];
  comments: Comment[];
  activity: ActivityEntry[];
  acceptanceCriteria?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  goal?: string;
}

export interface SprintRetro {
  sprintId: string;
  wentWell: string;
  didntGoWell: string;
  actionItems: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: "assigned" | "sprint_ending" | "sprint_completed";
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
  ticketId?: string;
}

export type UATTestCaseStatus = "pending" | "passed" | "failed" | "blocked";
export type UATTestPlanStatus = "draft" | "in_progress" | "completed" | "signed_off";

export interface UATTestCase {
  id: string;
  title: string;
  description: string;
  expectedResult: string;
  status: UATTestCaseStatus;
  testerId: string | null;
  notes: string;
  executedAt: string | null;
  linkedTicketId: string | null;
}

export interface UATTestPlan {
  id: string;
  name: string;
  description: string;
  sprintId: string | null;
  epicId: string | null;
  testCases: UATTestCase[];
  status: UATTestPlanStatus;
  createdAt: string;
  updatedAt: string;
  signedOffBy: string | null;
  signedOffAt: string | null;
}

export const COLUMNS: { key: TicketStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "in_review", label: "In Review" },
  { key: "done", label: "Done" },
];
