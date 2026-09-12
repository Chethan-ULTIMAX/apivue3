import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp, Users, X } from 'lucide-react';

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
import {
  formatMetric,
  getIntegration,
} from '@/lib/integrations/registry';

const SERIES_COLORS = [
  'hsl(var(--primary))',
  'hsl(199 89% 48%)',
  'hsl(142 71% 45%)',
  'hsl(25 95% 53%)',
  'hsl(280 67% 60%)',
];

interface FriendComparisonProps {
  profiles: TrackedProfile[];
  onClose: () => void;
}

export function FriendComparison({ profiles, onClose }: FriendComparisonProps) {
  if (profiles.length < 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Friend comparison
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm font-medium">
              Select at least two profiles
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add multiple profiles to compare their activity.
            </p>
            <Button className="mt-6" onClick={onClose}>
              OK
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------- Shared numeric metrics ---------- */

  const metricMeta = new Map<string, { label: string; format?: string }>();
  for (const profile of profiles) {
    for (const m of profile.data?.metrics ?? []) {
      if (typeof m.value !== 'number') continue;
      if (!metricMeta.has(m.key)) {
        metricMeta.set(m.key, { label: m.label, format: m.format });
      }
    }
  }

  const sharedMetrics = Array.from(metricMeta.entries()).map(
    ([key, meta]) => {
      const values = profiles.map((p) => {
        const metric = p.data?.metrics?.find((m) => m.key === key);
        return typeof metric?.value === 'number' ? metric.value : 0;
      });
      return {
        key,
        label: meta.label,
        format: meta.format,
        values,
        max: Math.max(...values, 0),
      };
    },
  );

  /* ---------- Activity timeline (union of dates across profiles) ---------- */

  const dateSet = new Set<string>();
  for (const profile of profiles) {
    for (const a of profile.data?.activity ?? []) {
      dateSet.add(a.date);
    }
  }

  const timelineData = Array.from(dateSet)
    .sort()
    .map((date) => {
      const point: Record<string, string | number> = { date };
      for (const profile of profiles) {
        const entry = profile.data?.activity?.find((a) => a.date === date);
        point[profile.handle] = entry?.count ?? 0;
      }
      return point;
    });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="mx-auto min-h-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-lg">Compare friends</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {profiles.length} profiles in comparison
                </p>
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
            {/* Profile overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="rounded-lg border border-border bg-card/60 p-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <ProfileAvatar profile={profile} size="md" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {profile.display_name || profile.handle}
                      </p>
                      <div className="mt-1">
                        <PlatformChip platform={profile.platform} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {profile.data?.metrics?.slice(0, 4).map((m) => (
                      <div key={m.key}>
                        <p className="text-muted-foreground">{m.label}</p>
                        <p className="font-medium tabular-nums">
                          {formatMetric(m.value, m.format)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Shared metrics table */}
            {sharedMetrics.length > 0 && (
              <div className="rounded-lg border border-border bg-card/60 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="h-4 w-4" />
                  Shared metrics
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Metric</th>
                        {profiles.map((p) => (
                          <th
                            key={p.id}
                            className="py-2 pr-4 text-right font-medium"
                          >
                            <span className="block max-w-[120px] truncate">
                              {p.display_name || p.handle}
                            </span>
                            <span className="block text-[10px] font-normal text-muted-foreground">
                              {getIntegration(p.platform).name}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sharedMetrics.map((metric) => (
                        <tr
                          key={metric.key}
                          className="border-t border-border"
                        >
                          <td className="py-2 pr-4 text-muted-foreground">
                            {metric.label}
                          </td>
                          {metric.values.map((value, i) => (
                            <td
                              key={profiles[i].id}
                              className={`py-2 pr-4 text-right tabular-nums ${
                                value === metric.max && metric.max > 0
                                  ? 'font-semibold text-primary'
                                  : ''
                              }`}
                            >
                              {formatMetric(value, metric.format)}
                            </td>
                          ))}
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
                  <TrendingUp className="h-4 w-4" />
                  Activity timeline
                </h3>
                <ResponsiveContainer width="100%" height={350}>
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
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {profiles.map((profile, i) => (
                      <Line
                        key={profile.id}
                        type="monotone"
                        dataKey={profile.handle}
                        stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ))}
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