import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chartAxisStyle, chartGridStroke, chartTooltipStyle } from "@/components/apivue/ProfileBits";
import type { TrackedProfile } from "@/lib/integrations/registry";
import { formatMetric, getIntegration } from "@/lib/integrations/registry";

const SERIES_COLORS = ["hsl(var(--primary))", "hsl(199 89% 48%)", "hsl(142 71% 45%)", "hsl(25 95% 53%)", "hsl(280 67% 60%)"];

interface ComparisonMetricsProps {
  profiles: TrackedProfile[];
  metricKey: string;
}

export function ComparisonMetrics({ profiles, metricKey }: ComparisonMetricsProps) {
  if (profiles.length === 0) {
    return (
      <Card className="border-border bg-card/40">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No profiles to compare</p>
        </CardContent>
      </Card>
    );
  }

  // Find the metric across all profiles
  const metricsData = profiles.map((profile) => {
    const metric = profile.data?.metrics?.find((m) => m.key === metricKey);
    const value = typeof metric?.value === "number" ? metric.value : 0;
    return {
      name: profile.display_name || profile.handle,
      platform: getIntegration(profile.platform).name,
      value,
      profileId: profile.id,
    };
  }).filter((d) => d.value > 0 || profiles.length === 1);

  if (metricsData.length === 0) {
    return (
      <Card className="border-border bg-card/40">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Metric "{metricKey}" not found on any profile</p>
        </CardContent>
      </Card>
    );
  }

  // Create chart data for vertical bar chart (one bar per profile)
  const chartData = metricsData.map((d) => ({
    name: d.name,
    platform: d.platform,
    value: d.value,
  }));

  // Also create comparison data for table
  const maxValue = Math.max(...metricsData.map((d) => d.value), 1);

  return (
    <Card className="border-border bg-card/40">
      <CardHeader>
        <CardTitle className="text-base">{metricKey}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simple Bar Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{left: 100}}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
              <XAxis type="number" tick={chartAxisStyle} axisLine={false} tickLine={false} />
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
                formatter={(value: number, name: string, item: any) => [
                  `${formatMetric(value)}`, 
                  `${name} (${item.payload.platform})`
                ]}
              />
              <Bar dataKey="value" fill={SERIES_COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-4 font-medium">Profile</th>
                <th className="py-2 pr-4 font-medium">Platform</th>
                <th className="py-2 pr-4 font-medium text-right">Value</th>
                <th className="py-2 pr-4 font-medium text-right">% of Max</th>
              </tr>
            </thead>
            <tbody>
              {metricsData.map((d) => (
                <tr key={d.profileId} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-4">{d.name}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{d.platform}</td>
                  <td className="py-2 pr-4 text-right tabular-nums font-medium">{formatMetric(d.value)}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">
                    {maxValue > 0 ? Math.round((d.value / maxValue) * 100) : 0}%
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
