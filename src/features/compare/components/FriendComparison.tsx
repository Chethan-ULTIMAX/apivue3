import type { SyntheticEvent } from "react";
import { Users, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chartAxisStyle, chartGridStroke, chartTooltipStyle } from "@/components/apivue/ProfileBits";
import type { TrackedProfile } from "@/lib/integrations/registry";
import { formatMetric, getIntegration } from "@/lib/integrations/registry";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const SERIES_COLORS = ["hsl(var(--primary))", "hsl(199 89% 48%)", "hsl(142 71% 45%)", "hsl(25 95% 53%)", "hsl(280 67% 60%)"];

interface FriendComparisonProps {
  profiles: TrackedProfile[];
  onClose: () => void;
}

export function FriendComparison({ profiles, onClose }: FriendComparisonProps) {
  if (profiles.length < 2) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="bg-card border-border rounded-lg max-w-md w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg"><Users className="h-5 w-5 inline mr-2" />Friend Comparison</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm font-medium">Select at least 2 profiles</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add multiple profiles to compare their activity
            </p>
            <Button className="mt-6" onClick={onClose}>
              OK
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get shared metrics across profiles
  const allMetrics = new Map<string, { label: string; format?: string }>();
  profiles.forEach((profile) => {
    profile.data?.metrics?.forEach((m) => {
      if (typeof m.value === "number" && !allMetrics.has(m.key)) {
        allMetrics.set(m.key, { label: m.label, format: m.format });
      }
    });
  });

  // Get shared activity data
  const sharedActivity: Record<string, Array<{ date: string; count: number; profile: string }>> = {};
  
  profiles.forEach((profile) => {
    profile.data?.activity?.forEach((a) => {
      if (!sharedActivity[a.date]) {
        sharedActivity[a.date] = [];
      }
      sharedActivity[a.date].push({
        date: a.date,
        count: a.count,
        profile: profile.handle,
      });
    });
  });

  // Get latest values for each shared metric
  const sharedMetrics = Array.from(allMetrics.entries()).map(([key, meta]) => {
    const values = profiles.map((p) => {
      const metric = p.data?.metrics?.find((m) => m.key === key);
      return typeof metric?.value === "number" ? metric.value : 0;
    });
    const max = Math.max(...values, 1);
    
    return {
      key,
      label: meta.label,
      format: meta.format,
      values,
      max,
      profiles,
    };
  });

  // Timeline data with all profiles
  const timelineData = Object.entries(sharedActivity)
    .map(([date, activities]) => {
      const dataPoint: Record<string, string | number> = { date };
      profiles.forEach((profile) => {
        const activity = activities.find((a) => a.profile === profile.handle);
        dataPoint[profile.handle] = activity ? activity.count : 0;
      });
      return dataPoint;
    })
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="bg-card border-border rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-lg">Compare Friends</CardTitle>
                <p className="text-xs text-muted-foreground">{profiles.length} profiles in comparison</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Profile Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile, index) => (
                <div key={profile.id} className="border border-border rounded-lg p-4 bg-card/40">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={profile.avatar_url || undefined}
                      alt={profile.display_name || profile.handle}
                      className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                      onError={(e: SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div>
                      <p className="font-medium">{profile.display_name || profile.handle}</p>
                      <p className="text-xs text-muted-foreground">{getIntegration(profile.platform).name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {profile.data?.metrics?.slice(0, 4).map((m) => (
                      <div key={m.key}>
                        <p className="text-muted-foreground">{m.label}</p>
                        <p className="font-medium tabular-nums">{formatMetric(m.value, m.format)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Shared Metrics Comparison */}
            {sharedMetrics.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card/40">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Shared Metrics
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Metric</th>
                        {profiles.map((p) => (
                          <th key={p.id} className="py-2 pr-4 font-medium text-right">
                            <span className="block truncate max-w-[120px]">{p.display_name || p.handle}</span>
                            <span className="block text-[10px] text-muted-foreground">{getIntegration(p.platform).name}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sharedMetrics.map((metric) => (
                        <tr key={metric.key} className="border-t border-border">
                          <td className="py-2 pr-4 text-muted-foreground">{metric.label}</td>
                          {metric.values.map((value, i) => (
                            <td
                              key={i}
                              className={`py-2 pr-4 text-right tabular-nums ${
                                value === metric.max && metric.max > 0 ? "font-semibold text-primary" : ""
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

            {/* Activity Timeline */}
            {timelineData.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card/40">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Activity Timeline
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                    <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} />
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

            {/* Summary Stats */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
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
