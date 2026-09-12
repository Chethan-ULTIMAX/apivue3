import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import {
  formatMetric,
  getIntegration,
  type Metric,
  type TrackedProfile,
} from '@/lib/integrations/registry';

/* ============================================================
 * Platform icon
 * ============================================================ */

export function PlatformIcon({
  platform,
  className = 'h-4 w-4',
}: {
  platform: string;
  className?: string;
}) {
  const integration = getIntegration(platform);
  const Icon = integration.icon;
  return <Icon className={className} style={{ color: integration.accent }} />;
}

/* ============================================================
 * Profile avatar
 * ============================================================ */

type AvatarProfile = Pick<
  TrackedProfile,
  'handle' | 'platform'
> & {
  avatarUrl?: string | null;
  avatar_url?: string | null;
  displayName?: string | null;
  display_name?: string | null;
};

function initialsFrom(label: string): string {
  return label
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileAvatar({
  profile,
  size = 'md',
}: {
  profile: AvatarProfile;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'sm'
      ? 'h-7 w-7 text-[10px]'
      : size === 'md'
        ? 'h-10 w-10 text-xs'
        : 'h-14 w-14 text-base';

  const label = profile.displayName ?? profile.display_name ?? profile.handle;
  const avatarUrl = profile.avatarUrl ?? profile.avatar_url ?? null;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${label} avatar on ${getIntegration(profile.platform).name}`}
        loading="lazy"
        className={`${sizeClass} shrink-0 rounded-full border border-border object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary`}
      title={label}
    >
      {initialsFrom(label)}
    </div>
  );
}

/* ============================================================
 * Metric tile
 * ============================================================ */

export function MetricTile({
  metric,
  delta,
}: {
  metric: Metric;
  delta?: number | null;
}) {
  const deltaClass =
    delta === undefined || delta === null
      ? ''
      : delta > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : delta < 0
          ? 'text-destructive'
          : 'text-muted-foreground';

  const DeltaIcon =
    delta === undefined || delta === null
      ? null
      : delta > 0
        ? ArrowUpRight
        : delta < 0
          ? ArrowDownRight
          : Minus;

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <p className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {metric.label}
      </p>

      <div className="flex items-end justify-between gap-2">
        <p className="text-xl font-semibold tabular-nums tracking-tight">
          {formatMetric(metric.value, metric.format)}
        </p>

        {DeltaIcon && delta !== undefined && delta !== null && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${deltaClass}`}
          >
            <DeltaIcon className="h-3 w-3" />
            {delta === 0
              ? 'flat'
              : `${delta > 0 ? '+' : ''}${delta.toLocaleString()}`}
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * Platform chip
 * ============================================================ */

export function PlatformChip({ platform }: { platform: string }) {
  const integration = getIntegration(platform);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-medium"
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

/* ============================================================
 * Skeletons
 * ============================================================ */

export function SkeletonPanel({ height = 240 }: { height?: number }) {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-card p-5">
      <div className="mb-4 h-4 w-32 rounded bg-muted" />
      <div className="rounded bg-muted/50" style={{ height }} />
    </div>
  );
}

export function SkeletonTiles({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-border bg-card p-4"
        >
          <div className="mb-3 h-2.5 w-20 rounded bg-muted" />
          <div className="h-6 w-16 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 * Chart theme tokens
 * ============================================================ */

export const chartAxisStyle = {
  fontSize: 11,
  fill: 'hsl(var(--muted-foreground))',
} as const;

export const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'hsl(var(--popover-foreground))',
} as const;

export const chartGridStroke = 'hsl(var(--border))';