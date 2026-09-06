import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ArrowRight, Plug, Plus, RefreshCw } from "lucide-react";
import { useSyncProfile, useTrackedProfiles } from "@/hooks/use-profiles";
import { formatMetric, getIntegration, integrations, metricOf } from "@/lib/integrations/registry";
import { AddProfileDialog } from "@/components/apivue/AddProfileDialog";
import {
  MetricTile,
  PlatformChip,
  ProfileAvatar,
  SkeletonPanel,
  SkeletonTiles,
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from "@/components/apivue/ProfileBits";
import { toast } from "@/hooks/use-toast";

export function OverviewView() {
  const { data: profiles = [], isLoading } = useTrackedProfiles();
  const sync = useSyncProfile();
  const [addOpen, setAddOpen] = useState(false);

  const totals = useMemo(() => {
    const sum = (key: string) =>
      profiles.reduce((s, p) => {
        const m = metricOf(p, key);
        return s + (typeof m?.value === "number" ? m.value : 0);
      }, 0);
    return {
      solved: sum("solved_all") + sum("solved"),
      repos: sum("public_repos"),
      stars: sum("stars"),
      contests: sum("contests"),
    };
  }, [profiles]);

  const activityData = useMemo(() => {
    const byDay: Record<string, number> = {};
    for (const p of profiles) {
      for (const a of p.data?.activity ?? []) byDay[a.date] = (byDay[a.date] ?? 0) + a.count;
    }
    return Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-90);
  }, [profiles]);

  const perPlatform = useMemo(
    () =>
      profiles.map((p) => {
        const integration = getIntegration(p.platform);
        const m = metricOf(p, integration.rankMetric);
        return {
          name: `${integration.name}`,
          value: typeof m?.value === "number" ? m.value : 0,
          accent: integration.accent,
        };
      }),
    [profiles],
  );

  const refreshAll = async () => {
    for (const p of profiles) {
      try {
        await sync.mutateAsync({ platform: p.platform, handle: p.handle });
      } catch (err) {
        toast({ title: `${p.handle} failed to refresh`, description: (err as Error).message, variant: "destructive" });
      }
    }
    if (profiles.length) toast({ title: "Profiles refreshed", description: "Latest public data pulled in." });
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
        <h1 className="text-lg font-semibold">Overview</h1>
        <SkeletonTiles />
        <SkeletonPanel />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl">
        <h1 className="text-lg font-semibold mb-8">Overview</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-card/40">
          <Plug className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-base font-medium mb-1">No profiles connected yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Add a public handle from LeetCode, GitHub, Codeforces and more. APIVue pulls the public data and turns it into
            analytics.
          </p>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Connect a profile
          </Button>
        </div>
        <AddProfileDialog open={addOpen} onOpenChange={setAddOpen} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold">Overview</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {profiles.length} profile{profiles.length === 1 ? "" : "s"} across{" "}
            {new Set(profiles.map((p) => p.platform)).size} platform
            {new Set(profiles.map((p) => p.platform)).size === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={refreshAll} disabled={sync.isPending}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${sync.isPending ? "animate-spin" : ""}`} />
            Refresh all
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Connect
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile metric={{ key: "solved", label: "Problems solved", value: totals.solved, format: "number" }} />
        <MetricTile metric={{ key: "repos", label: "Public repos", value: totals.repos, format: "number" }} />
        <MetricTile metric={{ key: "stars", label: "Stars earned", value: totals.stars, format: "number" }} />
        <MetricTile metric={{ key: "contests", label: "Contests entered", value: totals.contests, format: "number" }} />
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold mb-4">Combined activity</h2>
        {activityData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="apivueActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#apivueActivity)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No activity history available for these platforms.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">Headline metric per profile</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={perPlatform}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis dataKey="name" tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">Connected profiles</h2>
          <div className="space-y-2">
            {profiles.map((p) => {
              const integration = getIntegration(p.platform);
              const headline = metricOf(p, integration.headlineMetrics[0]);
              return (
                <Link
                  key={p.id}
                  to={`/dashboard/profiles/${p.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <ProfileAvatar profile={p} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{p.display_name || p.handle}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono-id">@{p.handle}</p>
                  </div>
                  <PlatformChip platform={p.platform} />
                  {headline && (
                    <span className="text-xs font-semibold tabular-nums w-16 text-right">
                      {formatMetric(headline.value, headline.format)}
                    </span>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
          {integrations.length > new Set(profiles.map((p) => p.platform)).size && (
            <Link
              to="/dashboard/integrations"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              Browse all integrations <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      <AddProfileDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
