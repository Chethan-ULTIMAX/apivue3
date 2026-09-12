import {
  Activity,
  Database,
  History,
  Sparkles,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { ProgressReport } from '@/lib/analytics/progress';

type AnalyticsOverviewProps = {
  report: ProgressReport;
};

const sections = [
  {
    key: 'sources',
    icon: Database,
    title: 'Data sources',
    description: 'Platforms contributing data to APIVue.',
  },
  {
    key: 'activity',
    icon: Activity,
    title: 'Activity',
    description: 'Understand what you have been doing.',
  },
  {
    key: 'history',
    icon: History,
    title: 'History',
    description: 'Build a timeline of your activity.',
  },
  {
    key: 'insights',
    icon: Sparkles,
    title: 'Insights',
    description: 'Discover meaningful patterns later.',
  },
] as const;

export function AnalyticsOverview({ report }: AnalyticsOverviewProps) {
  const hasData = report.profileCount > 0;

  const footerFor = (key: (typeof sections)[number]['key']): string => {
    switch (key) {
      case 'sources':
        return `${report.profileCount} connected`;
      case 'history':
        return `${report.snapshotCount} snapshot${
          report.snapshotCount === 1 ? '' : 's'
        }`;
      case 'activity':
      case 'insights':
        return hasData ? 'Calculated from stored data' : 'Connect data to unlock';
    }
  };

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
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Card
              key={section.key}
              className="group border-border bg-card/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-card"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60">
                    <Icon className="h-4 w-4 text-violet-500 dark:text-violet-300" />
                  </div>

                  <span
                    className={
                      hasData
                        ? 'h-1.5 w-1.5 rounded-full bg-emerald-500'
                        : 'h-1.5 w-1.5 rounded-full bg-muted-foreground/40'
                    }
                  />
                </div>

                <h3 className="mt-4 text-sm font-medium">{section.title}</h3>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {section.description}
                </p>

                <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  {footerFor(section.key)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}