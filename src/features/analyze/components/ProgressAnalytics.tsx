import {
  ArrowUpRight,
  CheckCircle2,
  Goal,
  Target,
  TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ProgressAnalyticsProps = {
  hasData: boolean;
};

export function ProgressAnalytics({
  hasData,
}: ProgressAnalyticsProps) {
  return (
    <Card className="border-border/70 bg-card/50">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-300" />
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
            <ProgressItem
              icon={Target}
              title="Progress by area"
              description="Development, DSA, security, learning and projects can be analyzed independently."
            />

            <ProgressItem
              icon={ArrowUpRight}
              title="Change over time"
              description="APIVue will compare current periods against your actual historical data."
            />

            <ProgressItem
              icon={Goal}
              title="Goal progress"
              description="Connected activity can eventually contribute automatically to your goals."
            />

            <ProgressItem
              icon={CheckCircle2}
              title="Milestones"
              description="Important progress events can be identified from real activity."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyProgress() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-black/10 p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
        <TrendingUp className="h-5 w-5 text-emerald-300" />
      </div>

      <h3 className="mt-4 text-sm font-medium">
        Progress needs a history
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
        A single snapshot can describe your current state, but meaningful
        progress requires multiple real snapshots over time.
      </p>
    </div>
  );
}

function ProgressItem({
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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
        <Icon className="h-4 w-4 text-emerald-300" />
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