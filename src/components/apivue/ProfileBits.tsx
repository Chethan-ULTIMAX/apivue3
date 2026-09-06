import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatMetric, getIntegration, type Metric, type TrackedProfile } from "@/lib/integrations/registry";

export function PlatformIcon({ platform, className = "h-4 w-4" }: { platform: string; className?: string }) {
  const integration = getIntegration(platform);
  const Icon = integration.icon;
  return <Icon className={className} style={{ color: integration.accent }} />;
}

export function ProfileAvatar({
  profile,
  size = "md",
}: {
  profile: Pick<TrackedProfile, "avatar_url" | "display_name" | "handle" | "platform">;
  size?: "sm" | "md" | "lg";
}) {
  const s = size === "sm" ? "h-7 w-7 text-[10px]" : size === "md" ? "h-10 w-10 text-xs" : "h-14 w-14 text-base";
  const label = profile.display_name || profile.handle;
  const initials = label
    .split(/[\s_-]+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={`${label} avatar on ${getIntegration(profile.platform).name}`}
        loading="lazy"
        className={`${s} rounded-full object-cover border border-border shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${s} rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center shrink-0`}
      title={label}
    >
      {initials}
    </div>
  );
}

export function MetricTile({
  metric,
  delta,
}: {
  metric: Metric;
  delta?: number | null;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{metric.label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="text-xl font-semibold tracking-tight tabular-nums">
          {formatMetric(metric.value, metric.format)}
        </p>
        {delta !== undefined && delta !== null && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
              delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : delta < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {delta === 0 ? "flat" : `${delta > 0 ? "+" : ""}${delta.toLocaleString()}`}
          </span>
        )}
      </div>
    </div>
  );
}

export function PlatformChip({ platform }: { platform: string }) {
  const integration = getIntegration(platform);
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded border"
      style={{
        color: integration.accent,
        borderColor: `color-mix(in srgb, ${integration.accent} 35%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${integration.accent} 12%, transparent)`,
      }}
    >
      <PlatformIcon platform={platform} className="h-3 w-3" />
      {integration.name}
    </span>
  );
}

export function SkeletonPanel({ height = 240 }: { height?: number }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-4" />
      <div className="bg-muted/50 rounded" style={{ height }} />
    </div>
  );
}

export function SkeletonTiles({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
          <div className="h-2.5 w-20 bg-muted rounded mb-3" />
          <div className="h-6 w-16 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

export function ChartTheme() {
  return null;
}

export const chartAxisStyle = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
export const chartTooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
};
export const chartGridStroke = "hsl(var(--border))";
