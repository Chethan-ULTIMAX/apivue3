import { Activity, Brain, GitCompareArrows, Target, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const items = [
  { href: '/dashboard/profiles', label: 'Profiles', icon: Users, color: 'text-violet-500' },
  { href: '/dashboard/progress', label: 'Progress', icon: TrendingUp, color: 'text-emerald-500' },
  { href: '/dashboard/compare', label: 'Compare', icon: GitCompareArrows, color: 'text-cyan-500' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: Activity, color: 'text-orange-500' },
  { href: '/dashboard/goals', label: 'Goals', icon: Target, color: 'text-rose-500' },
  { href: '/dashboard/ai-insights', label: 'AI Insights', icon: Brain, color: 'text-indigo-500' },
];

export function DashboardStats() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ href, label, icon: Icon, color }) => (
        <Link key={href} to={href} className="group">
          <Card className="h-full border-border/80 bg-card/70 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/70 transition-transform group-hover:scale-105">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">Open {label.toLowerCase()}</p>
              </div>
              <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">→</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </section>
  );
}
