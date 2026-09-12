import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Flame,
  History,
  LineChart as LineChartIcon,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  useProfileSnapshots,
  useTrackedProfiles,
} from '@/hooks/use-profiles';
import {
  buildProgressReport,
  mergeActivity,
} from '@/lib/analytics/progress';
import { getIntegration } from '@/lib/integrations/registry';
import { AddProfileDialog } from '@/components/apivue/AddProfileDialog';
import {
  MetricTile,
  PlatformChip,
  SkeletonPanel,
  SkeletonTiles,
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from '@/components/apivue/ProfileBits';

export function ProgressView() {
  const profilesQuery = useTrackedProfiles();
  const snapshotsQuery = useProfileSnapshots();
  const [addOpen, setAddOpen] = useState(false);

  const profiles = profilesQuery.data ?? [];
  const snapshots = snapshotsQuery.data ?? [];
  const isLoading = profilesQuery.isLoading || snapshotsQuery.isLoading;
  const error = (profilesQuery.error ?? snapshotsQuery.error) as Error | null;

  const report = useMemo(
    () => buildProgressReport(profiles, snapshots),
    [profiles, snapshots],
  );

  const activityTimeline = useMemo(
    () => mergeActivity(profiles).slice(-90),
    [profiles],
  );

  const topTrends = report.trends.slice(0, 6);

  /* ---------- States ---------- */

  if (isLoading) {
    return (
      <div className="max-w-6xl space-y-6 p-4 sm:p-6">
        <h1 className="text-lg font-semibold">Progress</h1>
        <SkeletonTiles />
        <SkeletonPanel />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl p-4 sm:p-6">
        <h1 className="mb-4 text-lg font-semibold">Progress</h1>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5">
          <p className="mb-1 text-sm font-medium text-destructive">
            Could not load your progress history
          </p>
          <p className="mb-4 text-xs text-muted-foreground">
            {error.message}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              profilesQuery.refetch();
              snapshotsQuery.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="max-w-3xl p-4 sm:p-6">
        <h1 className="mb-8 text-lg font-semibold">Progress</h1>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center">
          <History className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h2 className="mb-1 text-base font-medium">
            No history recorded yet
          </h2>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Connect a profile first. Every refresh stores a snapshot, and
            those snapshots become your long-term progress history.
          </p>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            Connect a profile
          </Button>
        </div>
        <AddProfileDialog open={addOpen} onOpenChange={setAddOpen} />
      </div>
    );
  }

  const snapshotSummary = `Built from ${report.snapshotCount.toLocaleString()} recorded snapshot${
    report.snapshotCount === 1 ? '' : 's'
  }${
    report.historyDays > 0
      ? ` spanning ${report.historyDays} day${report.historyDays === 1 ? '' : 's'}`
      : ''
  }.`;

  return (
    <div className="max-w-6xl space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Progress</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {snapshotSummary}
        </p>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          metric={{
            key: 'active',
            label: 'Active days on record',
            value: report.activity.activeDays,
            format: 'number',
          }}
        />
        <MetricTile
          metric={{
            key: 'events',
            label: 'Recorded events',
            value: report.activity.totalEvents,
            format: 'number',
          }}
        />
        <MetricTile
          metric={{
            key: 'streak',
            label: 'Current streak',
            value: report.activity.currentStreak,
            format: 'number',
          }}
        />
        <MetricTile
          metric={{
            key: 'longest',
            label: 'Longest streak',
            value: report.activity.longestStreak,
            format: 'number',
          }}
        />
      </div>

      {/* Activity history */}
      <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Activity history</h2>
        </div>

        {activityTimeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activityTimeline}>
              <defs>
                <linearGradient
                  id="progressActivity"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={chartGridStroke}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={chartAxisStyle}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />
              <YAxis
                tick={chartAxisStyle}
                tickLine={false}
                axisLine={false}
                width={34}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#progressActivity)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-xs text-muted-foreground">
            None of your connected platforms expose day-level activity yet.
          </p>
        )}
      </section>

      {/* Metric trends */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Metric trends</h2>
        </div>

        {topTrends.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-center">
            <LineChartIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="mb-1 text-sm font-medium">
              Trends need at least two snapshots
            </p>
            <p className="text-xs text-muted-foreground">
              Refresh a profile again later and APIVue will start charting
              the difference. Nothing is estimated.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {topTrends.map((t) => {
              const accent = getIntegration(t.platform).accent;
              const changeClass =
                t.change > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : t.change < 0
                    ? 'text-destructive'
                    : 'text-muted-foreground';

              return (
                <div
                  key={`${t.profileId}-${t.metricKey}`}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {t.label}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <PlatformChip platform={t.platform} />
                        <span className="truncate text-[10px] text-muted-foreground">
                          {t.handle}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold tabular-nums">
                        {t.latest.value.toLocaleString()}
                      </p>
                      <p className={`text-[11px] font-medium ${changeClass}`}>
                        {t.change > 0 ? '+' : ''}
                        {t.change.toLocaleString()}
                        {t.changePct !== null
                          ? ` (${t.change > 0 ? '+' : ''}${t.changePct}%)`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={90}>
                    <LineChart data={t.points}>
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['dataMin', 'dataMax']} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={accent}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Progress areas */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Progress areas</h2>

        {report.categoryProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No areas have data yet. Connect a platform that maps to a
            progress area to see it here.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.categoryProgress.map((cat) => (
              <div
                key={cat.category}
                className="rounded-lg border border-border bg-card p-4"
              >
                <p className="text-sm font-medium">{cat.label}</p>
                <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
                  {cat.description}
                </p>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {cat.profiles.map((p) => (
                    <PlatformChip key={p.id} platform={p.platform} />
                  ))}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {cat.trends.length > 0
                    ? `${cat.trends.length} tracked metric${
                        cat.trends.length === 1 ? '' : 's'
                      } with history`
                    : 'History still building'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Observations */}
      {report.observations.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Observations</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {report.observations.map((o) => (
              <div
                key={o.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <p className="mb-1 text-sm font-medium">{o.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {o.detail}
                </p>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Every figure above is calculated directly from stored snapshots
            and public platform data. Personalised guidance will build on
            this same data layer.
          </p>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/dashboard/profiles">
          <Button size="sm" variant="outline">
            Manage profiles
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
        <Link to="/dashboard/compare">
          <Button size="sm" variant="ghost">
            Compare profiles
          </Button>
        </Link>
      </div>
    </div>
  );
}