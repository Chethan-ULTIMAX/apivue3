
<h1>Backend tables, real data storage, and role permissions plan</h1>

<h2>Current audit result</h2>

<p>Right now, the app does not have the real data tables needed for the board, backlog, sprint planning, analytics, roadmap, UAT testing, or settings.</p>

<p>The current app is using seeded in-memory data from the frontend store. That means tickets, sprints, epics, team members, UAT plans, comments, notifications, retrospectives, and settings are not truly persisted yet.</p>

<h3>What is currently missing</h3>

<pre><code>Area                  Current state                         Needed for real data
Board                 In-memory tickets and sprints          Backend tickets, statuses, comments, labels, subtasks
Backlog               In-memory tickets                      Backend tickets with sprint_id null
Sprint planning       In-memory sprints and capacity         Backend sprints, assignments, capacity, retros
Analytics             Derived from in-memory data            Backend-backed tickets and sprints; no separate table required yet
Roadmap               In-memory epics                        Backend epics with dates and target quarters
UAT testing           In-memory UAT plans                    Backend UAT plans and test cases
Settings              In-memory members and role map         Backend team members, user roles, workspace settings
Permissions           UI-only role checks                    Backend-enforced policies and secure permission checks</code></pre>

<h3>Important issue found</h3>

<p>The current role resolution falls back to <code>admin</code> when a logged-in user does not match a team member. For real data, this must be changed to <code>viewer</code> or a restricted state so unmatched users do not accidentally receive admin-level access.</p>

<h2>What will be built</h2>

<h3>1. Real backend schema for the platform</h3>

<p>I will add the backend tables needed to support all current pages with real persisted data.</p>

<pre><code>Core tables
- profiles
- workspaces
- team_members
- user_roles
- workspace_settings

Delivery tables
- epics
- sprints
- sprint_capacity
- sprint_retros
- tickets
- ticket_labels
- subtasks
- comments
- activity_entries
- notifications

UAT tables
- uat_test_plans
- uat_test_cases</code></pre>

<h3>2. Page-to-table mapping</h3>

<pre><code>Page                  Tables used
Board                 tickets, ticket_labels, subtasks, comments, activity_entries, sprints, epics, team_members
Backlog               tickets, ticket_labels, epics, team_members, sprints
Sprint planning       tickets, sprints, sprint_capacity, team_members, sprint_retros
Analytics             tickets, sprints, team_members
Roadmap               epics, tickets
UAT testing           uat_test_plans, uat_test_cases, tickets, sprints, epics, team_members
Settings              team_members, user_roles, workspace_settings</code></pre>

<p>Analytics will stay computed from real ticket and sprint data for now. A separate analytics snapshot table is not necessary yet unless we later need historical metric locking or scheduled reporting.</p>

<h2>Role and permission storage</h2>

<p>Roles will be stored in a dedicated role table, separate from profiles and team members. This avoids privilege escalation issues and keeps the permission model secure.</p>

<h3>Roles</h3>

<pre><code>admin
product_owner
developer
qa_tester
viewer</code></pre>

<h3>Backend role model</h3>

<pre><code>team_members
- Stores member identity, email, display name, avatar, job title, available days, workspace membership

user_roles
- Stores role assignments only
- Separate from team_members and profiles
- Used by backend permission checks</code></pre>

<h2>Backend-enforced permission model</h2>

<p>I will keep the visible settings permission maps, but the actual write permissions will also be enforced in the backend so users cannot bypass them from the browser.</p>

<h3>Page-level access</h3>

<pre><code>Page                  Admin  Product owner  Developer  QA tester  Viewer
Board                 Full   Full           Limited    Limited    Read-only
Backlog               Full   Full           Limited    Limited    Read-only
Sprint planning       Full   Full           Limited    View       Read-only
Analytics             Full   View           View       View       View
Epics                 Full   Full           View       View       Read-only
Roadmap               Full   Full           View       View       View
UAT testing           Full   View           View       Full       Read-only
Settings              Full   Limited        No         No         No</code></pre>

<h3>Backend write permissions</h3>

<pre><code>Action                                Admin  Product owner  Developer  QA tester  Viewer
Read workspace data                   Yes    Yes            Yes        Yes        Yes
Manage members                        Yes    No             No         No         No
Assign platform roles                 Yes    No             No         No         No
Create tickets                        Yes    Yes            Yes        Bug only   No
Edit product ticket fields            Yes    Yes            No         No         No
Update assigned ticket delivery work  Yes    Yes            Yes        Limited    No
Move ticket status                    Yes    Yes            Assigned   Testing    No
Move tickets in/out of sprint         Yes    Yes            No         No         No
Delete tickets                        Yes    Yes            No         No         No
Create/start/complete/delete sprints  Yes    Yes            No         No         No
Edit sprint capacity                  Yes    Yes            No         No         No
Create/edit/delete epics              Yes    Yes            No         No         No
Create/manage UAT plans               Yes    No             No         Yes        No
Update UAT test cases                 Yes    No             No         Yes        No
Sign off UAT plans                    Yes    Yes            No         No         No
Comment on tickets                    Yes    Yes            Yes        Yes        No</code></pre>

<h2>Security implementation</h2>

<h3>1. Backend policies</h3>

<p>I will add backend policies so users can only read and write data for workspaces where they are members.</p>

<ul>
  <li>All workspace data will be isolated by <code>workspace_id</code>.</li>
  <li>Only authenticated users can access workspace data.</li>
  <li>Viewers will have read-only access.</li>
  <li>Admins will have full access inside their workspace.</li>
  <li>Product owners will manage product, backlog, sprint, epic, roadmap, and UAT sign-off workflows.</li>
  <li>Developers and QA testers will have narrower write permissions.</li>
</ul>

<h3>2. Secure helper functions</h3>

<p>I will add backend helper functions for permission checks, including:</p>

<pre><code>has_workspace_access(workspace_id)
has_role(workspace_id, role)
has_any_role(workspace_id, roles)
current_member_id(workspace_id)</code></pre>

<h3>3. Update validation triggers</h3>

<p>Some permission rules are field-level, not just table-level. For example, a developer may update an assigned ticket’s status, but should not be able to change priority, epic, sprint, or assignee. I will add validation triggers on public app tables to block unauthorized field changes.</p>

<p>This will be used for rules such as:</p>

<ul>
  <li>Developers can update assigned ticket delivery fields only.</li>
  <li>QA testers can update testing-related ticket fields and UAT test cases only.</li>
  <li>Only admins and product owners can change sprint assignment, priority, epics, roadmap dates, and delete tickets.</li>
  <li>Only admins can assign roles or remove team members.</li>
</ul>

<h2>Data migration from demo data</h2>

<p>I will preserve the current seeded demo data by inserting it into the new backend tables as initial workspace data. After that, the app will load and mutate real backend data instead of resetting to seed data.</p>

<h3>Seeded data to migrate</h3>

<ul>
  <li>Team members</li>
  <li>Platform roles</li>
  <li>Epics</li>
  <li>Sprints</li>
  <li>Tickets</li>
  <li>Ticket labels</li>
  <li>Subtasks</li>
  <li>Comments</li>
  <li>Activity entries</li>
  <li>Notifications</li>
  <li>Workspace sprint settings</li>
</ul>

<h2>Frontend updates</h2>

<h3>1. Replace in-memory store with backend-backed store</h3>

<p>I will update the app store so it loads data from the backend and writes changes back to the backend.</p>

<p>The existing components can mostly keep using <code>useStore</code>, but the store actions will become async backend operations.</p>

<h3>2. Add loading and error states</h3>

<p>I will add proper loading and error handling for:</p>

<ul>
  <li>Initial workspace data load</li>
  <li>Ticket creation and updates</li>
  <li>Sprint changes</li>
  <li>Epic changes</li>
  <li>UAT plan and test case updates</li>
  <li>Team member and role changes</li>
</ul>

<h3>3. Fix current role fallback</h3>

<p>I will change the current role fallback from <code>admin</code> to <code>viewer</code> or restricted access until the user has a valid team member and role assignment.</p>

<h3>4. Keep settings permission maps visible</h3>

<p>The settings page will continue showing:</p>

<ul>
  <li>Role descriptions</li>
  <li>Page access map</li>
  <li>Action permission map</li>
  <li>Team members and assigned roles</li>
  <li>Sprint configuration</li>
</ul>

<p>I will also update the settings copy so users understand that permissions are now backend-enforced, not just a UI guide.</p>

<h2>Implementation steps</h2>

<ol>
  <li>Create backend enum types for ticket status, ticket type, priority, UAT status, and app roles.</li>
  <li>Create all required backend tables for workspace data, delivery data, UAT data, settings, and roles.</li>
  <li>Add indexes for workspace, sprint, epic, assignee, status, and linked ticket lookups.</li>
  <li>Add backend permission helper functions.</li>
  <li>Add backend access policies for each table.</li>
  <li>Add validation triggers for field-level role rules.</li>
  <li>Seed the current demo data into the new real tables.</li>
  <li>Update the frontend store to load data from the backend.</li>
  <li>Update all store mutation actions to write to the backend.</li>
  <li>Update role resolution to use backend roles instead of frontend-only team member data.</li>
  <li>Fix unmatched-user fallback to restricted/viewer access.</li>
  <li>Update settings to show backend-backed team members, roles, and permission documentation.</li>
  <li>Run type checks and verify all pages still work with real data.</li>
</ol>

<h2>Files expected to change</h2>

<pre><code>Backend
- New database migration for tables, policies, functions, and triggers

Frontend
- src/lib/store.ts
- src/lib/types.ts
- src/hooks/use-permissions.ts
- src/lib/permissions.ts
- src/components/SettingsView.tsx
- src/components/BoardView.tsx
- src/components/BacklogView.tsx
- src/components/SprintPlanningView.tsx
- src/components/AnalyticsView.tsx
- src/components/RoadmapView.tsx
- src/components/UATView.tsx
- src/components/UATTestPlanPage.tsx
- src/components/TicketDetailPanel.tsx
- src/components/CreateTicketModal.tsx
- src/components/CreateSprintModal.tsx
- src/components/CreateEpicModal.tsx
- src/components/CreateUATTestPlanModal.tsx
- src/components/TicketContextMenu.tsx
- src/components/SprintHeader.tsx
- src/components/AppSidebar.tsx</code></pre>

<h2>Final answer to your question</h2>

<p>No, the app does not currently have all the right real backend tables yet. The pages are functional, but they are still backed by frontend seed data and UI-only permissions. To start storing real data safely, we need to add the backend schema, move the current data into real tables, wire the frontend store to the backend, and enforce the role permissions in the backend.</p>

<p>This plan will build out the missing tables and make the role-level permissions real, while preserving the current page experience and the visible permission maps in settings.</p>
