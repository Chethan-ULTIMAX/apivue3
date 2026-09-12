import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Brain,
  Compass,
  GitCompareArrows,
  LayoutDashboard,
  LogOut,
  Plug,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

/* ============================================================
 * Navigation structure
 *
 * `matchPrefix: true` marks the item as active for any nested
 * route that starts with `href` (e.g. /dashboard/profile/:id
 * still highlights "Profiles").
 * ============================================================ */

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  matchPrefix?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        icon: LayoutDashboard,
        label: 'Dashboard',
        href: '/dashboard',
      },
      {
        icon: TrendingUp,
        label: 'Progress',
        href: '/dashboard/progress',
      },
    ],
  },
  {
    title: 'Analyze',
    items: [
      {
        icon: BarChart3,
        label: 'Analytics',
        href: '/dashboard/analytics',
      },
      {
        icon: GitCompareArrows,
        label: 'Compare',
        href: '/dashboard/compare',
      },
      {
        icon: Brain,
        label: 'AI Insights',
        href: '/dashboard/ai-insights',
      },
    ],
  },
  {
    title: 'Sources',
    items: [
      {
        icon: Users,
        label: 'Profiles',
        href: '/dashboard/profiles',
        matchPrefix: true,
      },
      {
        icon: Compass,
        label: 'Explore',
        href: '/dashboard/explore',
      },
      {
        icon: Plug,
        label: 'Integrations',
        href: '/dashboard/integrations',
      },
    ],
  },
  {
    title: 'Personal',
    items: [
      {
        icon: Target,
        label: 'Goals',
        href: '/dashboard/goals',
      },
    ],
  },
];

function isItemActive(
  pathname: string,
  item: NavItem,
  allHrefs: string[],
): boolean {
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  // For non-prefix items, only exact match — but skip if a longer
  // sibling href also matches (so /dashboard doesn't stay active on
  // /dashboard/progress).
  if (pathname === item.href) {
    const hasMoreSpecificMatch = allHrefs.some(
      (href) =>
        href !== item.href &&
        href.startsWith(item.href) &&
        pathname.startsWith(href),
    );
    return !hasMoreSpecificMatch;
  }

  return false;
}

/* ============================================================
 * Sidebar
 * ============================================================ */

interface AppSidebarProps {
  /** Called when a nav link is clicked (used to auto-close on mobile). */
  onNavigate?: () => void;
  /** Shown only when rendered inside a mobile drawer. */
  onClose?: () => void;
}

export function AppSidebar({ onNavigate, onClose }: AppSidebarProps = {}) {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const allHrefs = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.href));

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <img
            src="/favicon.ico"
            alt=""
            className="h-7 w-7 object-contain"
          />
          <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-xl font-bold text-transparent">
            APIVue
          </span>
        </Link>

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4 last:mb-0">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </p>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(
                  location.pathname,
                  item,
                  allHrefs,
                );

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-accent font-medium text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border p-3">
        {user?.email && (
          <p
            className="mb-2 truncate px-3 text-[11px] text-muted-foreground"
            title={user.email}
          >
            {user.email}
          </p>
        )}

        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}