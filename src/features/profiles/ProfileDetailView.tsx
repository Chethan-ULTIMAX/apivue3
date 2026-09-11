import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
} from "recharts";
import { ArrowLeft, ExternalLink, Loader2, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfileSnapshots, useSyncProfile, useTrackedProfiles } from "@/hooks/use-profiles";
import { formatMetric, getIntegration } from "@/lib/integrations/registry";
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

export function ProfileDetailView() {
  const { profileId } = useParams<{ profileId: string }>();
  const { data: profiles = [], isLoading } = useTrackedProfiles();
  const { data: snapshots = [] } = useProfileSnapshots(profileId);
  const sync = useSyncProfile();
  const [refreshing, setRefreshing] = useState(false);

  const profile = profiles.find((p) => p.id === profileId);
  const integration = profile ? getIntegration(profile.platform) : null;

  const snapshotSeries = useMemo(() => {
    if (!profile) return [];
    const keys = Object.keys(snapshots.at(-1)?.metrics ?? {});
    return keys.map((key) => ({
      key,
      label: profile.data?.metrics?.find((m) => m.key === key)?.label ?? key,
      points: snapshots.map((s) => ({
        date: new Date(s.captured_at).toLocaleDateString(),
        value: s.metrics[key] ?? 0,
      })),
    }));
  }, [profile, snapshots]);

  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const activeHistory = snapshotSeries.find((s) => s.key === (historyKey ?? snapshotSeries[0]?.key));

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
        <SkeletonTiles />
        <SkeletonPanel />
      </div>
    );
  }

  if (!profile || !integration) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl">
        <h1 className="text-lg font-semibold mb-2">Profile not found</h1>
        <p className="text-sm text-muted-foreground mb-5">This profile is no longer tracked.</p>
        <Link to="/dashboard/profiles">
          <Button size="sm" variant="outline">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to profiles
          </Button>
        </Link>
      </div>
    );
  }

  const data = profile.data ?? ({} as typeof profile.data);
  const activity = (data.activity ?? []).slice(-120);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await sync.mutateAsync({ platform: profile.platform, handle: profile.handle });
      toast({ title: "Refreshed", description: "Latest public data pulled in." });
    } catch (err) {
      toast({ title: "Refresh failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
      <Link to="/dashboard/profiles" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Profiles
      </Link>

      <div className="flex items-start gap-4 flex-wrap">
        <ProfileAvatar profile={profile} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold truncate">{profile.display_name || profile.handle}</h1>
            <PlatformChip platform={profile.platform} />
          </div>
          <p className="text-xs text-muted-foreground font-mono-id mt-0.5">@{profile.handle}</p>
          {data.bio && <p className="text-xs text-muted-foreground mt-2 max-w-xl leading-relaxed">{data.bio}</p>}
          <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
            {data.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {data.location}
              </span>
            )}
            {data.joinedAt && <span>Joined {new Date(data.joinedAt).toLocaleDateString()}</span>}
            {profile.last_synced_at && <span>Synced {new Date(profile.last_synced_at).toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile.profile_url && (
            <a href={profile.profile_url} target="_blank" rel="noreferrer noopener">
              <Button size="sm" variant="outline">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View on {integration.name}
              </Button>
            </a>
          )}
          <Button size="sm" onClick={refresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats" className="text-xs">Statistics</TabsTrigger>
          <TabsTrigger value="breakdowns" className="text-xs">Breakdowns</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
          <TabsTrigger value="progress" className="text-xs">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6 mt-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(data.metrics ?? []).map((m) => (
              <MetricTile key={m.key} metric={m} />
            ))}
          </div>

          {(data.ratingHistory ?? []).length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold mb-4">Contest rating history</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.ratingHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                  <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="value" stroke={integration.accent} strokeWidth={2} dot={false} name="Rating" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {(data.highlights ?? []).length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold mb-4">Highlights</h2>
              <div className="space-y-2">
                {data.highlights.map((h, i) => (
                  <div key={`${h.title}-${i}`} className="flex items-center gap-3 border border-border rounded-lg p-3 bg-background">
                    <div className="min-w-0 flex-1">
                      {h.url ? (
                        <a href={h.url} target="_blank" rel="noreferrer noopener" className="text-xs font-medium hover:text-primary truncate block">
                          {h.title}
                        </a>
                      ) : (
                        <p className="text-xs font-medium truncate">{h.title}</p>
                      )}
                      {h.subtitle && <p className="text-[11px] text-muted-foreground truncate">{h.subtitle}</p>}
                    </div>
                    {h.subtitle && (
                      <span className="text-xs font-semibold tabular-nums">
                        {h.subtitle}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="breakdowns" className="mt-5">
          {(data.breakdowns ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">This platform does not expose breakdown data.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.breakdowns.map((b) => (
                <div key={b.key} className="bg-card border border-border rounded-lg p-5">
                  <h2 className="text-sm font-semibold mb-4">
                    {b.label}
                    {b.unit && <span className="text-[11px] text-muted-foreground font-normal ml-1.5">({b.unit})</span>}
                  </h2>
                  <ResponsiveContainer width="100%" height={Math.max(200, b.items.length * 26)}>
                    <BarChart data={b.items} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
                      <XAxis type="number" tick={chartAxisStyle} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={chartAxisStyle} axisLine={false} tickLine={false} width={110} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {b.items.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? integration.accent : "hsl(var(--primary))"} fillOpacity={1 - i * 0.07} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity history available from this platform.</p>
          ) : (
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold mb-4">Activity history</h2>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={activity}>
                  <defs>
                    <linearGradient id="detailActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={integration.accent} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={integration.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                  <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="count" stroke={integration.accent} fill="url(#detailActivity)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-5 space-y-4">
          {snapshots.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Progress needs at least two syncs. Refresh this profile again later to start building history.
            </p>
          ) : (
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="text-sm font-semibold">Progress over time</h2>
                <div className="flex flex-wrap gap-1.5">
                  {snapshotSeries.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setHistoryKey(s.key)}
                      className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                        (historyKey ?? snapshotSeries[0]?.key) === s.key
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {activeHistory && (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={activeHistory.points}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                    <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
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
          {snapshots.length >= 2 && activeHistory && (
            <p className="text-xs text-muted-foreground">
              {activeHistory.label} moved from{" "}
              <span className="font-semibold text-foreground">{formatMetric(activeHistory.points[0].value)}</span> to{" "}
              <span className="font-semibold text-foreground">{formatMetric(activeHistory.points.at(-1)!.value)}</span> across{" "}
              {snapshots.length} syncs.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
