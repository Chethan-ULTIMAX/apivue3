import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Routes, Route } from "react-router-dom";
import { BoardView } from "@/components/BoardView";
import { BacklogView } from "@/components/BacklogView";
import { SprintPlanningView } from "@/components/SprintPlanningView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { EpicsView } from "@/components/EpicsView";
import { SettingsView } from "@/components/SettingsView";
import { UATView } from "@/components/UATView";
import { UATTestPlanPage } from "@/components/UATTestPlanPage";
import { RoadmapView } from "@/components/RoadmapView";
import { DocumentationView } from "@/components/DocumentationView";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationDropdown } from "./NotificationDropdown";
import { ThemeToggle } from "./ThemeToggle";
import { TicketDetailPanel } from "./TicketDetailPanel";
import { Ticket } from "@/lib/types";
import { usePermissions } from "@/hooks/use-permissions";
import { AppPage } from "@/lib/permissions";
import { RestrictedAccess } from "./RestrictedAccess";
import { useWorkspaceData } from "@/hooks/use-workspace-data";

function PermissionRoute({ page, children }: { page: AppPage; children: JSX.Element }) {
  const permissions = usePermissions();
  if (permissions.loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!permissions.canAccessPage(page)) return <RestrictedAccess page={page} role={permissions.role} />;
  return children;
}

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchTicket, setSearchTicket] = useState<Ticket | null>(null);
  useWorkspaceData();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <header className="h-12 flex items-center justify-between border-b border-border px-4 shrink-0">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="ml-1" />
                <GlobalSearch onSelectTicket={setSearchTicket} />
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <NotificationDropdown />
                <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSignOut} title="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route index element={<PermissionRoute page="board"><BoardView /></PermissionRoute>} />
                <Route path="backlog" element={<PermissionRoute page="backlog"><BacklogView /></PermissionRoute>} />
                <Route path="planning" element={<PermissionRoute page="planning"><SprintPlanningView /></PermissionRoute>} />
                <Route path="analytics" element={<PermissionRoute page="analytics"><AnalyticsView /></PermissionRoute>} />
                <Route path="epics" element={<PermissionRoute page="epics"><EpicsView /></PermissionRoute>} />
                <Route path="roadmap" element={<PermissionRoute page="roadmap"><RoadmapView /></PermissionRoute>} />
                <Route path="uat" element={<PermissionRoute page="uat"><UATView /></PermissionRoute>} />
                <Route path="uat/:planId" element={<PermissionRoute page="uat"><UATTestPlanPage /></PermissionRoute>} />
                <Route path="documentation" element={<PermissionRoute page="documentation"><DocumentationView /></PermissionRoute>} />
                <Route path="settings" element={<PermissionRoute page="settings"><SettingsView /></PermissionRoute>} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>

      {searchTicket && <TicketDetailPanel ticket={searchTicket} onClose={() => setSearchTicket(null)} />}
    </div>
  );
}
