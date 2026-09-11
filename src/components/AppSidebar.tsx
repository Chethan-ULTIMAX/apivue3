import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Plug,
  Brain,
  Target,
  LogOut,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: Users, label: 'Profiles', href: '/dashboard/profiles' },
  { icon: TrendingUp, label: 'Progress', href: '/dashboard/progress' },
  { icon: Plug, label: 'Integrations', href: '/dashboard/integrations' },
  { icon: Brain, label: 'AI Insights', href: '/dashboard/ai-insights' },
  { icon: Target, label: 'Goals', href: '/dashboard/goals' },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <img src="/favicon.ico" alt="APIVue" className="mr-2 h-7 w-7 object-contain" />
        <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-orange-400 bg-clip-text text-transparent">
          APIVue
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 space-y-2">
        <button
          onClick={() => {/* open settings */}}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}