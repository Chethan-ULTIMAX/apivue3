/**
 * APIVue progress analytics.
 *
 * Pipeline: DATA -> HISTORY -> ANALYTICS -> INSIGHTS -> (AI GUIDANCE later).
 *
 * Everything here is a pure function over real stored data (tracked profiles and
 * their captured snapshots). No value is invented or estimated. A future AI layer
 * can consume `buildProgressReport()` verbatim as its context payload — no view
 * code needs to change.
 */
import {
  categories,
  getIntegration,
  type CategoryId,
  type ProfileSnapshot,
  type TrackedProfile,
} from "@/lib/integrations/registry";

export interface MetricHistoryPoint {
  date: string;
  value: number;
}

export interface MetricTrend {
  profileId: string;
  platform: string;
  handle: string;
  metricKey: string;
  label: string;
  first: MetricHistoryPoint;
  latest: MetricHistoryPoint;
  change: number;
  changePct: number | null;
  points: MetricHistoryPoint[];
}

export interface CategoryProgress {
  category: CategoryId;
  label: string;
  description: string;
  profiles: TrackedProfile[];
  trends: MetricTrend[];
  totalChange: number;
}

export interface ActivityStats {
  totalDays: number;
  activeDays: number;
  totalEvents: number;
  currentStreak: number;
  longestStreak: number;
  busiestDay: { date: string; count: number } | null;
  last7: number;
  previous7: number;
}

export interface ProgressObservation {
  id: string;
  kind: "growth" | "flat" | "coverage" | "activity" | "history";
  title: string;
  detail: string;
  /** Real numbers backing the observation, for a future AI layer. */
  evidence: Record<string, number | string>;
}

export interface ProgressReport {
  generatedAt: string;
  profileCount: number;
  snapshotCount: number;
  historyDays: number;
  trends: MetricTrend[];
  categoryProgress: CategoryProgress[];
  activity: ActivityStats;
  observations: ProgressObservation[];
}

function metricLabel(profile: TrackedProfile | undefined, key: string): string {
  const found = profile?.data?.metrics?.find((m) => m.key === key);
  return found?.label ?? key.replace(/_/g, " ");
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

/** Groups snapshots per profile and metric into ordered numeric history. */
export function buildTrends(profiles: TrackedProfile[], snapshots: ProfileSnapshot[]): MetricTrend[] {
  const byProfile = new Map<string, ProfileSnapshot[]>();
  for (const snap of snapshots) {
    const list = byProfile.get(snap.profile_id) ?? [];
    list.push(snap);
    byProfile.set(snap.profile_id, list);
  }

  const trends: MetricTrend[] = [];
  for (const profile of profiles) {
    const snaps = (byProfile.get(profile.id) ?? []).sort((a, b) =>
      a.captured_at.localeCompare(b.captured_at),
    );
    if (snaps.length < 2) continue;

    const keys = new Set<string>();
    for (const s of snaps) for (const k of Object.keys(s.metrics ?? {})) keys.add(k);

    for (const key of keys) {
      const points: MetricHistoryPoint[] = [];
      for (const s of snaps) {
        const raw = s.metrics?.[key];
        if (typeof raw !== "number" || Number.isNaN(raw)) continue;
        points.push({ date: dayKey(s.captured_at), value: raw });
      }
      if (points.length < 2) continue;
      const first = points[0];
      const latest = points[points.length - 1];
      const change = latest.value - first.value;
      trends.push({
        profileId: profile.id,
        platform: profile.platform,
        handle: profile.handle,
        metricKey: key,
        label: metricLabel(profile, key),
        first,
        latest,
        change,
        changePct: first.value > 0 ? Math.round((change / first.value) * 1000) / 10 : null,
        points,
      });
    }
  }
  return trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

/** Maps profiles and their trends into progress areas via integration categories. */
export function buildCategoryProgress(
  profiles: TrackedProfile[],
  trends: MetricTrend[],
): CategoryProgress[] {
  return categories
    .map((cat) => {
      const catProfiles = profiles.filter((p) => getIntegration(p.platform).categories.includes(cat.id));
      const ids = new Set(catProfiles.map((p) => p.id));
      const catTrends = trends.filter((t) => ids.has(t.profileId));
      return {
        category: cat.id,
        label: cat.label,
        description: cat.description,
        profiles: catProfiles,
        trends: catTrends,
        totalChange: catTrends.reduce((s, t) => s + (t.change > 0 ? t.change : 0), 0),
      };
    })
    .filter((c) => c.profiles.length > 0);
}

/** Merges every profile's public activity history into one daily timeline. */
export function mergeActivity(profiles: TrackedProfile[]): { date: string; count: number }[] {
  const byDay: Record<string, number> = {};
  for (const p of profiles) {
    for (const a of p.data?.activity ?? []) {
      if (!a?.date) continue;
      byDay[dayKey(a.date)] = (byDay[dayKey(a.date)] ?? 0) + (a.count ?? 0);
    }
  }
  return Object.entries(byDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computeActivityStats(timeline: { date: string; count: number }[]): ActivityStats {
  const active = timeline.filter((d) => d.count > 0);
  let longest = 0;
  let running = 0;
  let previousDate: Date | null = null;
  for (const day of timeline) {
    if (day.count <= 0) {
      running = 0;
      previousDate = null;
      continue;
    }
    const current = new Date(`${day.date}T00:00:00Z`);
    const consecutive =
      previousDate !== null && (current.getTime() - previousDate.getTime()) / 86_400_000 === 1;
    running = consecutive ? running + 1 : 1;
    longest = Math.max(longest, running);
    previousDate = current;
  }

  // Current streak: walk back from the most recent active day, if it is today or yesterday.
  let currentStreak = 0;
  if (active.length) {
    const last = active[active.length - 1];
    const lastTime = new Date(`${last.date}T00:00:00Z`).getTime();
    const today = new Date();
    const todayTime = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const gapDays = (todayTime - lastTime) / 86_400_000;
    currentStreak = 1;
    let cursor = lastTime;
    const activeSet = new Set(active.map((d) => d.date));
    for (;;) {
      cursor -= 86_400_000;
      const key = new Date(cursor).toISOString().slice(0, 10);
      if (!activeSet.has(key)) break;
      currentStreak += 1;
    }
  }

  const sum = (arr: { count: number }[]) => arr.reduce((s, d) => s + d.count, 0);
  const busiest = active.length
    ? active.reduce((best, d) => (d.count > best.count ? d : best), active[0])
    : null;

  return {
    totalDays: timeline.length,
    activeDays: active.length,
    totalEvents: sum(timeline),
    currentStreak,
    longestStreak: longest,
    busiestDay: busiest ? { date: busiest.date, count: busiest.count } : null,
    last7: sum(timeline.slice(-7)),
    previous7: sum(timeline.slice(-14, -7)),
  };
}

/** Deterministic observations derived only from real numbers. */
export function deriveObservations(
  profiles: TrackedProfile[],
  trends: MetricTrend[],
  activity: ActivityStats,
): ProgressObservation[] {
  const out: ProgressObservation[] = [];

  const growing = trends.filter((t) => t.change > 0).slice(0, 3);
  for (const t of growing) {
    out.push({
      id: `growth-${t.profileId}-${t.metricKey}`,
      kind: "growth",
      title: `${getIntegration(t.platform).name}: ${t.label} up ${t.change.toLocaleString()}`,
      detail: `From ${t.first.value.toLocaleString()} on ${t.first.date} to ${t.latest.value.toLocaleString()} on ${t.latest.date}.`,
      evidence: { metric: t.metricKey, from: t.first.value, to: t.latest.value, change: t.change },
    });
  }

  const flat = trends.filter((t) => t.change === 0).slice(0, 2);
  for (const t of flat) {
    out.push({
      id: `flat-${t.profileId}-${t.metricKey}`,
      kind: "flat",
      title: `${getIntegration(t.platform).name}: ${t.label} unchanged`,
      detail: `Held at ${t.latest.value.toLocaleString()} across ${t.points.length} recorded checks.`,
      evidence: { metric: t.metricKey, value: t.latest.value, checks: t.points.length },
    });
  }

  if (activity.totalDays > 0) {
    out.push({
      id: "activity-window",
      kind: "activity",
      title: `${activity.last7.toLocaleString()} events in the last 7 recorded days`,
      detail:
        activity.previous7 > 0
          ? `Previous 7 days: ${activity.previous7.toLocaleString()}. Longest active streak on record: ${activity.longestStreak} day${activity.longestStreak === 1 ? "" : "s"}.`
          : `Longest active streak on record: ${activity.longestStreak} day${activity.longestStreak === 1 ? "" : "s"}.`,
      evidence: { last7: activity.last7, previous7: activity.previous7, longestStreak: activity.longestStreak },
    });
  }

  const covered = new Set<CategoryId>();
  for (const p of profiles) for (const c of getIntegration(p.platform).categories) covered.add(c);
  const missing = categories.filter((c) => !covered.has(c.id) && c.id !== "goals");
  if (missing.length) {
    out.push({
      id: "coverage",
      kind: "coverage",
      title: `${covered.size} of ${categories.length} areas have data`,
      detail: `No connected source yet for: ${missing.map((m) => m.label).join(", ")}.`,
      evidence: { covered: covered.size, total: categories.length },
    });
  }

  if (trends.length === 0 && profiles.length > 0) {
    out.push({
      id: "history",
      kind: "history",
      title: "Not enough history for trends yet",
      detail: "Trends appear once a profile has been refreshed at least twice, so there are two points to compare.",
      evidence: { profiles: profiles.length },
    });
  }

  return out;
}

/** Single entry point: the payload an AI guidance layer will later read. */
export function buildProgressReport(
  profiles: TrackedProfile[],
  snapshots: ProfileSnapshot[],
): ProgressReport {
  const trends = buildTrends(profiles, snapshots);
  const timeline = mergeActivity(profiles);
  const activity = computeActivityStats(timeline);
  if (activity.currentStreak > 0 && timeline.length > 0) {
    const latestActive = timeline.filter((entry) => entry.count > 0).at(-1);
    if (latestActive) {
      const latestTime = new Date(`${latestActive.date}T00:00:00Z`).getTime();
      const now = new Date();
      const todayTime = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      if ((todayTime - latestTime) / 86_400_000 > 1) activity.currentStreak = 0;
    }
  }
  const dates = snapshots.map((s) => s.captured_at).sort();
  const historyDays =
    dates.length > 1
      ? Math.max(
          1,
          Math.round(
            (new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime()) / 86_400_000,
          ),
        )
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    profileCount: profiles.length,
    snapshotCount: snapshots.length,
    historyDays,
    trends,
    categoryProgress: buildCategoryProgress(profiles, trends),
    activity,
    observations: deriveObservations(profiles, trends, activity),
  };
}
