import { LayoutDashboard, List, CalendarRange, BarChart3, Layers, Settings, Kanban, Map, ClipboardCheck, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import { AppPage } from "@/lib/permissions";
import { MemberAvatar } from "@/components/TicketBadges";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const navItems: { title: string; url: string; icon: typeof LayoutDashboard; page: AppPage }[] = [
  { title: "Epics", url: "/dashboard/epics", icon: Layers, page: "epics" },
  { title: "Backlog", url: "/dashboard/backlog", icon: List, page: "backlog" },
  { title: "Sprint planning", url: "/dashboard/planning", icon: CalendarRange, page: "planning" },
  { title: "Board", url: "/dashboard", icon: LayoutDashboard, page: "board" },
  { title: "UAT testing", url: "/dashboard/uat", icon: ClipboardCheck, page: "uat" },
  { title: "Roadmap", url: "/dashboard/roadmap", icon: Map, page: "roadmap" },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, page: "analytics" },
  { title: "Documentation", url: "/dashboard/documentation", icon: BookOpen, page: "documentation" },
  { title: "Settings", url: "/dashboard/settings", icon: Settings, page: "settings" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const permissions = usePermissions();
  const collapsed = state === "collapsed";
  const visibleNavItems = permissions.loading ? navItems : navItems.filter((item) => permissions.canAccessPage(item.page));
  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <Kanban className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && <span className="text-sm font-semibold tracking-tight">Sprint Board</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/dashboard"}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <MemberAvatar name={user?.name || user?.email || "User"} avatar={initials} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.name || "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
