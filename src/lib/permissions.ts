import { PlatformRole, PLATFORM_ROLE_LABELS } from "@/lib/types";

export type AppPage = "board" | "backlog" | "planning" | "analytics" | "epics" | "roadmap" | "uat" | "documentation" | "settings";
export type AccessLevel = "Full" | "Limited" | "View" | "Read-only" | "No";
export type PermissionAction =
  | "create_ticket"
  | "edit_ticket"
  | "move_ticket"
  | "assign_ticket"
  | "move_ticket_to_sprint"
  | "delete_ticket"
  | "complete_sprint"
  | "create_sprint"
  | "start_sprint"
  | "delete_sprint"
  | "edit_capacity"
  | "create_epic"
  | "edit_epic"
  | "delete_epic"
  | "create_uat_plan"
  | "edit_uat_plan"
  | "update_test_case"
  | "sign_off_uat"
  | "delete_uat_plan"
  | "manage_members"
  | "assign_platform_role"
  | "comment_ticket";

export const roleDescriptions: Record<PlatformRole, string> = {
  admin: "Full platform owner. Can manage settings, members, roles, tickets, sprints, epics, roadmap, analytics, and UAT.",
  product_owner: "Owns backlog, product direction, sprint scope, priorities, epics, roadmap, acceptance criteria, and UAT sign-off.",
  developer: "Works on delivery. Can update assigned work, move ticket status, comment, create technical tickets, and view planning context.",
  qa_tester: "Owns testing. Can manage UAT, update test results, create bug tickets, comment, and review delivery status.",
  viewer: "Read-only stakeholder. Can view progress, roadmap, board, backlog, analytics, and UAT without editing.",
};

export const pageAccessMap: Record<AppPage, Record<PlatformRole, AccessLevel>> = {
  board: { admin: "Full", product_owner: "Full", developer: "Limited", qa_tester: "Limited", viewer: "Read-only" },
  backlog: { admin: "Full", product_owner: "Full", developer: "Limited", qa_tester: "Limited", viewer: "Read-only" },
  planning: { admin: "Full", product_owner: "Full", developer: "Limited", qa_tester: "View", viewer: "Read-only" },
  analytics: { admin: "Full", product_owner: "View", developer: "View", qa_tester: "View", viewer: "View" },
  epics: { admin: "Full", product_owner: "Full", developer: "View", qa_tester: "View", viewer: "Read-only" },
  roadmap: { admin: "Full", product_owner: "Full", developer: "View", qa_tester: "View", viewer: "View" },
  uat: { admin: "Full", product_owner: "View", developer: "View", qa_tester: "Full", viewer: "Read-only" },
  documentation: { admin: "View", product_owner: "View", developer: "View", qa_tester: "View", viewer: "View" },
  settings: { admin: "Full", product_owner: "Limited", developer: "No", qa_tester: "No", viewer: "No" },
};

export const pageLabels: Record<AppPage, string> = {
  board: "Board",
  backlog: "Backlog",
  planning: "Sprint planning",
  analytics: "Analytics",
  epics: "Epics",
  roadmap: "Roadmap",
  uat: "UAT testing",
  documentation: "Documentation",
  settings: "Settings",
};

export const routePageMap: Record<string, AppPage> = {
  "/dashboard": "board",
  "/dashboard/backlog": "backlog",
  "/dashboard/planning": "planning",
  "/dashboard/analytics": "analytics",
  "/dashboard/epics": "epics",
  "/dashboard/roadmap": "roadmap",
  "/dashboard/uat": "uat",
  "/dashboard/documentation": "documentation",
  "/dashboard/settings": "settings",
};

export const actionPermissionRows: { action: string; permissions: Record<PlatformRole, string> }[] = [
  { action: "View board, backlog, roadmap, analytics, and UAT", permissions: { admin: "Yes", product_owner: "Yes", developer: "Yes", qa_tester: "Yes", viewer: "Yes" } },
  { action: "Manage team members and assign platform roles", permissions: { admin: "Yes", product_owner: "No", developer: "No", qa_tester: "No", viewer: "No" } },
  { action: "Create, start, complete, and delete sprints", permissions: { admin: "Yes", product_owner: "Yes", developer: "No", qa_tester: "No", viewer: "No" } },
  { action: "Move tickets in or out of a sprint", permissions: { admin: "Yes", product_owner: "Yes", developer: "No", qa_tester: "No", viewer: "No" } },
  { action: "Create tickets", permissions: { admin: "Yes", product_owner: "Yes", developer: "Yes", qa_tester: "Bug only", viewer: "No" } },
  { action: "Edit ticket fields, priority, epic, and sprint", permissions: { admin: "Yes", product_owner: "Yes", developer: "Limited", qa_tester: "Testing only", viewer: "No" } },
  { action: "Move ticket status", permissions: { admin: "Yes", product_owner: "Yes", developer: "Assigned", qa_tester: "Testing", viewer: "No" } },
  { action: "Delete tickets", permissions: { admin: "Yes", product_owner: "Yes", developer: "No", qa_tester: "No", viewer: "No" } },
  { action: "Create, edit, and delete epics", permissions: { admin: "Yes", product_owner: "Yes", developer: "No", qa_tester: "No", viewer: "No" } },
  { action: "Create and manage UAT test plans", permissions: { admin: "Yes", product_owner: "View/sign off", developer: "View", qa_tester: "Yes", viewer: "No" } },
  { action: "Update test case status and tester notes", permissions: { admin: "Yes", product_owner: "No", developer: "No", qa_tester: "Yes", viewer: "No" } },
  { action: "Comment on tickets", permissions: { admin: "Yes", product_owner: "Yes", developer: "Yes", qa_tester: "Yes", viewer: "No" } },
];

const actionPermissions: Record<PermissionAction, PlatformRole[]> = {
  create_ticket: ["admin", "product_owner", "developer", "qa_tester"],
  edit_ticket: ["admin", "product_owner", "developer", "qa_tester"],
  move_ticket: ["admin", "product_owner", "developer", "qa_tester"],
  assign_ticket: ["admin", "product_owner", "developer"],
  move_ticket_to_sprint: ["admin", "product_owner"],
  delete_ticket: ["admin", "product_owner"],
  complete_sprint: ["admin", "product_owner"],
  create_sprint: ["admin", "product_owner"],
  start_sprint: ["admin", "product_owner"],
  delete_sprint: ["admin", "product_owner"],
  edit_capacity: ["admin", "product_owner"],
  create_epic: ["admin", "product_owner"],
  edit_epic: ["admin", "product_owner"],
  delete_epic: ["admin", "product_owner"],
  create_uat_plan: ["admin", "qa_tester"],
  edit_uat_plan: ["admin", "qa_tester"],
  update_test_case: ["admin", "qa_tester"],
  sign_off_uat: ["admin", "product_owner"],
  delete_uat_plan: ["admin", "product_owner", "qa_tester"],
  manage_members: ["admin"],
  assign_platform_role: ["admin"],
  comment_ticket: ["admin", "product_owner", "developer", "qa_tester"],
};

export function canAccessPage(role: PlatformRole, page: AppPage) {
  return pageAccessMap[page][role] !== "No";
}

export function can(role: PlatformRole, action: PermissionAction) {
  return actionPermissions[action].includes(role);
}

export function getRoleLabel(role: PlatformRole) {
  return PLATFORM_ROLE_LABELS[role];
}
