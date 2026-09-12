import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useProfileSnapshots,
  useSyncProfile,
  useTrackedProfiles,
} from '@/hooks/use-profiles';
import { formatMetric, getIntegration } from '@/lib/integrations/registry';
import {
  MetricTile,
  PlatformChip,
  ProfileAvatar,
  SkeletonPanel,
  SkeletonTiles,
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from '@/components/apivue/ProfileBits';
import { toast } from '@/hooks/use-toast';

/* ============================================================
 * Helpers
 * ============================================================ */

function pick<T>(...values: Array<T | undefined | null>): T | undefined {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function toDateString(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

function toDateTimeString(iso: string | undefined | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

/* ============================================================
 * Component
 * ============================================================ */

export function ProfileDetailView() {
  const { id: profileId } = useParams<{ id: string }>();
  const { data: profiles = [], isLoading } = useTrackedProfiles();
  const { data: snapshots = [] } = useProfileSnapshots(profileId);
  const sync = useSyncProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [historyKey, setHistoryKey] = useState<string | null>(null);

  const profile = profiles.find((p) => p.id === profileId);
  const integration = profile ? getIntegration(profile.platform) : null;

  /* ---------- Snapshot series ---------- */

  const snapshotSeries = useMemo(() => {
    if (!profile || snapshots.length === 0) return [];

    // Collect all metric keys across snapshots.
    const keys = new Set<string>();
    for (const s of snapshots) {
      for (const k of Object.keys(s.metrics ?? {})) keys.add(k);
    }

    return Array.from(keys).map((key) => ({
      key,
      label:
        profile.data?.metrics?.find((m) => m.key === key)?.label ??
        key.replace(/_/g, ' '),
      points: snapshots.map((s) => ({
        date: new Date(s.captured_at).toLocaleDateString(),
        value: s.metrics[key] ?? 0,
      })),
    }));
  }, [profile, snapshots]);

  const activeHistoryKey = historyKey ?? snapshotSeries[0]?.key ?? null;
  const activeHistory = snapshotSeries.find((s) => s.key === activeHistoryKey);

  /* ---------- Early states ---------- */

  if (isLoading) {
    return (
      <div className="max-w-6xl space-y-6 p-4 sm:p-6">
        <SkeletonTiles />
        <SkeletonPanel />
      </div>
    );
  }

  if (!profile || !integration) {
    return (
      <div className="max-w-2xl p-4 sm:p-6">
        <h1 className="mb-2 text-lg font-semibold">Profile not found</h1>
        <p className="mb-5 text-sm text-muted-foreground">
          This profile is no longer tracked.
        </p>
        <Link to="/dashboard/profiles">
          <Button size="sm" variant="outline">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to profiles
          </Button>
        </Link>
      </div>
    );
  }

  /* ---------- Normalized fields ---------- */

  const displayName = pick(profile.displayName, profile.display_name, profile.handle);
  const profileUrl = pick(profile.profileUrl, profile.profile_url);
  const lastSynced = pick(profile.lastSyncedAt, profile.last_synced_at);
  const syncError = pick(profile.syncError, profile.sync_error);

  const data = profile.data ?? {};
  const activity = (data.activity ?? []).slice(-120);
  const hasBreakdowns = (data.breakdowns ?? []).length > 0;
  const hasRatingHistory = (data.ratingHistory ?? []).length > 0;
  const hasHighlights = (data.highlights ?? []).length > 0;
  const hasMetrics = (data.metrics ?? []).length > 0;

  /* ---------- Refresh ---------- */

  const refresh = async () => {
    setRefreshing(true);
    try {
      await sync.mutateAsync({
        platform: profile.platform,
        handle: profile.handle,
      });
      toast({
        title: 'Refreshed',
        description: 'Latest public data pulled in.',
      });
    } catch (err) {
      toast({
        title: 'Refresh failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  /* ---------- Render ---------- */

  return (
    <div className="max-w-6xl space-y-6 p-4 sm:p-6">
      <Link
        to="/dashboard/profiles"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Profiles
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <ProfileAvatar profile={profile} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold">{displayName}</h1>
            <PlatformChip platform={profile.platform} />
          </div>

          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            @{profile.handle}
          </p>

          {data.bio && (
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">
              {data.bio}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
            {data.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {data.location}
              </span>
            )}
            {data.joinedAt && <span>Joined {toDateString(data.joinedAt)}</span>}
            {lastSynced && <span>Synced {toDateTimeString(lastSynced)}</span>}
            {syncError && (
              <span className="text-destructive">Sync error: {syncError}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Button size="sm" variant="outline">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                View on {integration.name}
              </Button>
            </a>
          )}
          <Button size="sm" onClick={refresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats" className="text-xs">
            Statistics
          </TabsTrigger>
          <TabsTrigger value="breakdowns" className="text-xs">
            Breakdowns
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">
            Activity
          </TabsTrigger>
          <TabsTrigger value="progress" className="text-xs">
            Progress
          </TabsTrigger>
        </TabsList>

        {/* ---------- Statistics ---------- */}
        <TabsContent value="stats" className="mt-5 space-y-6">
          {hasMetrics ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {(data.metrics ?? []).map((m) => (
                <MetricTile key={m.key} metric={m} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This platform did not provide any metrics on the last sync.
            </p>
          )}

          {hasRatingHistory && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">
                Contest rating history
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.ratingHistory}>
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
                    name="Rating"
                    stroke={integration.accent}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {hasHighlights && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Highlights</h2>
              <div className="space-y-2">
                {(data.highlights ?? []).map((h, i) => (
                  <div
                    key={`${h.title}-${i}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                  >
                    <div className="min-w-0 flex-1">
                      {h.url ? (
                        <a
                          href={h.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="block truncate text-xs font-medium hover:text-primary"
                        >
                          {h.title}
                        </a>
                      ) : (
                        <p className="truncate text-xs font-medium">
                          {h.title}
                        </p>
                      )}
                      {h.subtitle && (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {h.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ---------- Breakdowns ---------- */}
        <TabsContent value="breakdowns" className="mt-5">
          {!hasBreakdowns ? (
            <p className="text-sm text-muted-foreground">
              This platform does not expose breakdown data.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {(data.breakdowns ?? []).map((b) => (
                <div
                  key={b.key}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <h2 className="mb-4 text-sm font-semibold">
                    {b.label}
                    {b.unit && (
                      <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                        ({b.unit})
                      </span>
                    )}
                  </h2>

                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(200, b.items.length * 26)}
                  >
                    <BarChart
                      data={b.items}
                      layout="vertical"
                      margin={{ left: 8 }}
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
                        dataKey="label"
                        tick={chartAxisStyle}
                        axisLine={false}
                        tickLine={false}
                        width={110}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {b.items.map((item, i) => (
                          <Cell
                            key={item.label}
                            fill={i === 0 ? integration.accent : 'hsl(var(--primary))'}
                            fillOpacity={Math.max(0.3, 1 - i * 0.07)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---------- Activity ---------- */}
        <TabsContent value="activity" className="mt-5">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No day-level activity history is available from this platform.
            </p>
          ) : (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold">Activity history</h2>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={activity}>
                  <defs>
                    <linearGradient
                      id="detailActivity"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={integration.accent}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor={integration.accent}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={integration.accent}
                    fill="url(#detailActivity)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>

        {/* ---------- Progress ---------- */}
        <TabsContent value="progress" className="mt-5 space-y-4">
          {snapshots.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Progress needs at least two syncs. Refresh this profile again
              later to start building history. APIVue never estimates
              progress from a single snapshot.
            </p>
          ) : (
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Progress over time</h2>

                <div className="flex flex-wrap gap-1.5">
                  {snapshotSeries.map((s) => {
                    const active = (activeHistoryKey ?? '') === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setHistoryKey(s.key)}
                        className={`rounded border px-2 py-1 text-[10px] transition-colors ${
                          active
                            ? 'border-primary bg-primary/10 font-medium text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeHistory && (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={activeHistory.points}>
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
                      domain={['auto', 'auto']}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={activeHistory.label}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {snapshots.length >= 2 && activeHistory && activeHistory.points.length >= 2 && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {activeHistory.label}
              </span>{' '}
              moved from{' '}
              <span className="font-semibold text-foreground">
                {formatMetric(activeHistory.points[0].value)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-foreground">
                {formatMetric(
                  activeHistory.points[activeHistory.points.length - 1].value,
                )}
              </span>{' '}
              across {snapshots.length} syncs.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}