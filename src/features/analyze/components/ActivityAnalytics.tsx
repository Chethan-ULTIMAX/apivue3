import {
  Activity,
  CalendarDays,
  Clock3,
  Layers3,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ActivityAnalyticsProps = {
  hasData: boolean;
};

export function ActivityAnalytics({
  hasData,
}: ActivityAnalyticsProps) {
  return (
    <Card className="border-border/70 bg-card/50">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-blue-300" />
              Activity analytics
            </CardTitle>

            <p className="mt-1 text-xs text-muted-foreground">
              Understand when and where your activity happens.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
          >
            View details
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {!hasData ? (
          <EmptyActivity />
        ) : (
          <div className="space-y-4">
            <AnalyticsPlaceholder
              icon={CalendarDays}
              title="Daily activity"
              description="Daily activity statistics will appear here once real activity snapshots are available."
            />

            <AnalyticsPlaceholder
              icon={Layers3}
              title="Activity distribution"
              description="APIVue will organize activity across your connected areas."
            />

            <AnalyticsPlaceholder
              icon={Clock3}
              title="Activity patterns"
              description="Patterns such as active days and consistency require historical data."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyActivity() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-black/10 p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
        <Activity className="h-5 w-5 text-blue-300" />
      </div>

      <h3 className="mt-4 text-sm font-medium">
        No activity history yet
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
        Connect a platform and APIVue will begin collecting the activity you
        have authorized.
      </p>
    </div>
  );
}

function AnalyticsPlaceholder({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-black/10 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
        <Icon className="h-4 w-4 text-blue-300" />
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