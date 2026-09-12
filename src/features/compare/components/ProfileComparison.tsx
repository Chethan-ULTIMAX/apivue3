import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Calendar, Code, Target, TrendingUp, User, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ProfileAvatar,
  PlatformChip,
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from '@/components/apivue/ProfileBits';
import type { TrackedProfile } from '@/lib/integrations/registry';
import { formatMetric, getIntegration } from '@/lib/integrations/registry';

const SERIES_COLORS = [
  'hsl(var(--primary))',
  'hsl(199 89% 48%)',
  'hsl(142 71% 45%)',
  'hsl(25 95% 53%)',
  'hsl(280 67% 60%)',
];

interface ProfileComparisonProps {
  profile: TrackedProfile;
  onClose: () => void;
}

export function ProfileComparison({ profile, onClose }: ProfileComparisonProps) {
  const integration = getIntegration(profile.platform);
  const metrics = profile.data?.metrics ?? [];
  const activity = profile.data?.activity ?? [];
  const ratingHistory = profile.data?.ratingHistory ?? [];

  /* ---------- Activity summary ---------- */

  const summary = useMemo(() => {
    const totalActivity = activity.reduce((sum, a) => sum + a.count, 0);
    const activeDays = activity.filter((a) => a.count > 0).length;
    const totalDays = activity.length;
    const avgDaily =
      totalDays > 0 ? Math.round(totalActivity / totalDays) : 0;
    const peakDaily = activity.reduce((max, a) => Math.max(max, a.count), 0);

    return { totalActivity, activeDays, totalDays, avgDaily, peakDaily };
  }, [activity]);

  const numericMetrics = useMemo(
    () => metrics.filter((m) => typeof m.value === 'number'),
    [metrics],
  );

  const metricsChartData = numericMetrics.slice(0, 8).map((m) => ({
    metric: m.label,
    value: typeof m.value === 'number' ? m.value : 0,
  }));

  /* ---------- Tracked profile display helpers ---------- */

  const lastSynced =
    profile.lastSyncedAt ?? profile.last_synced_at ?? null;
  const syncError = profile.syncError ?? profile.sync_error ?? null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="mx-auto min-h-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <ProfileAvatar profile={profile} size="lg" />
              <div>
                <CardTitle className="text-xl">
                  {profile.display_name || profile.handle}
                </CardTitle>
                <div className="mt-1">
                  <PlatformChip platform={profile.platform} />
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
            {/* Header info */}
            <div className="rounded-lg border border-border bg-card/60 p-5">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-muted-foreground" />
                    About
                  </p>
                  <dl className="space-y-3 text-sm">
                    <Row label="Platform" value={integration.name} />
                    <Row label="Handle" value={`@${profile.handle}`} />
                    <Row
                      label="Display name"
                      value={profile.display_name || '—'}
                    />
                    {profile.data?.bio && (
                      <Row label="Bio" value={profile.data.bio} />
                    )}
                    {profile.data?.location && (
                      <Row label="Location" value={profile.data.location} />
                    )}
                  </dl>
                </div>

                <div>
                  <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Connection
                  </p>
                  <dl className="space-y-3 text-sm">
                    <Row
                      label="Last synced"
                      value={
                        lastSynced
                          ? new Date(lastSynced).toLocaleString()
                          : 'Never'
                      }
                    />
                    <Row
                      label="Status"
                      value={syncError ? 'Error' : 'Connected'}
                      valueClassName={
                        syncError
                          ? 'text-destructive'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }
                    />
                    {profile.pinned && (
                      <Row label="Pinned" value="Yes" />
                    )}
                  </dl>
                </div>
              </div>
            </div>

            {/* Key metrics */}
            {numericMetrics.length > 0 && (
              <div className="rounded-lg border border-border bg-card/60 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4" />
                  Key metrics
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {numericMetrics.slice(0, 8).map((metric) => (
                    <div
                      key={metric.key}
                      className="rounded-lg bg-muted/40 p-4 text-center transition-colors hover:bg-muted/60"
                    >
                      <p className="mb-2 truncate text-xs text-muted-foreground">
                        {metric.label}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {formatMetric(metric.value, metric.format)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metricsChartData}
                      layout="vertical"
                      margin={{ left: 120 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartGridStroke}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={chartAxisStyle}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="metric"
                        tick={chartAxisStyle}
                        axisLine={false}
                        tickLine={false}
                        width={120}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar
                        dataKey="value"
                        fill={SERIES_COLORS[0]}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Activity summary */}
            {activity.length > 0 && (
              <div className="rounded-lg border border-border bg-card/60 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="h-4 w-4" />
                  Activity summary
                </h3>

                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
                  <Stat label="Total activity" value={summary.totalActivity} />
                  <Stat label="Active days" value={summary.activeDays} />
                  <Stat label="Total days" value={summary.totalDays} />
                  <Stat label="Avg daily" value={summary.avgDaily} />
                  <Stat label="Peak daily" value={summary.peakDaily} />
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={activity}
                      margin={{ left: 12, right: 12 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartGridStroke}
                      />
                      <XAxis
                        dataKey="date"
                        tick={chartAxisStyle}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={24}
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
                        stroke={SERIES_COLORS[0]}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Rating history */}
            {ratingHistory.length > 0 && (
              <div className="rounded-lg border border-border bg-card/60 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Code className="h-4 w-4" />
                  Rating history
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ratingHistory}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartGridStroke}
                    />
                    <XAxis
                      dataKey="date"
                      tick={chartAxisStyle}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={chartAxisStyle}
                      axisLine={false}
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={SERIES_COLORS[1]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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

/* ============================================================
 * Small helpers
 * ============================================================ */

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`truncate text-right font-medium ${valueClassName ?? ''}`}>
        {value}
      </dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}