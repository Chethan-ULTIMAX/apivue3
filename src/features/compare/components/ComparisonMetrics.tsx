import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from '@/components/apivue/ProfileBits';
import type { TrackedProfile } from '@/lib/integrations/registry';
import {
  formatMetric,
  getIntegration,
} from '@/lib/integrations/registry';

const SERIES_COLOR = 'hsl(var(--primary))';

interface ComparisonMetricsProps {
  profiles: TrackedProfile[];
  metricKey: string;
  metricLabel?: string;
  metricFormat?: string;
}

interface MetricRow {
  profileId: string;
  name: string;
  platform: string;
  value: number;
}

export function ComparisonMetrics({
  profiles,
  metricKey,
  metricLabel,
  metricFormat,
}: ComparisonMetricsProps) {
  if (profiles.length === 0) {
    return (
      <Card className="border-border bg-card/60">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No profiles selected for comparison.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rows: MetricRow[] = [];
  for (const profile of profiles) {
    const metric = profile.data?.metrics?.find((m) => m.key === metricKey);
    if (!metric) continue;
    if (typeof metric.value !== 'number') continue;
    rows.push({
      profileId: profile.id,
      name: profile.display_name || profile.handle,
      platform: getIntegration(profile.platform).name,
      value: metric.value,
    });
  }

  const resolvedLabel = metricLabel ?? metricKey;
  const resolvedFormat = metricFormat;

  if (rows.length === 0) {
    return (
      <Card className="border-border bg-card/60">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Metric “{resolvedLabel}” is not available as a numeric value on
            any of the selected profiles.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...rows.map((r) => r.value), 1);

  const chartData = rows.map((r) => ({
    name: r.name,
    platform: r.platform,
    value: r.value,
  }));

  return (
    <Card className="border-border bg-card/60">
      <CardHeader>
        <CardTitle className="text-base">{resolvedLabel}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 100, right: 12 }}
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
                dataKey="name"
                tick={chartAxisStyle}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value: number, _name, item: { payload?: { platform?: string } }) => [
                  formatMetric(value, resolvedFormat),
                  item.payload?.platform ?? '',
                ]}
              />
              <Bar
                dataKey="value"
                fill={SERIES_COLOR}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Profile</th>
                <th className="py-2 pr-4 font-medium">Platform</th>
                <th className="py-2 pr-4 text-right font-medium">Value</th>
                <th className="py-2 pr-4 text-right font-medium">% of max</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.profileId}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2 pr-4">{row.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {row.platform}
                  </td>
                  <td className="py-2 pr-4 text-right font-medium tabular-nums">
                    {formatMetric(row.value, resolvedFormat)}
                  </td>
                  <td className="py-2 pr-4 text-right text-muted-foreground tabular-nums">
                    {maxValue > 0
                      ? Math.round((row.value / maxValue) * 100)
                      : 0}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}