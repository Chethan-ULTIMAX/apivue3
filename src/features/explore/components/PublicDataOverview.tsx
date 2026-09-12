import { useMemo, useState } from 'react';
import type {
  PublicBreakdown,
  PublicDataResult,
  PublicRepository,
} from '@/lib/public-data';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Archive,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Code2,
  GitBranch,
  Layers3,
  Star,
  Tag,
  TrendingUp,
  Trophy,
} from 'lucide-react';

interface PublicDataOverviewProps {
  data: PublicDataResult;
}

type Panel = 'overview' | 'breakdowns' | 'activity' | 'repositories';

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formatRelativeDate(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function formatValue(value: string | number): string {
  return typeof value === 'number' ? value.toLocaleString() : value;
}

function MetricIcon({ index }: { index: number }) {
  const icons = [BarChart3, Trophy, TrendingUp, Layers3, Star, Code2];
  const Icon = icons[index % icons.length];
  return <Icon className="h-4 w-4" />;
}

function MetricsGrid({ metrics }: { metrics: PublicDataResult['metrics'] }) {
  const [active, setActive] = useState<string | null>(null);
  if (metrics.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric, index) => {
        const selected = active === metric.label;
        return (
          <motion.button
            key={metric.label}
            type="button"
            onClick={() => setActive(selected ? null : metric.label)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${selected ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/5' : 'border-border bg-card/40 hover:border-primary/20 hover:bg-card'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${selected ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground group-hover:text-foreground'}`}>
                <MetricIcon index={index} />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Public</span>
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{formatValue(metric.value)}</p>
            <AnimatePresence initial={false}>
              {selected && metric.description && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 overflow-hidden text-xs leading-5 text-muted-foreground">
                  {metric.description}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

function BreakdownSection({ breakdown }: { breakdown: PublicBreakdown }) {
  const [selected, setSelected] = useState<string | null>(null);
  if (breakdown.items.length === 0) return null;
  const max = Math.max(...breakdown.items.map((item) => item.value), 1);
  const total = breakdown.items.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div layout className="rounded-3xl border border-border bg-card/40 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary"><Tag className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.15em]">Distribution</span></div>
          <h3 className="mt-2 text-base font-semibold text-foreground">{breakdown.label}</h3>
          <p className="mt-1 text-xs text-muted-foreground">Click a row to inspect its share of the returned public data.</p>
        </div>
        <span className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{breakdown.items.length} groups</span>
      </div>

      <div className="mt-5 space-y-2">
        {breakdown.items.map((item, index) => {
          const width = Math.max((item.value / max) * 100, 3);
          const share = item.percentage ?? (total > 0 ? (item.value / total) * 100 : 0);
          const isSelected = selected === item.label;
          return (
            <motion.button
              key={item.label}
              type="button"
              onClick={() => setSelected(isSelected ? null : item.label)}
              className={`w-full rounded-2xl border p-3 text-left transition ${isSelected ? 'border-primary/30 bg-primary/5' : 'border-transparent hover:border-border hover:bg-background/50'}`}
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-bold text-muted-foreground">{index + 1}</span>
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 font-semibold text-foreground">{item.value.toLocaleString()} <span className="font-normal text-muted-foreground">· {share.toFixed(share % 1 ? 1 : 0)}%</span></span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ duration: 0.65, delay: index * 0.035 }} className="h-full rounded-full bg-primary/70" />
              </div>
              <AnimatePresence initial={false}>
                {isSelected && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <p className="mt-2 text-[11px] text-muted-foreground">Raw value: {item.value.toLocaleString()} · Relative share: {share.toFixed(1)}%</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function ActivitySection({ data }: { data: PublicDataResult }) {
  const [visible, setVisible] = useState(12);
  const sorted = useMemo(() => [...data.activity].sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [data.activity]);

  return (
    <div className="rounded-3xl border border-border bg-card/40 p-5 backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary"><Activity className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.15em]">Live timeline</span></div>
          <h3 className="mt-2 text-base font-semibold text-foreground">Recent public activity</h3>
          <p className="mt-1 text-xs text-muted-foreground">{sorted.length} item{sorted.length === 1 ? '' : 's'} returned by the platform API.</p>
        </div>
        <span className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-[10px] font-medium text-muted-foreground">Newest first</span>
      </div>

      {sorted.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border px-5 py-10 text-center">
          <CircleDot className="mx-auto h-6 w-6 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium text-foreground">No activity feed returned</p>
          <p className="mt-1 text-xs text-muted-foreground">This platform's public endpoint does not expose a usable recent timeline.</p>
        </div>
      ) : (
        <div className="mt-5">
          <div className="relative ml-2 border-l border-border pl-6">
            <div className="space-y-1">
              {sorted.slice(0, visible).map((activity, index) => (
                <motion.div key={activity.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(index, 8) * 0.025 }} className="group relative rounded-2xl p-3 transition hover:bg-background/60">
                  <span className="absolute -left-[31px] top-5 flex h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      {activity.url ? (
                        <a href={activity.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-foreground transition hover:text-primary">
                          {activity.title}<ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
                        </a>
                      ) : <p className="text-sm font-semibold text-foreground">{activity.title}</p>}
                      {activity.description && <p className="mt-1 text-xs text-muted-foreground">{activity.description}</p>}
                    </div>
                    <time dateTime={activity.timestamp} title={formatDateTime(activity.timestamp)} className="shrink-0 text-[11px] font-medium text-muted-foreground">{formatRelativeDate(activity.timestamp)}</time>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          {visible < sorted.length && (
            <button type="button" onClick={() => setVisible((current) => Math.min(current + 12, sorted.length))} className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/60 px-4 py-2 text-xs font-semibold text-foreground transition hover:border-primary/20 hover:bg-muted">
              Show more <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function RepositoriesSection({ repos }: { repos: PublicRepository[] }) {
  const [showArchived, setShowArchived] = useState(false);
  const visible = repos.filter((repo) => showArchived || !repo.isArchived);
  if (repos.length === 0) return null;

  return (
    <div className="rounded-3xl border border-border bg-card/40 p-5 backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary"><GitBranch className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.15em]">Repository intelligence</span></div>
          <h3 className="mt-2 text-base font-semibold text-foreground">Top repositories</h3>
          <p className="mt-1 text-xs text-muted-foreground">Sorted by public stars in the normalized dataset.</p>
        </div>
        <button type="button" onClick={() => setShowArchived((current) => !current)} className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted sm:self-auto">
          <Archive className="h-3.5 w-3.5" /> {showArchived ? 'Hide archived' : 'Show archived'}
        </button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {visible.map((repo, index) => (
          <motion.a
            key={repo.url}
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            whileHover={{ y: -3 }}
            className="group rounded-2xl border border-border bg-background/45 p-4 transition hover:border-primary/25 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-xs font-bold text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{repo.name}</h4>
                  {repo.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{repo.description}</p>}
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {repo.language && <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{repo.language}</span>}
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Star className="h-3 w-3" /> {repo.stars.toLocaleString()}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><GitBranch className="h-3 w-3" /> {repo.forks.toLocaleString()}</span>
              {repo.openIssues > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><CircleDot className="h-3 w-3" /> {repo.openIssues} issues</span>}
              {repo.isArchived && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><Archive className="h-3 w-3" /> Archived</span>}
              {repo.isFork && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1"><GitBranch className="h-3 w-3" /> Fork</span>}
            </div>
            {repo.updatedAt && <p className="mt-3 text-[10px] font-medium text-muted-foreground">Updated {formatRelativeDate(repo.updatedAt)}</p>}
          </motion.a>
        ))}
      </div>
    </div>
  );
}

export function PublicDataOverview({ data }: PublicDataOverviewProps) {
  const [panel, setPanel] = useState<Panel>('overview');
  const panels: Array<{ id: Panel; label: string; icon: typeof BarChart3; count?: number }> = [
    { id: 'overview', label: 'Metrics', icon: BarChart3, count: data.metrics.length },
    { id: 'breakdowns', label: 'Breakdowns', icon: Tag, count: data.breakdowns?.length ?? 0 },
    { id: 'activity', label: 'Activity', icon: Activity, count: data.activity.length },
    { id: 'repositories', label: 'Repositories', icon: GitBranch, count: data.repositories?.length ?? 0 },
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary"><DatabaseIcon /><span className="text-xs font-semibold uppercase tracking-[0.18em]">Public intelligence</span></div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Everything the public API returned.</h2>
          <p className="mt-1 text-sm text-muted-foreground">Interactive views are generated only from real data returned by {data.profile.username}'s public {data.platform} profile.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/50 px-3 py-2 text-[11px] text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> Fetched {formatDateTime(data.fetchedAt)}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card/35 p-1.5 backdrop-blur-xl">
        {panels.map(({ id, label, icon: Icon, count }) => (
          <button key={id} type="button" onClick={() => setPanel(id)} className={`inline-flex min-w-max items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${panel === id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${panel === id ? 'bg-primary-foreground/15' : 'bg-muted'}`}>{count ?? 0}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {panel === 'overview' && (
          <motion.div key="metrics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <MetricsGrid metrics={data.metrics} />
          </motion.div>
        )}
        {panel === 'breakdowns' && (
          <motion.div key="breakdowns" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid gap-4 lg:grid-cols-2">
            {(data.breakdowns ?? []).map((breakdown) => <BreakdownSection key={breakdown.label} breakdown={breakdown} />)}
            {(!data.breakdowns || data.breakdowns.length === 0) && <EmptyPanel icon={<Tag className="h-5 w-5" />} title="No breakdowns available" text="This public API did not return grouped data for this profile." />}
          </motion.div>
        )}
        {panel === 'activity' && (
          <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><ActivitySection data={data} /></motion.div>
        )}
        {panel === 'repositories' && (
          <motion.div key="repositories" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {data.repositories && data.repositories.length > 0 ? <RepositoriesSection repos={data.repositories} /> : <EmptyPanel icon={<GitBranch className="h-5 w-5" />} title="No repositories returned" text="This platform does not expose repository data for this profile." />}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-2.5 py-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> Source: public API</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-2.5 py-1.5"><GlobeIcon /> Public data only</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-2.5 py-1.5"><CircleDot className="h-3 w-3" /> No ownership claim</span>
      </div>
    </section>
  );
}

function DatabaseIcon() {
  return <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10"><Layers3 className="h-3.5 w-3.5 text-primary" /></span>;
}

function GlobeIcon() {
  return <span className="h-3 w-3 rounded-full border border-current" />;
}

function EmptyPanel({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/30 px-6 py-12 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">{icon}</div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}
