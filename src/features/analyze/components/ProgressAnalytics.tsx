import {
  ArrowUpRight,
  CheckCircle2,
  Goal,
  Target,
  TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProgressReport } from '@/lib/analytics/progress';

type ProgressAnalyticsProps = {
  report: ProgressReport;
};

export function ProgressAnalytics({ report }: ProgressAnalyticsProps) {
  const hasData = report.profileCount > 0;

  return (
    <Card className="border-border bg-card/60">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
              Progress analytics
            </CardTitle>

            <p className="mt-1 text-xs text-muted-foreground">
              See how your work changes over time.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
          >
            View progress
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {!hasData ? (
          <EmptyProgress />
        ) : (
          <div className="space-y-3">
            <ProgressRow
              icon={Target}
              title="Progress by area"
              description={`${report.categoryProgress.length} progress area${
                report.categoryProgress.length === 1 ? '' : 's'
              } represented by your connected profiles.`}
            />

            <ProgressRow
              icon={ArrowUpRight}
              title="Change over time"
              description={`${report.trends.length} metric trend${
                report.trends.length === 1 ? '' : 's'
              } calculated from stored snapshots.`}
            />

            <ProgressRow
              icon={Goal}
              title="Goal progress"
              description={
                report.observations.length
                  ? `${report.observations.length} deterministic observation${
                      report.observations.length === 1 ? '' : 's'
                    } available for guidance.`
                  : 'More history is needed for meaningful observations.'
              }
            />

            <ProgressRow
              icon={CheckCircle2}
              title="Milestones"
              description={
                report.snapshotCount > 1
                  ? `History spans ${report.historyDays} day${
                      report.historyDays === 1 ? '' : 's'
                    }.`
                  : 'Collect another snapshot to identify milestones.'
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyProgress() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
        <TrendingUp className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />
      </div>

      <h3 className="mt-4 text-sm font-medium">Progress needs a history</h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
        A single snapshot can describe your current state, but meaningful
        progress requires multiple real snapshots over time.
      </p>
    </div>
  );
}

function ProgressRow({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
        <Icon className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
      </div>

      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}