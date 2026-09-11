import { useState } from "react";
import { TrendingUp, Calendar, ArrowLeftRight, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrackedProfile } from "@/lib/integrations/registry";
import { formatMetric, getIntegration } from "@/lib/integrations/registry";
import { ProfileAvatar, PlatformChip, chartAxisStyle, chartGridStroke, chartTooltipStyle } from "@/components/apivue/ProfileBits";

const SERIES_COLORS = ["hsl(var(--primary))", "hsl(199 89% 48%)", "hsl(142 71% 45%)", "hsl(25 95% 53%)", "hsl(280 67% 60%)"];

interface PeriodComparisonProps {
  profile: TrackedProfile;
  onClose: () => void;
}

interface DateRange {
  from: Date;
  to: Date;
}

export function PeriodComparison({ profile, onClose }: PeriodComparisonProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const [comparisonMode, setComparisonMode] = useState <'time' | 'custom'>('time');
  const [customPeriods, setCustomPeriods] = useState<DateRange[]>([
    { from: new Date(new Date().setDate(new Date().getDate() - 60)), to: new Date(new Date().setDate(new Date().getDate() - 30)) },
    { from: new Date(new Date().setDate(new Date().getDate() - 30)), to: new Date() },
  ]);

  // Extract activity data for the profile
  const activityData = profile.data?.activity ?? [];
  const metrics = profile.data?.metrics ?? [];

  // Filter activity data by date range
  const filterActivityByRange = (range: DateRange | undefined) => {
    if (!range || !range.from || !range.to) return activityData;
    const fromDate = range.from.toISOString().split('T')[0];
    const toDate = range.to.toISOString().split('T')[0];
    return activityData.filter((a) => a.date >= fromDate && a.date <= toDate);
  };

  const currentActivity = filterActivityByRange(dateRange);
  const previousActivity = filterActivityByRange({
    from: new Date(new Date().setDate(new Date().getDate() - 60)),
    to: new Date(new Date().setDate(new Date().getDate() - 30)),
  });

  // Calculate comparison metrics
  const calculateSummary = (activity: typeof activityData) => {
    const total = activity.reduce((sum, a) => sum + a.count, 0);
    const average = activity.length > 0 ? Math.round(total / activity.length) : 0;
    const peak = Math.max(...activity.map((a) => a.count), 0);
    const days = activity.length;
    const activeDays = activity.filter((a) => a.count > 0).length;
    return { total, average, peak, days, activeDays };
  };

  const currentSummary = calculateSummary(currentActivity);
  const previousSummary = calculateSummary(previousActivity);

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const metricsWithChanges = metrics
    .filter((m) => typeof m.value === "number")
    .map((m) => {
      // For demo purposes, we'll simulate historical values
      // In a real implementation, this would come from snapshots
      const previousValue = typeof m.value === "number" ? m.value * 0.8 : 0;
      const currentValue = typeof m.value === "number" ? m.value : 0;
      return {
        ...m,
        change: calculateChange(currentValue, previousValue),
        previousValue,
        currentValue,
      };
    });

  // Build time series data for charting
  const timeSeriesData = activityData
    .filter((a) => {
      if (!dateRange?.from || !dateRange?.to) return true;
      const fromDate = dateRange.from.toISOString().split('T')[0];
      const toDate = dateRange.to.toISOString().split('T')[0];
      return a.date >= fromDate && a.date <= toDate;
    })
    .map((a) => ({
      date: a.date,
      count: a.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Metrics comparison data
  const metricsComparisonData = metricsWithChanges.map((m) => ({
    metric: m.label,
    Current: m.currentValue,
    Previous: m.previousValue,
    Change: m.change,
  }));

  // Helper to format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Preset date ranges
  const handlePresetSelect = (days: number) => {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    setDateRange({ from, to });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="bg-card border-border rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <ProfileAvatar profile={profile} size="md" />
              <div>
                <CardTitle className="text-lg">
                  {profile.display_name || profile.handle}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {getIntegration(profile.platform).name} - Period Comparison
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Comparison Controls */}
            <div className="flex flex-wrap gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {dateRange ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}` : 'Select a date range'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <div className="flex flex-wrap gap-1">
                {[
                  { days: 7, label: "7d" },
                  { days: 30, label: "30d" },
                  { days: 60, label: "60d" },
                  { days: 90, label: "90d" },
                ].map((preset) => (
                  <Button
                    key={preset.days}
                    variant="outline"
                    size="sm"
                    className="text-xs px-2"
                    onClick={() => handlePresetSelect(preset.days)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="border border-border rounded-lg p-5 bg-card/40">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Period Summary
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{currentSummary.total}</p>
                  <p className="text-xs text-muted-foreground">Total Events</p>
                  <p className="text-xs text-muted-foreground">{currentSummary.days} days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{currentSummary.average}</p>
                  <p className="text-xs text-muted-foreground">Event Average</p>
                  {previousSummary.average > 0 && (
                    <p className="text-xs ">
                      <span className={calculateChange(currentSummary.average, previousSummary.average) > 0 ? "text-emerald-400" : "text-destructive"}>
                        {calculateChange(currentSummary.average, previousSummary.average) > 0 && '+'}
                        {calculateChange(currentSummary.average, previousSummary.average)}%
                      </span>
                      vs prev
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{currentSummary.activeDays}</p>
                  <p className="text-xs text-muted-foreground">Active Days</p>
                  {previousSummary.activeDays > 0 && (
                    <p className="text-xs ">
                      <span className={calculateChange(currentSummary.activeDays, previousSummary.activeDays) > 0 ? "text-emerald-400" : "text-destructive"}>
                        {calculateChange(currentSummary.activeDays, previousSummary.activeDays) > 0 && '+'}
                        {calculateChange(currentSummary.activeDays, previousSummary.activeDays)}%
                      </span>
                      vs prev
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{currentSummary.peak}</p>
                  <p className="text-xs text-muted-foreground">Peak Activity</p>
                  {previousSummary.peak > 0 && (
                    <p className="text-xs ">
                      <span className={calculateChange(currentSummary.peak, previousSummary.peak) > 0 ? "text-emerald-400" : "text-destructive"}>
                        {calculateChange(currentSummary.peak, previousSummary.peak) > 0 && '+'}
                        {calculateChange(currentSummary.peak, previousSummary.peak)}%
                      </span>
                      vs prev
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Metrics Comparison Table */}
            {metricsWithChanges.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card/40">
                <h3 className="text-sm font-semibold mb-4">Metrics Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Metric</th>
                        <th className="py-2 pr-4 font-medium text-right">Previous</th>
                        <th className="py-2 pr-4 font-medium text-right">Current</th>
                        <th className="py-2 pr-4 font-medium text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricsWithChanges.map((m) => (
                        <tr key={m.key} className="border-t border-border">
                          <td className="py-2 pr-4 text-muted-foreground">{m.label}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">{formatMetric(m.previousValue, m.format)}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">{formatMetric(m.currentValue, m.format)}</td>
                          <td
                            className={`py-2 pr-4 text-right tabular-nums ${
                              m.change > 0
                                ? "text-emerald-400 font-medium"
                                : m.change < 0
                                  ? "text-destructive font-medium"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {m.change > 0 && '+'}{m.change}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Activity Timeline Chart */}
            {timeSeriesData.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card/40">
                <h3 className="text-sm font-semibold mb-4">Activity Timeline</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                    <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} />
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
            )}

            {/* Comparison Bar Chart */}
            {metricsComparisonData.length > 0 && (
              <div className="border border-border rounded-lg p-5 bg-card/40">
                <h3 className="text-sm font-semibold mb-4">Metrics: Current vs Previous</h3>
                <ResponsiveContainer width="100%" height={Math.max(260, metricsComparisonData.length * 40)}>
                  <BarChart data={metricsComparisonData} layout="vertical" margin={{ left: 120 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
                    <XAxis type="number" tick={chartAxisStyle} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="metric" tick={chartAxisStyle} axisLine={false} tickLine={false} width={120} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Previous" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Current" fill={SERIES_COLORS[0]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Empty State */}
            {timeSeriesData.length === 0 && metricsWithChanges.length === 0 && (
              <div className="border border-border rounded-lg p-8 bg-card/40 text-center">
                <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">No data available for comparison</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select a different time range to see activity data
                </p>
              </div>
            )}

            {/* Quick Actions */}
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
