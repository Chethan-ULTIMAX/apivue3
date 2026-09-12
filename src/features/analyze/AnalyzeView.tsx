import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProfileSnapshots, useTrackedProfiles } from '@/hooks/use-profiles';
import { buildProgressReport } from '@/lib/analytics/progress';

import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Database,
  Info,
  Lock,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { AnalyticsOverview } from './components/AnalyticsOverview';
import { ActivityAnalytics } from './components/ActivityAnalytics';
import { ProgressAnalytics } from './components/ProgressAnalytics';
import { StatisticsOverview } from './components/StatisticsOverview';
import { TrendAnalytics } from './components/TrendAnalytics';

export function AnalyzeView() {
  const location = useLocation();
  const {
    data: profiles,
    isLoading,
    refetch,
  } = useTrackedProfiles();
  const { data: snapshots = [], isLoading: snapshotsLoading } = useProfileSnapshots();

  const exploredProfile = location.state?.exploreProfile;

  const connectedProfiles = useMemo(() => {
    const base = Array.isArray(profiles) ? profiles : [];
    if (exploredProfile) {
      const explored = {
        id: `explored-${exploredProfile.platform}-${exploredProfile.profile.username}`,
        platform: exploredProfile.platform,
        handle: exploredProfile.profile.username,
        display_name: exploredProfile.profile.displayName,
        avatar_url: exploredProfile.profile.avatarUrl,
        profile_url: exploredProfile.profile.profileUrl,
        data: {
          metrics: exploredProfile.metrics.map(m => ({ key: m.label.toLowerCase().replace(/\s+/g, '_'), label: m.label, value: m.value, format: 'number' })),
          activity: exploredProfile.activity,
        },
        last_synced_at: exploredProfile.fetchedAt,
      };
      return [...base, explored];
    }
    return base;
  }, [profiles, exploredProfile]);

  const report = useMemo(() => buildProgressReport(connectedProfiles, snapshots), [connectedProfiles, snapshots]);
  const hasConnectedData = report.profileCount > 0;

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (isLoading || snapshotsLoading) {
    return (
      <div className="min-h-full p-5 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-56 rounded-lg bg-muted" />
            <div className="h-4 w-96 max-w-full rounded bg-muted" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="h-40 rounded-2xl bg-muted lg:col-span-2" />
            <div className="h-40 rounded-2xl bg-muted" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-56 rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-48 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/[0.06] blur-3xl" />
        <div className="absolute right-[-150px] top-40 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.04] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8 p-5 sm:p-6 lg:p-8">

        {/* Header */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-violet-500/20 bg-violet-500/[0.05] text-violet-300"
              >
                <BarChart3 className="mr-1.5 h-3 w-3" />
                Analytics
              </Badge>

              {hasConnectedData && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400"
                >
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Data connected
                </Badge>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Analyze your data
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Understand your activity, progress, patterns and changes using
              the data APIVue has actually collected.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/50 px-3 py-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {today}
          </div>
        </header>

        {/* Data status */}
        {!hasConnectedData ? (
          <Card className="relative overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-card/70 to-card/50">
            <CardContent className="relative p-6 sm:p-8">
              <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="max-w-2xl">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                    <Database className="h-5 w-5 text-violet-300" />
                  </div>

                  <h2 className="mt-5 text-xl font-semibold">
                    Your analytics history hasn't started yet
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    APIVue needs real activity history before it can calculate
                    meaningful personal analytics. Connect a platform to begin
                    collecting authorized data.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link to="/dashboard/integrations">
                      <Button className="gap-2 bg-white text-black hover:bg-zinc-200">
                        Connect a platform
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>

                    <Link to="/dashboard/explore">
                      <Button
                        variant="outline"
                        className="gap-2 border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                      >
                        <Sparkles className="h-4 w-4 text-violet-300" />
                        Explore public data
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-5 lg:w-80">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Analytics unlocks
                  </p>

                  <div className="mt-4 space-y-3">
                    {[
                      'Activity statistics',
                      'Progress over time',
                      'Historical trends',
                      'Personal patterns',
                      'AI-ready insights',
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckIcon />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-emerald-500/15 bg-emerald-500/[0.025]">
            <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Database className="h-4 w-4 text-emerald-400" />
                </div>

                <div>
                  <p className="text-sm font-medium">
                    {connectedProfiles.length} connected source
                    {connectedProfiles.length === 1 ? '' : 's'}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Analytics below will be generated from real connected
                    activity as history becomes available.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh data
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analytics overview */}
        <AnalyticsOverview report={report} />

        {/* Statistics */}
        <StatisticsOverview report={report} />

        {/* Activity + progress */}
        <div className="grid gap-5 lg:grid-cols-2">
          <ActivityAnalytics report={report} />
          <ProgressAnalytics report={report} />
        </div>

        {/* Trends */}
        <TrendAnalytics hasData={hasConnectedData} />

        {/* Intelligence note */}
        <Card className="border-border/70 bg-card/40">
          <CardContent className="p-5 sm:p-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                <TrendingUp className="h-5 w-5 text-orange-300" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Analytics become more useful with history
                </h2>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                  APIVue should not infer long-term patterns from a single
                  snapshot. As historical snapshots accumulate, the analytics
                  engine can identify genuine changes, consistency patterns and
                  progress.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <div className="flex items-center gap-2 border-t border-border/60 pt-5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 text-emerald-400" />
          <span>
            Personal analytics are generated from data available to your
            APIVue account and authorized integrations.
          </span>
          <Info className="ml-auto h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-3 w-3 text-emerald-400"
      >
        <path
          d="M5 10.5L8.5 14L15 6.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}