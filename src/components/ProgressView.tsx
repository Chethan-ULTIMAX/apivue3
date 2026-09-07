import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Flame, History, LineChart as LineChartIcon, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileSnapshots, useTrackedProfiles } from "@/hooks/use-profiles";
import { buildProgressReport, mergeActivity } from "@/lib/analytics/progress";
import { getIntegration } from "@/lib/integrations/registry";
import { AddProfileDialog } from "@/components/apivue/AddProfileDialog";
import {
  MetricTile,
  PlatformChip,
  SkeletonPanel,
  SkeletonTiles,
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from "@/components/apivue/ProfileBits";

export function ProgressView() {
  const profilesQuery = useTrackedProfiles();
  const snapshotsQuery = useProfileSnapshots();
  const [addOpen, setAddOpen] = useState(false);

  const profiles = profilesQuery.data ?? [];
  const snapshots = snapshotsQuery.data ?? [];
  const isLoading = profilesQuery.isLoading || snapshotsQuery.isLoading;
  const error = (profilesQuery.error ?? snapshotsQuery.error) as Error | null;

  const report = useMemo(() => buildProgressReport(profiles, snapshots), [profiles, snapshots]);
  const activityTimeline = useMemo(() => mergeActivity(profiles).slice(-90), [profiles]);
  const topTrends = report.trends.slice(0, 6);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
        <h1 className="text-lg font-semibold">Progress</h1>
        <SkeletonTiles />
        <SkeletonPanel />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl">
        <h1 className="text-lg font-semibold mb-4">Progress</h1>
        <div className="border border-destructive/30 bg-destructive/10 rounded-lg p-5">
          <p className="text-sm font-medium text-destructive mb-1">Could not load your progress history</p>
          <p className="text-xs text-muted-foreground mb-4">{error.message}</p>
          <Button size="sm" variant="outline" onClick={() => { profilesQuery.refetch(); snapshotsQuery.refetch(); }}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl">
        <h1 className="text-lg font-semibold mb-8">Progress</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-card/40">
          <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-base font-medium mb-1">No history recorded yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Connect a profile first. Every refresh stores a snapshot, and those snapshots become your long-term progress
            history.
          </p>
          <Button size="sm" onClick={() => setAddOpen(true)}>Connect a profile</Button>
        </div>
        <AddProfileDialog open={addOpen} onOpenChange={setAddOpen} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold">Progress</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Built from {report.snapshotCount.toLocaleString()} recorded snapshot{report.snapshotCount === 1 ? "" : "s"}
          {report.historyDays > 0 ? ` spanning ${report.historyDays} day${report.historyDays === 1 ? "" : "s"}` : ""}.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile metric={{ key: "active", label: "Active days on record", value: report.activity.activeDays, format: "number" }} />
        <MetricTile metric={{ key: "events", label: "Recorded events", value: report.activity.totalEvents, format: "number" }} />
        <MetricTile
          metric={{ key: "streak", label: "Current streak", value: report.activity.currentStreak, format: "number" }}
          delta={report.activity.currentStreak > 0 ? report.activity.currentStreak : null}
        />
        <MetricTile metric={{ key: "longest", label: "Longest streak", value: report.activity.longestStreak, format: "number" }} />
      </div>

      {/* Activity history */}
      <section className="bg-card border border-border rounded-lg p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Activity history</h2>
        </div>
        {activityTimeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activityTimeline}>
              <defs>
                <linearGradient id="progressActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={chartAxisStyle} tickLine={false} axisLine={false} minTickGap={28} />
              <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} width={34} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#progressActivity)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground py-8 text-center">
            None of your connected platforms expose day-level activity yet.
          </p>
        )}
      </section>

      {/* Trends per metric */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Metric trends</h2>
        </div>
        {topTrends.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-6 text-center bg-card/40">
            <LineChartIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium mb-1">Trends need at least two snapshots</p>
            <p className="text-xs text-muted-foreground">
              Refresh a profile again later and APIVue will start charting the difference. Nothing is estimated.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {topTrends.map((t) => (
              <div key={`${t.profileId}-${t.metricKey}`} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <PlatformChip platform={t.platform} />
                      <span className="text-[10px] text-muted-foreground truncate">{t.handle}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums">{t.latest.value.toLocaleString()}</p>
                    <p className={`text-[11px] font-medium ${t.change > 0 ? "text-success" : t.change < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {t.change > 0 ? "+" : ""}
                      {t.change.toLocaleString()}
                      {t.changePct !== null ? ` (${t.change > 0 ? "+" : ""}${t.changePct}%)` : ""}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={t.points}>
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Line type="monotone" dataKey="value" stroke={getIntegration(t.platform).accent} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Progress areas */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Progress areas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.categoryProgress.map((cat) => (
            <div key={cat.category} className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm font-medium">{cat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">{cat.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {cat.profiles.map((p) => (
                  <PlatformChip key={p.id} platform={p.platform} />
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {cat.trends.length > 0
                  ? `${cat.trends.length} tracked metric${cat.trends.length === 1 ? "" : "s"} with history`
                  : "History still building"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Observations — deterministic, derived from real data only */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Observations</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {report.observations.map((o) => (
            <div key={o.id} className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm font-medium mb-1">{o.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{o.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Every figure above is calculated directly from stored snapshots and public platform data. Personalised guidance
          will build on this same data layer.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Link to="/dashboard/profiles">
          <Button size="sm" variant="outline">
            Manage profiles
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </Link>
        <Link to="/dashboard/compare">
          <Button size="sm" variant="ghost">Compare profiles</Button>
        </Link>
      </div>
    </div>
  );
}
