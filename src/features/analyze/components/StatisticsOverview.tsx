import {
  Activity,
  BarChart3,
  Database,
  Hash,
  Info,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProgressReport } from '@/lib/analytics/progress';

type StatisticsOverviewProps = {
  report: ProgressReport;
};

export function StatisticsOverview({ report }: StatisticsOverviewProps) {
  const hasData = report.profileCount > 0;
  const activityRate =
    report.activity.totalDays > 0
      ? Math.round(
          (report.activity.activeDays / report.activity.totalDays) * 100,
        )
      : 0;

  const stats = [
    {
      key: 'total-activity',
      icon: Hash,
      title: 'Total activity',
      value: report.activity.totalEvents,
      suffix: '',
      description:
        'Combined measurable activity across connected sources.',
    },
    {
      key: 'active-days',
      icon: Activity,
      title: 'Active days',
      value: report.activity.activeDays,
      suffix: '',
      description: 'Days where meaningful activity was recorded.',
    },
    {
      key: 'activity-rate',
      icon: BarChart3,
      title: 'Activity rate',
      value: activityRate,
      suffix: '%',
      description:
        'How consistently activity occurs over a selected period.',
    },
    {
      key: 'data-points',
      icon: Database,
      title: 'Data points',
      value: report.snapshotCount,
      suffix: '',
      description:
        'Historical observations available to the analytics engine.',
    },
  ];

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Statistics
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Your activity at a glance
          </h2>
        </div>

        <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          <Info className="h-3 w-3" />
          Based on actual data
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.key} className="border-border bg-card/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>

                  <Icon className="h-4 w-4 text-violet-500 dark:text-violet-300" />
                </div>
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                  {stat.value.toLocaleString()}
                  {stat.suffix}
                </div>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {hasData
                    ? stat.description
                    : 'Connect data to calculate this statistic.'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}