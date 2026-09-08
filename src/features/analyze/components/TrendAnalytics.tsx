import {
  Activity,
  BarChart3,
  CalendarRange,
  LineChart as LineChartIcon,
  Lock,
  TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type TrendAnalyticsProps = {
  hasData: boolean;
};

export function TrendAnalytics({
  hasData,
}: TrendAnalyticsProps) {
  return (
    <section>
      <Card className="overflow-hidden border-border/70 bg-card/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-violet-300" />
                Trends over time
              </CardTitle>

              <p className="mt-1 text-xs text-muted-foreground">
                Historical changes across your activity areas.
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-black/10 p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs"
              >
                7 days
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs"
              >
                30 days
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs"
              >
                90 days
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {!hasData ? (
            <TrendEmptyState />
          ) : (
            <TrendReadyState />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function TrendEmptyState() {
  return (
    <div className="relative flex min-h-[330px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/70 bg-black/10 p-6">
      {/* Decorative grid — not data */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />

      <div className="relative max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10">
          <LineChartIcon className="h-5 w-5 text-violet-300" />
        </div>

        <h3 className="mt-4 text-sm font-semibold">
          Your trend line will appear here
        </h3>

        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          APIVue needs historical snapshots to calculate genuine trends.
          Once enough data exists, this chart will show how your activity
          changes over time.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <BadgeLike icon={CalendarRange} text="Daily" />
          <BadgeLike icon={Activity} text="Weekly" />
          <BadgeLike icon={BarChart3} text="Monthly" />
        </div>
      </div>
    </div>
  );
}

function TrendReadyState() {
  return (
    <div className="relative flex min-h-[330px] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-black/10">
      <div className="text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
          <TrendingUp className="h-5 w-5 text-violet-300" />
        </div>

        <h3 className="mt-4 text-sm font-medium">
          Historical trend data is ready for visualization
        </h3>

        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
          Connect this component to APIVue's analytics snapshots before
          rendering a chart. The UI intentionally does not manufacture a
          trend from incomplete data.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3 text-emerald-400" />
          Calculated from stored activity history
        </div>
      </div>
    </div>
  );
}

function BadgeLike({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground">
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground">
      {children}
    </span>
  );
}