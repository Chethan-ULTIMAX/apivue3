import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GitCompareArrows, Info, Plus, Search, X } from 'lucide-react';

import { useTrackedProfiles } from '@/hooks/use-profiles';
import { formatMetric, getIntegration } from '@/lib/integrations/registry';
import type { TrackedProfile } from '@/lib/integrations/registry';
import {
  explorePublicProfile,
  type PublicDataResult,
  type PublicPlatform,
} from '@/lib/public-data';
import {
  ProfileAvatar,
  PlatformChip,
  SkeletonPanel,
  chartAxisStyle,
  chartGridStroke,
  chartTooltipStyle,
} from '@/components/apivue/ProfileBits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

/* ============================================================
 * Constants
 * ============================================================ */

const SERIES_COLORS = [
  'hsl(var(--primary))',
  'hsl(199 89% 48%)',
  'hsl(142 71% 45%)',
  'hsl(25 95% 53%)',
  'hsl(280 67% 60%)',
];

/* ============================================================
 * Types
 * ============================================================ */

interface CompareProfile {
  id: string;
  platform: string;
  handle: string;
  display_name?: string;
  avatar_url?: string | null;
  profile_url?: string;
  data?: TrackedProfile['data'];
  source: 'tracked' | 'explored';
}

/* ============================================================
 * Helpers
 * ============================================================ */

function metricKeyFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Converts explored public-profile data into the shape used by
 * tracked profiles. Activity is grouped by day so it is comparable
 * with tracked profile activity.
 */
function exploreToCompareProfile(
  explored: PublicDataResult,
): CompareProfile {
  const profile = explored.profile;

  const activityByDay = new Map<string, number>();
  for (const item of explored.activity) {
    const key = item.timestamp.slice(0, 10);
    activityByDay.set(key, (activityByDay.get(key) ?? 0) + 1);
  }

  return {
    id: `explored-${explored.platform}-${profile.username}`,
    platform: explored.platform,
    handle: profile.username,
    display_name: profile.displayName ?? undefined,
    avatar_url: profile.avatarUrl,
    profile_url: profile.profileUrl,
    source: 'explored',
    data: {
      bio: profile.bio ?? undefined,
      location: profile.location ?? undefined,
      joinedAt: profile.joinedAt ?? undefined,
      metrics: explored.metrics.map((m) => ({
        key: metricKeyFromLabel(m.label),
        label: m.label,
        value: m.value,
        format: typeof m.value === 'number' ? 'number' : undefined,
      })),
      activity: Array.from(activityByDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      breakdowns: (explored.breakdowns ?? []).map((breakdown) => ({
        key: breakdown.label,
        label: breakdown.label,
        items: breakdown.items,
      })),
    },
  };
}

/* ============================================================
 * Component
 * ============================================================ */

export function CompareView() {
  const location = useLocation();
  const { data: trackedProfiles = [], isLoading } = useTrackedProfiles();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exploredProfiles, setExploredProfiles] = useState<CompareProfile[]>([]);

  const [searchPlatform, setSearchPlatform] = useState<PublicPlatform>('github');
  const [searchHandle, setSearchHandle] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  /* ---------- Consume profile passed from Explore ---------- */

  const exploredProfileFromState = (
    location.state as { exploreProfile?: PublicDataResult } | null
  )?.exploreProfile;

  useEffect(() => {
    if (!exploredProfileFromState) return;
    const profile = exploreToCompareProfile(exploredProfileFromState);
    setExploredProfiles((prev) =>
      prev.some((p) => p.id === profile.id) ? prev : [...prev, profile],
    );
  }, [exploredProfileFromState]);

  /* ---------- Merge tracked + explored ---------- */

  const allProfiles = useMemo<CompareProfile[]>(
    () => [
      ...trackedProfiles.map(
        (p): CompareProfile => ({ ...p, source: 'tracked' }),
      ),
      ...exploredProfiles,
    ],
    [trackedProfiles, exploredProfiles],
  );

  /* ---------- Auto-select first two on first load ---------- */

  useEffect(() => {
    if (selectedIds.length === 0 && allProfiles.length >= 2) {
      setSelectedIds(allProfiles.slice(0, 2).map((p) => p.id));
    }
    // Intentionally depend on length only — we don't want to reset
    // selections every time the array identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProfiles.length]);

  /* ---------- Selection ---------- */

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const removeExploredProfile = (id: string) => {
    setExploredProfiles((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => prev.filter((s) => s !== id));
  };

  /* ---------- Chosen profiles (for display) ---------- */

  const chosen = useMemo(
    () => allProfiles.filter((p) => selectedIds.includes(p.id)),
    [allProfiles, selectedIds],
  );

  /* ---------- Shared numeric metrics ---------- */

  const sharedMetrics = useMemo(() => {
    if (chosen.length < 2) return [];

    const seen = new Map<string, { label: string; format?: string; hits: number }>();
    for (const p of chosen) {
      for (const m of p.data?.metrics ?? []) {
        if (typeof m.value !== 'number') continue;
        const existing = seen.get(m.key);
        if (existing) existing.hits += 1;
        else seen.set(m.key, { label: m.label, format: m.format, hits: 1 });
      }
    }

    return Array.from(seen.entries())
      .filter(([, v]) => v.hits === chosen.length)
      .map(([key, v]) => ({ key, label: v.label, format: v.format }));
  }, [chosen]);

  /* ---------- Comparison rows ---------- */

  const comparisonRows = useMemo(() => {
    return sharedMetrics.map((m) => ({
      metric: m.label,
      ...Object.fromEntries(
        chosen.map((p) => {
          const value = p.data?.metrics?.find((x) => x.key === m.key)?.value;
          return [p.handle, typeof value === 'number' ? value : 0];
        }),
      ),
    }));
  }, [sharedMetrics, chosen]);

  /* ---------- Radar: only for metrics where all profiles have the key ---------- */

  const radarData = useMemo(() => {
    return sharedMetrics.slice(0, 6).map((m) => {
      const values = chosen.map((p) => {
        const v = p.data?.metrics?.find((x) => x.key === m.key)?.value;
        return typeof v === 'number' ? v : 0;
      });
      const max = Math.max(...values, 1);
      return {
        metric: m.label,
        ...Object.fromEntries(
          chosen.map((p, i) => [p.handle, Math.round((values[i] / max) * 100)]),
        ),
      };
    });
  }, [sharedMetrics, chosen]);

  /* ---------- Rating overlay (only when at least 2 profiles have history) ---------- */

  const ratingOverlay = useMemo(() => {
    const withRating = chosen.filter(
      (p) => (p.data?.ratingHistory?.length ?? 0) > 0,
    );
    if (withRating.length < 2) return [];

    const byDate: Record<string, Record<string, string | number>> = {};
    for (const p of withRating) {
      for (const point of p.data?.ratingHistory ?? []) {
        byDate[point.date] = {
          ...(byDate[point.date] ?? { date: point.date }),
          [p.handle]: point.value,
        };
      }
    }
    return Object.values(byDate).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  }, [chosen]);

  /* ---------- Add profile via public search ---------- */

  const handleExploreSearch = async () => {
    if (!searchHandle.trim()) return;
    setSearchLoading(true);

    try {
      const result = await explorePublicProfile(searchPlatform, searchHandle);
      const profile = exploreToCompareProfile(result);

      setExploredProfiles((prev) =>
        prev.some((p) => p.id === profile.id) ? prev : [...prev, profile],
      );
      setSelectedIds((prev) =>
        prev.includes(profile.id) ? prev : [...prev, profile.id],
      );
      setSearchHandle('');

      toast({
        title: 'Profile added',
        description: `${profile.handle} on ${getIntegration(profile.platform).name} added to comparison.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to add profile',
        description:
          error instanceof Error ? error.message : 'Unknown error.',
        variant: 'destructive',
      });
    } finally {
      setSearchLoading(false);
    }
  };

  /* ---------- Loading ---------- */

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
        <h1 className="text-lg font-semibold">Compare</h1>
        <SkeletonPanel />
      </div>
    );
  }

  /* ---------- Main render ---------- */

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold">Compare</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Pick profiles to line up side by side on shared numeric metrics.
          Comparisons are heuristic — different platforms measure different
          things.
        </p>
      </div>

      {/* Add profile via public search */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 p-3">
        <select
          value={searchPlatform}
          onChange={(e) => setSearchPlatform(e.target.value as PublicPlatform)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="github">GitHub</option>
          <option value="codeforces">Codeforces</option>
          <option value="leetcode">LeetCode</option>
          <option value="codewars">Codewars</option>
          <option value="stackoverflow">Stack Overflow</option>
        </select>

        <Input
          value={searchHandle}
          onChange={(e) => setSearchHandle(e.target.value)}
          placeholder={
            searchPlatform === 'stackoverflow'
              ? 'User ID (numeric)'
              : 'Username / handle'
          }
          className="w-48"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !searchLoading) handleExploreSearch();
          }}
        />

        <Button
          size="sm"
          onClick={handleExploreSearch}
          disabled={searchLoading}
          className="gap-2"
        >
          <Search className="h-3.5 w-3.5" />
          {searchLoading ? 'Adding…' : 'Add to compare'}
        </Button>
      </div>

      {/* Empty state */}
      {allProfiles.length < 2 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center">
          <GitCompareArrows className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">
            Add at least two profiles to compare
          </p>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            Search a public profile above, or connect tracked profiles from
            Integrations. Comparisons work within a platform or across them.
          </p>
        </div>
      )}

      {allProfiles.length >= 2 && (
        <>
          {/* Profile chips */}
          <div className="flex flex-wrap gap-2">
            {allProfiles.map((p) => {
              const active = selectedIds.includes(p.id);
              return (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all hover:-translate-y-0.5 ${
                      active
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <ProfileAvatar profile={p} size="sm" />
                    <span className="max-w-[140px] truncate">
                      {p.display_name || p.handle}
                    </span>
                    <PlatformChip platform={p.platform} />
                  </button>

                  {p.source === 'explored' && (
                    <button
                      type="button"
                      onClick={() => removeExploredProfile(p.id)}
                      className="text-muted-foreground transition hover:text-destructive"
                      title="Remove"
                      aria-label={`Remove ${p.handle}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Comparison body */}
          {chosen.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Select two or more profiles above.
            </p>
          ) : sharedMetrics.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card/40 p-6 text-center">
              <Info className="mx-auto h-6 w-6 text-muted-foreground/60" />
              <p className="mt-3 text-sm font-medium">
                No shared numeric metrics
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                These profiles don&apos;t expose the same numeric metrics.
                Try comparing two profiles on the same platform.
              </p>
            </div>
          ) : (
            <>
              {/* Metric table */}
              <div className="rounded-lg border border-border bg-card p-5 overflow-x-auto">
                <h2 className="mb-4 text-sm font-semibold">Metric table</h2>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Metric</th>
                      {chosen.map((p) => (
                        <th
                          key={p.id}
                          className="py-2 pr-4 font-medium whitespace-nowrap"
                        >
                          {p.display_name || p.handle}
                          <span className="block text-[10px] font-normal text-muted-foreground">
                            {getIntegration(p.platform).name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sharedMetrics.map((m) => {
                      const values = chosen.map((p) => {
                        const v = p.data?.metrics?.find(
                          (x) => x.key === m.key,
                        )?.value;
                        return typeof v === 'number' ? v : 0;
                      });
                      const best = Math.max(...values);

                      return (
                        <tr key={m.key} className="border-t border-border">
                          <td className="py-2 pr-4 text-muted-foreground">
                            {m.label}
                          </td>
                          {chosen.map((p, i) => (
                            <td
                              key={p.id}
                              className={`py-2 pr-4 tabular-nums ${
                                values[i] === best && best > 0
                                  ? 'font-semibold text-primary'
                                  : ''
                              }`}
                            >
                              {formatMetric(values[i], m.format)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-5">
                  <h2 className="mb-4 text-sm font-semibold">Side by side</h2>
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(260, comparisonRows.length * 36)}
                  >
                    <BarChart
                      data={comparisonRows}
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
                        dataKey="metric"
                        tick={chartAxisStyle}
                        axisLine={false}
                        tickLine={false}
                        width={120}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {chosen.map((p, i) => (
                        <Bar
                          key={p.id}
                          dataKey={p.handle}
                          fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                          radius={[0, 4, 4, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-lg border border-border bg-card p-5">
                  <h2 className="mb-1 text-sm font-semibold">
                    Relative strengths
                  </h2>
                  <p className="mb-4 text-[10px] text-muted-foreground">
                    Each metric is normalized to its own maximum, so this view
                    is best used within a single platform.
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={chartGridStroke} />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ ...chartAxisStyle, fontSize: 10 }}
                      />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {chosen.map((p, i) => (
                        <Radar
                          key={p.id}
                          dataKey={p.handle}
                          stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                          fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                          fillOpacity={0.18}
                        />
                      ))}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rating overlay */}
              {ratingOverlay.length > 1 && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <h2 className="mb-4 text-sm font-semibold">
                    Contest rating, overlaid
                  </h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={ratingOverlay}>
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
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {chosen.map((p, i) => (
                        <Line
                          key={p.id}
                          type="monotone"
                          dataKey={p.handle}
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
            </>
          )}
        </>
      )}
    </div>
  );
}