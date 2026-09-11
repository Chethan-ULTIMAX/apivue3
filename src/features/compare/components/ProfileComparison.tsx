import { useMemo } from "react";
import { User, TrendingUp, Target, Code, Star, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrackedProfile } from "@/lib/integrations/registry";
import { formatMetric, getIntegration } from "@/lib/integrations/registry";
import { ProfileAvatar, PlatformChip, chartAxisStyle, chartGridStroke, chartTooltipStyle } from "@/components/apivue/ProfileBits";

const SERIES_COLORS = ["hsl(var(--primary))", "hsl(199 89% 48%)", "hsl(142 71% 45%)", "hsl(25 95% 53%)", "hsl(280 67% 60%)"];

interface ProfileComparisonProps {
  profile: TrackedProfile;
  onClose: () => void;
}

export function ProfileComparison({ profile, onClose }: ProfileComparisonProps) {
  const integration = getIntegration(profile.platform);
  const metrics = profile.data?.metrics ?? [];
  const activity = profile.data?.activity ?? [];
  const ratingHistory = profile.data?.ratingHistory ?? [];

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalActivity = activity.reduce((sum, a) => sum + a.count, 0);
    const activeDays = activity.filter((a) => a.count > 0).length;
    const totalDays = activity.length;
    const avgDaily = totalDays > 0 ? Math.round(totalActivity / totalDays) : 0;
    const peakDaily = Math.max(...activity.map((a) => a.count), 0);

    return {
      totalActivity,
      activeDays,
      totalDays,
      avgDaily,
      peakDaily,
    };
  }, [activity]);

  // Numeric metrics only
  const numericMetrics = metrics.filter((m) => typeof m.value === "number");

  // Chart data for metrics
  const metricsChartData = numericMetrics.map((m) => ({
    metric: m.label,
    value: typeof m.value === "number" ? m.value : 0,
  }));

  // Chart data for activity timeline
  const activityChartData = activity.map((a) => ({
    date: a.date,
    count: a.count,
  }));

  // Chart data for rating history
  const ratingChartData = ratingHistory.map((r) => ({
    date: r.date,
    rating: r.value,
  }));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="bg-card border-border rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <ProfileAvatar profile={profile} size="lg" />
              <div>
                <CardTitle className="text-xl">
                  {profile.display_name || profile.handle}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  <PlatformChip platform={profile.platform} />
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Profile Header Info */}
            <div className="border border-border rounded-lg p-5 bg-card/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    About
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform</span>
                      <span className="font-medium">{integration.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Handle</span>
                      <span className="font-medium">@{profile.handle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Display Name</span>
                      <span className="font-medium">{profile.display_name || 'N/A'}</span>
                    </div>
                    {profile.data?.bio && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bio</span>
                        <span className="font-medium text-right">{profile.data.bio}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Connection
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Synced</span>
                      <span className="font-medium">{profile.last_synced_at ? new Date(profile.last_synced_at).toLocaleDateString() : 'Never'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`font-medium ${
                        profile.sync_error ? "text-destructive" : "text-emerald-400"
                      }`}>
                        {profile.sync_error ? 'Error' : 'Connected'}
                      </span>
                    </div>
                    {profile.pinned && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pinned</span>
                        <span className="font-medium">Yes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            {numericMetrics.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card/40">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Key Metrics
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {numericMetrics.slice(0, 8).map((metric, index) => (
                    <div
                      key={metric.key}
                      className="bg-muted/30 rounded-lg p-4 text-center transition-all hover:bg-muted/50"
                    >
                      <p className="text-xs text-muted-foreground mb-2 truncate">{metric.label}</p>
                      <p className="text-2xl font-bold text-primary">{formatMetric(metric.value, metric.format)}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">{metric.key}</p>
                    </div>
                  ))}
                </div>
                
                {/* Metrics Bar Chart */}
                <div className="mt-6 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricsChartData} layout="vertical" margin={{ left: 120 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
                      <XAxis type="number" tick={chartAxisStyle} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="metric" tick={chartAxisStyle} axisLine={false} tickLine={false} width={120} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="value" fill={SERIES_COLORS[0]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Activity Summary */}
            {activity.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card/40">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Activity Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summary.totalActivity}</p>
                    <p className="text-xs text-muted-foreground">Total Activity</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summary.activeDays}</p>
                    <p className="text-xs text-muted-foreground">Active Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summary.totalDays}</p>
                    <p className="text-xs text-muted-foreground">Total Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summary.avgDaily}</p>
                    <p className="text-xs text-muted-foreground">Avg Daily</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summary.peakDaily}</p>
                    <p className="text-xs text-muted-foreground">Peak Daily</p>
                  </div>
                </div>

                {/* Activity Timeline Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityChartData} margin={{ left: 12, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                      <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} minTickGap={24} />
                      <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={SERIES_COLORS[0]}
                        strokeWidth={2}
                        dot={{ strokeWidth: 0, r: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Rating History */}
            {ratingHistory.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card/40">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Rating History
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ratingChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                    <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke={SERIES_COLORS[1]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
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
