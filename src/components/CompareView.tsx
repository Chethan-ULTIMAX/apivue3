import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GitCompareArrows } from "lucide-react";
import { useTrackedProfiles } from "@/hooks/use-profiles";
import { formatMetric, getIntegration } from "@/lib/integrations/registry";
import { PlatformChip, ProfileAvatar, SkeletonPanel, chartAxisStyle, chartGridStroke, chartTooltipStyle } from "@/components/apivue/ProfileBits";

const SERIES_COLORS = ["hsl(var(--primary))", "hsl(199 89% 48%)", "hsl(142 71% 45%)", "hsl(25 95% 53%)", "hsl(280 67% 60%)"];

export function CompareView() {
  const { data: profiles = [], isLoading } = useTrackedProfiles();
  const [selected, setSelected] = useState<string[]>([]);

  const chosen = useMemo(() => {
    const ids = selected.length ? selected : profiles.slice(0, 2).map((p) => p.id);
    return profiles.filter((p) => ids.includes(p.id));
  }, [profiles, selected]);

  const sharedMetrics = useMemo(() => {
    if (chosen.length === 0) return [];
    const counts: Record<string, { label: string; format: any; seen: number }> = {};
    for (const p of chosen) {
      for (const m of p.data?.metrics ?? []) {
        if (typeof m.value !== "number") continue;
        counts[m.key] = { label: m.label, format: m.format, seen: (counts[m.key]?.seen ?? 0) + 1 };
      }
    }
    return Object.entries(counts)
      .filter(([, v]) => v.seen === chosen.length)
      .map(([key, v]) => ({ key, label: v.label, format: v.format }));
  }, [chosen]);

  const comparisonRows = sharedMetrics.map((m) => ({
    metric: m.label,
    ...Object.fromEntries(
      chosen.map((p) => {
        const value = p.data?.metrics?.find((x) => x.key === m.key)?.value;
        return [p.handle, typeof value === "number" ? value : 0];
      }),
    ),
  }));

  const radarData = sharedMetrics.slice(0, 6).map((m) => {
    const values = chosen.map((p) => {
      const v = p.data?.metrics?.find((x) => x.key === m.key)?.value;
      return typeof v === "number" ? v : 0;
    });
    const max = Math.max(...values, 1);
    return {
      metric: m.label,
      ...Object.fromEntries(chosen.map((p, i) => [p.handle, Math.round((values[i] / max) * 100)])),
    };
  });

  const ratingOverlay = useMemo(() => {
    const byDate: Record<string, any> = {};
    for (const p of chosen) {
      for (const point of p.data?.ratingHistory ?? []) {
        byDate[point.date] = { ...(byDate[point.date] ?? { date: point.date }), [p.handle]: point.value };
      }
    }
    return Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [chosen]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const base = prev.length ? prev : profiles.slice(0, 2).map((p) => p.id);
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
        <h1 className="text-lg font-semibold">Compare</h1>
        <SkeletonPanel />
      </div>
    );
  }

  if (profiles.length < 2) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl">
        <h1 className="text-lg font-semibold mb-8">Compare</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-card/40">
          <GitCompareArrows className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium mb-1">Add at least two profiles</p>
          <p className="text-xs text-muted-foreground">Comparisons work across users on the same platform or across platforms.</p>
        </div>
      </div>
    );
  }

  const activeIds = chosen.map((p) => p.id);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold">Compare</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Pick profiles to line up side by side on shared metrics.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {profiles.map((p) => {
          const active = activeIds.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all hover:-translate-y-0.5 ${
                active ? "border-primary bg-primary/5 font-medium" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <ProfileAvatar profile={p} size="sm" />
              <span className="truncate max-w-[140px]">{p.display_name || p.handle}</span>
              <PlatformChip platform={p.platform} />
            </button>
          );
        })}
      </div>

      {chosen.length < 2 ? (
        <p className="text-sm text-muted-foreground">Select two or more profiles above.</p>
      ) : sharedMetrics.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          These profiles have no numeric metrics in common. Try comparing two profiles on the same platform.
        </p>
      ) : (
        <>
          <div className="bg-card border border-border rounded-lg p-5 overflow-x-auto">
            <h2 className="text-sm font-semibold mb-4">Metric table</h2>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Metric</th>
                  {chosen.map((p) => (
                    <th key={p.id} className="py-2 pr-4 font-medium whitespace-nowrap">
                      {p.display_name || p.handle}
                      <span className="block text-[10px] font-normal text-muted-foreground">{getIntegration(p.platform).name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sharedMetrics.map((m) => {
                  const values = chosen.map((p) => {
                    const v = p.data?.metrics?.find((x) => x.key === m.key)?.value;
                    return typeof v === "number" ? v : 0;
                  });
                  const best = Math.max(...values);
                  return (
                    <tr key={m.key} className="border-t border-border">
                      <td className="py-2 pr-4 text-muted-foreground">{m.label}</td>
                      {chosen.map((p, i) => (
                        <td
                          key={p.id}
                          className={`py-2 pr-4 tabular-nums ${values[i] === best ? "font-semibold text-primary" : ""}`}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold mb-4">Side by side</h2>
              <ResponsiveContainer width="100%" height={Math.max(260, comparisonRows.length * 36)}>
                <BarChart data={comparisonRows} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
                  <XAxis type="number" tick={chartAxisStyle} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="metric" tick={chartAxisStyle} axisLine={false} tickLine={false} width={120} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {chosen.map((p, i) => (
                    <Bar key={p.id} dataKey={p.handle} fill={SERIES_COLORS[i % SERIES_COLORS.length]} radius={[0, 4, 4, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold mb-4">Relative strengths</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={chartGridStroke} />
                  <PolarAngleAxis dataKey="metric" tick={{ ...chartAxisStyle, fontSize: 10 }} />
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

          {ratingOverlay.length > 1 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold mb-4">Contest rating, overlaid</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={ratingOverlay}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                  <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
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
    </div>
  );
}
