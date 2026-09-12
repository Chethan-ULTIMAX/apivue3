import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Sparkles } from 'lucide-react';

import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/profiles': 'Profiles',
  '/dashboard/progress': 'Progress',
  '/dashboard/explore': 'Explore',
  '/dashboard/compare': 'Compare',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/integrations': 'Integrations',
  '/dashboard/ai-insights': 'AI Insights',
  '/dashboard/goals': 'Goals',
};

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPage = useMemo(() => {
    if (pageNames[location.pathname]) return pageNames[location.pathname];
    if (location.pathname.startsWith('/dashboard/profile/')) return 'Profile';
    return 'APIVue';
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSearch = (value: string) => {
    const q = value.trim().toLowerCase();
    if (!q) return;
    const match = Object.entries(pageNames).find(([path, name]) =>
      name.toLowerCase().includes(q),
    );
    if (match) {
      navigate(match[0]);
      setSearchOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden lg:flex">
        <AppSidebar onNavigate={handleSignOut} />
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <AppSidebar
              onNavigate={() => setMobileOpen(false)}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/85 px-3 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <span className="font-semibold text-foreground">APIVue</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{currentPage}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {searchOpen ? (
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  className="h-9 w-56 pl-8 text-xs"
                  placeholder="Jump to a page…"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSearch(event.currentTarget.value);
                    if (event.key === 'Escape') setSearchOpen(false);
                  }}
                  onBlur={() => setSearchOpen(false)}
                />
              </div>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label="Search dashboard"
              title="Jump to a page"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden gap-1.5 text-xs sm:flex"
              onClick={() => navigate('/dashboard/ai-insights')}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Insights
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className={cn('min-w-0 flex-1 overflow-auto scrollbar-thin')}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
