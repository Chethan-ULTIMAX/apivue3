import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSignOut} title="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>

    </div>
  );
}
