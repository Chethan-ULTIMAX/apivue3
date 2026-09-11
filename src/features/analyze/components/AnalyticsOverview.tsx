import {
  Activity,
  BarChart3,
  Database,
  History,
  Sparkles,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { ProgressReport } from '@/lib/analytics/progress';

type AnalyticsOverviewProps = {
  report: ProgressReport;
};

const metrics = [
  {
    icon: Database,
    title: 'Data sources',
    description: 'Platforms contributing data to APIVue.',
  },
  {
    icon: Activity,
    title: 'Activity',
    description: 'Understand what you have been doing.',
  },
  {
    icon: History,
    title: 'History',
    description: 'Build a timeline of your activity.',
  },
  {
    icon: Sparkles,
    title: 'Insights',
    description: 'Discover meaningful patterns later.',
  },
];

export function AnalyticsOverview({
  report,
}: AnalyticsOverviewProps) {
  const hasData = report.profileCount > 0;
  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Overview
        </p>

        <h2 className="mt-1 text-xl font-semibold">
          Your analytics foundation
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card
              key={metric.title}
              className="group border-border/70 bg-card/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/20 hover:bg-card/70"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                    <Icon className="h-4 w-4 text-violet-300" />
                  </div>

                  {hasData ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                  )}
                </div>

                <h3 className="mt-4 text-sm font-medium">
                  {metric.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {metric.description}
                </p>

                <div className="mt-4 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  {metric.title === 'Data sources' ? `${report.profileCount} connected` : metric.title === 'History' ? `${report.snapshotCount} snapshots` : hasData ? 'Calculated from stored data' : 'Connect data to unlock'}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}