import { Badge } from "@/components/ui/badge";
import { BookOpen, ChartNoAxesCombined, ClipboardCheck, Columns3, Flag, Layers, ListChecks, Search, Settings, Sparkles, Users } from "lucide-react";

const featureSections = [
  {
    title: "Board",
    icon: Columns3,
    description: "A Kanban-style delivery board for tracking work from backlog through completion.",
    items: ["Status columns for backlog, to do, in progress, review, and done", "Ticket cards with priority, type, points, assignee, and epic context", "Ticket detail panel for editing metadata, comments, subtasks, and acceptance criteria", "Global search entry points for quickly opening work items"],
  },
  {
    title: "Backlog",
    icon: ListChecks,
    description: "A focused planning area for grooming future work before it enters a sprint.",
    items: ["Create and organize tickets", "Capture descriptions, acceptance criteria, story points, priority, and labels", "Assign team members and link work to epics", "Move eligible work into sprint planning"],
  },
  {
    title: "Sprint planning",
    icon: Flag,
    description: "Tools for shaping sprint scope, capacity, and delivery goals.",
    items: ["Create, start, complete, and delete sprints based on role permissions", "Set sprint goals, start dates, end dates, and team capacity", "Move tickets into and out of active sprint scope", "Capture sprint retrospective notes after completion"],
  },
  {
    title: "Epics",
    icon: Layers,
    description: "Higher-level product initiatives that group related work together.",
    items: ["Create and maintain epics", "Track target quarter, start date, end date, and color coding", "Connect tickets to product initiatives", "Use epic context across board, backlog, and roadmap views"],
  },
  {
    title: "Roadmap",
    icon: BookOpen,
    description: "A timeline view for understanding product direction across quarters.",
    items: ["Visualize epics on a quarterly roadmap", "Compare planned initiative timing", "Review delivery direction without editing ticket-level detail", "Support stakeholder-friendly planning conversations"],
  },
  {
    title: "Analytics",
    icon: ChartNoAxesCombined,
    description: "Delivery reporting for team performance and flow health.",
    items: ["Velocity reporting", "Burndown and sprint progress visibility", "Cycle-time and throughput views", "Role-accessible readouts for delivery stakeholders"],
  },
  {
    title: "UAT testing",
    icon: ClipboardCheck,
    description: "User acceptance testing workflows for validating completed work.",
    items: ["Create UAT test plans", "Add test cases with expected results and linked tickets", "Track pending, passed, failed, and blocked test case statuses", "Support product owner sign-off and QA-owned execution"],
  },
  {
    title: "Settings and team management",
    icon: Settings,
    description: "Administrative controls for workspace members, capacity, and platform roles.",
    items: ["View active team members", "Add, edit, deactivate, and assign members when permitted", "Assign platform roles from the dedicated role table", "Manage workspace planning settings such as sprint duration and point scale"],
  },
];

const roleRows = [
  ["Admin", "Full platform ownership across settings, members, roles, tickets, sprints, epics, roadmap, analytics, and UAT."],
  ["Product owner", "Owns backlog, product direction, sprint scope, epics, roadmap, priorities, acceptance criteria, and UAT sign-off."],
  ["Developer", "Works on delivery, updates assigned work, moves ticket status, comments, creates technical tickets, and views planning context."],
  ["QA tester", "Owns testing workflows, manages UAT, updates test results, creates bug tickets, comments, and reviews delivery status."],
  ["Viewer", "Read-only stakeholder access to progress, roadmap, board, backlog, analytics, and UAT."],
];

export function DocumentationView() {
  return (
    <section className="min-h-full bg-background px-6 py-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">Platform guide</Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Documentation</h1>
            </div>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            This page documents the core features and functionality available across the sprint board platform, including planning, delivery, reporting, testing, and administration workflows.
          </p>
          <div className="max-w-3xl rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-card-foreground">First-time setup after remixing</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              When you first remix this project, create your account and ask Lovable’s agent to assign that user as an admin. This gives the first real workspace user access to Settings, team management, roles, and platform configuration.
            </p>
          </div>
          <div className="max-w-3xl rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-card-foreground">Adding new users to the platform</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              An admin adds each person as a team member in Settings with their email address and platform role. The new user then signs up or logs in with that same email, and the platform links their account to the team member profile so the correct permissions are applied automatically.
            </p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <Users className="mb-3 h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-card-foreground">Role-based access</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Every signed-in platform role can view this documentation, while editing workflows remain permission controlled.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <Search className="mb-3 h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-card-foreground">Search-first navigation</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Global search helps users jump directly into tickets and continue work without losing context.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <Sparkles className="mb-3 h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-card-foreground">Real workspace data</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">The platform is ready for real tickets, team members, roles, sprints, epics, and UAT records.</p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2">
          {featureSections.map((section) => (
            <article key={section.title} className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <section.icon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-card-foreground">{section.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-card-foreground">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2 leading-6">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-card-foreground">Platform roles</h2>
          <div className="mt-4 divide-y divide-border">
            {roleRows.map(([role, description]) => (
              <div key={role} className="grid gap-2 py-3 md:grid-cols-[180px_1fr]">
                <p className="text-sm font-medium text-card-foreground">{role}</p>
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}