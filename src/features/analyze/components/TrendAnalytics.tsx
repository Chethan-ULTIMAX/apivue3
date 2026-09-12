import { useMemo, useState } from 'react';
import { Activity, BarChart3, CalendarRange, LineChart as LineChartIcon, Lock, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProgressReport } from '@/lib/analytics/progress';
import { chartAxisStyle, chartGridStroke, chartTooltipStyle } from '@/components/apivue/ProfileBits';

type TrendAnalyticsProps = { hasData: boolean; report: ProgressReport };
type Range = 7 | 30 | 90;

export function TrendAnalytics({ hasData, report }: TrendAnalyticsProps) {
  const [range, setRange] = useState<Range>(30);
  const trends = useMemo(() => report.trends.slice(0, 6), [report.trends]);
  const activity = useMemo(() => {
    const points = report.trends.flatMap((trend) => trend.points).reduce<Map<string, number>>((map, point) => {
      map.set(point.date, (map.get(point.date) ?? 0) + 1);
      return map;
    }, new Map());
    return Array.from(points.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-range).map(([date, count]) => ({ date, count }));
  }, [report.trends, range]);
  const topTrend = trends[0];

  return (
    <section>
      <Card className="overflow-hidden border-border bg-card/60">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-violet-500 dark:text-violet-300" />Trends over time</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Historical changes across your collected activity.</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
              {[7, 30, 90].map((days) => <Button key={days} variant={range === days ? 'default' : 'ghost'} size="sm" className="h-7 px-2.5 text-xs" onClick={() => setRange(days as Range)}>{days} days</Button>)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {hasData && topTrend ? <TrendReadyState activity={activity} topTrend={topTrend} /> : <TrendEmptyState />}
        </CardContent>
      </Card>
    </section>
  );
}

function TrendEmptyState() {
  return <div className="relative flex min-h-[330px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 p-6">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '42px 42px', color: 'hsl(var(--border))' }} />
    <div className="relative max-w-md text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10"><LineChartIcon className="h-5 w-5 text-violet-500 dark:text-violet-300" /></div>
      <h3 className="mt-4 text-sm font-semibold">Your trend line will appear here</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">APIVue needs at least two numeric snapshots for a genuine historical trend.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2"><Pill icon={CalendarRange} text="Daily" /><Pill icon={Activity} text="Weekly" /><Pill icon={BarChart3} text="Monthly" /></div>
    </div>
  </div>;
}

function TrendReadyState({ activity, topTrend }: { activity: Array<{ date: string; count: number }>; topTrend: ProgressReport['trends'][number] }) {
  const chartData = activity.length >= 2 ? activity : topTrend.points.map((point) => ({ date: point.date, count: point.value }));
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
      <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Strongest tracked change</p><p className="mt-1 text-sm font-semibold">{topTrend.label} · @{topTrend.handle}</p></div>
      <div className="text-right"><p className={`text-lg font-bold tabular-nums ${topTrend.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>{topTrend.change >= 0 ? '+' : ''}{topTrend.change.toLocaleString()}</p><p className="text-[11px] text-muted-foreground">{topTrend.changePct === null ? 'absolute change' : `${topTrend.changePct}% change`}</p></div>
    </div>
    <div className="h-[260px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={chartAxisStyle} tickLine={false} axisLine={false} minTickGap={28} /><YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} width={34} /><Tooltip contentStyle={chartTooltipStyle} /><Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /></LineChart></ResponsiveContainer></div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />Calculated from stored activity history — no synthetic points.</div>
  </div>;
}

function Pill({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground"><Icon className="h-3 w-3" />{text}</span>;
}
