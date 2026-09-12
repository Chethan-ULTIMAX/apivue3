import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Calendar, TrendingDown, TrendingUp, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ProfileAvatar,
  PlatformChip,
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from '@/components/apivue/ProfileBits';
import { useProfileSnapshots } from '@/hooks/use-profiles';
import type { TrackedProfile } from '@/lib/integrations/registry';
import { getIntegration } from '@/lib/integrations/registry';

const SERIES_COLOR = 'hsl(var(--primary))';

interface PeriodComparisonProps {
  profile: TrackedProfile;
  onClose: () => void;
}

type PeriodKey = 7 | 30 | 60 | 90;

interface SummaryRow {
  label: string;
  current: number;
  previous: number;
  change: number | null;
}

/* ============================================================
 * Helpers
 * ============================================================ */

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

/* ============================================================
 * Component
 * ============================================================ */

export function PeriodComparison({ profile, onClose }: PeriodComparisonProps) {
  const [period, setPeriod] = useState<PeriodKey>(30);

  const { data: snapshots = [], isLoading } = useProfileSnapshots(profile.id);

  /* ---------- Split snapshots into current + previous windows ---------- */

  const { currentSnaps, previousSnaps } = useMemo(() => {
    const currentStart = daysAgoIso(period);
    const previousStart = daysAgoIso(period * 2);
    const currentEnd = new Date().toISOString();

    const current: typeof snapshots = [];
    const previous: typeof snapshots = [];

    for (const s of snapshots) {
      if (s.captured_at >= currentStart && s.captured_at <= currentEnd) {
        current.push(s);
      } else if (
        s.captured_at >= previousStart &&
        s.captured_at < currentStart
      ) {
        previous.push(s);
      }
    }

    return { currentSnaps: current, previousSnaps: previous };
  }, [snapshots, period]);

  /* ---------- Metric deltas from real snapshots ---------- */

  const metricRows: SummaryRow[] = useMemo(() => {
    if (currentSnaps.length === 0 && previousSnaps.length === 0) return [];

    // Collect all metric keys across both windows.
    const keys = new Set<string>();
    for (const s of [...currentSnaps, ...previousSnaps]) {
      for (const k of Object.keys(s.metrics ?? {})) keys.add(k);
    }

    const takeLatest = (snaps: typeof snapshots, key: string): number | null => {
      if (snaps.length === 0) return null;
      const sorted = [...snaps].sort((a, b) =>
        a.captured_at.localeCompare(b.captured_at),
      );
      for (let i = sorted.length - 1; i >= 0; i--) {
        const v = sorted[i].metrics?.[key];
        if (typeof v === 'number' && Number.isFinite(v)) return v;
      }
      return null;
    };

    const takeFirst = (snaps: typeof snapshots, key: string): number | null => {
      if (snaps.length === 0) return null;
      const sorted = [...snaps].sort((a, b) =>
        a.captured_at.localeCompare(b.captured_at),
      );
      for (const s of sorted) {
        const v = s.metrics?.[key];
        if (typeof v === 'number' && Number.isFinite(v)) return v;
      }
      return null;
    };

    const rows: SummaryRow[] = [];
    for (const key of keys) {
      const label =
        profile.data?.metrics?.find((m) => m.key === key)?.label ??
        key.replace(/_/g, ' ');

      const currentStart = takeFirst(currentSnaps, key);
      const currentEnd = takeLatest(currentSnaps, key);
      const previousStart = takeFirst(previousSnaps, key);
      const previousEnd = takeLatest(previousSnaps, key);

      if (
        currentStart === null &&
        currentEnd === null &&
        previousStart === null &&
        previousEnd === null
      ) {
        continue;
      }

      const currentValue = currentStart ?? currentEnd ?? 0;
      const previousValue = previousStart ?? previousEnd ?? 0;
      const change =
        previousValue === 0
          ? currentValue > 0
            ? null // Cannot compute % from zero.
            : 0
          : Math.round(
              ((currentValue - previousValue) / previousValue) * 1000,
            ) / 10;

      rows.push({
        label,
        current: currentValue,
        previous: previousValue,
        change,
      });
    }

    return rows.sort((a, b) =>
      Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0),
    );
  }, [currentSnaps, previousSnaps, profile.data?.metrics]);

  /* ---------- Activity timeline in the selected period ---------- */

  const timelineData = useMemo(() => {
    const activity = profile.data?.activity ?? [];
    const from = daysAgoIso(period).slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    return activity
      .filter((a) => a.date >= from && a.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [profile.data?.activity, period]);

  /* ---------- Empty state ---------- */

  const notEnoughHistory =
    !isLoading && currentSnaps.length === 0 && previousSnaps.length === 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="mx-auto min-h-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <ProfileAvatar profile={profile} size="md" />
              <div>
                <CardTitle className="text-lg">
                  {profile.display_name || profile.handle}
                </CardTitle>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <PlatformChip platform={profile.platform} />
                  <span>·</span>
                  <span>Period comparison</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Period picker */}
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Compare last
              </span>
              {([7, 30, 60, 90] as PeriodKey[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setPeriod(p)}
                >
                  {p} days
                </Button>
              ))}
            </div>

            {notEnoughHistory ? (
              <div className="rounded-lg border border-dashed border-border bg-card/40 p-8 text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">
                  Not enough history yet
                </p>
                <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                  Period comparison uses real snapshots. Refresh this
                  profile regularly so APIVue can build a history to compare
                  across periods. APIVue never fabricates previous values.
                </p>
              </div>
            ) : (
              <>
                {/* Snapshot coverage note */}
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Showing {currentSnaps.length} snapshot
                  {currentSnaps.length === 1 ? '' : 's'} in the last{' '}
                  {period} days, compared against{' '}
                  {previousSnaps.length} in the preceding {period} days.
                  {previousSnaps.length === 0 && (
                    <span className="ml-1 font-medium text-amber-600 dark:text-amber-400">
                      No data in the previous window — deltas cannot be
                      calculated yet.
                    </span>
                  )}
                </div>

                {/* Metrics comparison table */}
                {metricRows.length > 0 && (
                  <div className="rounded-lg border border-border bg-card/60 p-5">
                    <h3 className="mb-4 text-sm font-semibold">
                      Metrics: previous vs current
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="py-2 pr-4 font-medium">Metric</th>
                            <th className="py-2 pr-4 text-right font-medium">
                              Previous
                            </th>
                            <th className="py-2 pr-4 text-right font-medium">
                              Current
                            </th>
                            <th className="py-2 pr-4 text-right font-medium">
                              Change
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {metricRows.map((m) => (
                            <tr key={m.label} className="border-t border-border">
                              <td className="py-2 pr-4 text-muted-foreground">
                                {m.label}
                              </td>
                              <td className="py-2 pr-4 text-right tabular-nums">
                                {m.previous.toLocaleString()}
                              </td>
                              <td className="py-2 pr-4 text-right tabular-nums">
                                {m.current.toLocaleString()}
                              </td>
                              <td
                                className={`py-2 pr-4 text-right tabular-nums ${
                                  m.change === null
                                    ? 'text-muted-foreground'
                                    : m.change > 0
                                      ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                      : m.change < 0
                                        ? 'font-medium text-destructive'
                                        : 'text-muted-foreground'
                                }`}
                              >
                                {m.change === null ? (
                                  '—'
                                ) : (
                                  <>
                                    {m.change > 0 && '+'}
                                    {m.change}%
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Activity timeline */}
                {timelineData.length > 0 && (
                  <div className="rounded-lg border border-border bg-card/60 p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                      {metricRows.some(
                        (m) => m.change !== null && m.change > 0,
                      ) ? (
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      Activity in the last {period} days
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={timelineData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={chartGridStroke}
                        />
                        <XAxis
                          dataKey="date"
                          tick={chartAxisStyle}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={chartAxisStyle}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke={SERIES_COLOR}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}

            <div className="flex flex-wrap gap-3 border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}