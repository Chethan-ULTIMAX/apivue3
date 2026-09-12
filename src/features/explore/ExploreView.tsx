import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Database, GitCompareArrows, Globe2, Loader2, Search, Sparkles, Zap } from 'lucide-react';
import { explorePublicProfile, getPublicPlatform, type PublicDataResult, type PublicPlatform } from '@/lib/public-data';
import { Button } from '@/components/ui/button';
import { PlatformSelector } from './components/PlatformSelector';
import { ProfileSearch } from './components/ProfileSearch';
import { PublicProfileCard } from './components/PublicProfileCard';
import { PublicDataOverview } from './components/PublicDataOverview';

const PLATFORM_HINTS: Record<PublicPlatform, string> = {
  github: 'Repos, languages, stars, followers and public activity',
  codeforces: 'Ratings, ranks, contests, solved tags and submissions',
  leetcode: 'Problems solved, difficulty, languages, contests and calendar',
  codewars: 'Honor, rank, kata progress and language scores',
  stackoverflow: 'Reputation, badges, answers, questions and top tags',
};

export function ExploreView() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<PublicPlatform>('github');
  const [username, setUsername] = useState('');
  const [data, setData] = useState<PublicDataResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const definition = getPublicPlatform(platform);
  const dataSummary = useMemo(() => data ? { metricCount: data.metrics.length, activityCount: data.activity.length } : null, [data]);

  const handlePlatformChange = (next: PublicPlatform) => { setPlatform(next); setError(''); setData(null); };
  const handleExplore = async () => {
    if (!username.trim()) { setError(`Enter a ${definition.placeholder.toLowerCase()}.`); return; }
    setLoading(true); setError('');
    try { setData(await explorePublicProfile(platform, username)); }
    catch (err) { setData(null); setError(err instanceof Error ? err.message : 'Failed to fetch public profile.'); }
    finally { setLoading(false); }
  };
  const handleAnalyze = () => data && navigate('/dashboard/analytics', { state: { exploreProfile: data } });
  const handleCompare = () => data && navigate('/dashboard/compare', { state: { exploreProfile: data } });

  return (
    <div className="relative space-y-7 pb-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-pulse rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

      <section className="animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden rounded-3xl border border-border bg-card/50 p-6 shadow-sm backdrop-blur-xl duration-500 sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Public data explorer</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Explore the developer behind the username.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">One workspace for five developer platforms. Search a public identity, then APIVue turns the raw public API response into an interactive profile, metrics, activity, breakdowns and platform-specific insights.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[300px]">
            {[['5', 'platforms'], ['100%', 'public data'], ['0', 'connections']].map(([value, label]) => <div key={label} className="rounded-2xl border border-border bg-background/50 px-3 py-3 transition duration-300 hover:-translate-y-1 hover:border-primary/20"><p className="text-lg font-bold text-foreground">{value}</p><p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p></div>)}
          </div>
        </div>
      </section>

      <section className="animate-in fade-in slide-in-from-bottom-2 relative rounded-3xl border border-border bg-card/45 p-4 shadow-sm backdrop-blur-xl duration-700 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">01 · Choose a source</p><h2 className="mt-1 text-lg font-semibold text-foreground">Pick a platform, then search.</h2></div><div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><Globe2 className="h-4 w-4" /> Live public API lookup</div></div>
        <div className="grid gap-5">
          <PlatformSelector value={platform} onChange={handlePlatformChange} />
          <div className="grid gap-3 md:grid-cols-[1fr_auto]"><ProfileSearch value={username} onChange={setUsername} onSubmit={handleExplore} loading={loading} platform={platform} /><Button type="button" onClick={handleExplore} disabled={loading} className="h-12 rounded-xl px-6 text-sm font-semibold shadow-lg shadow-primary/10">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}{loading ? 'Exploring…' : 'Explore profile'}</Button></div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="rounded-full border border-border bg-background/60 px-2.5 py-1 font-medium text-foreground">{definition.name}</span><span>{PLATFORM_HINTS[platform]}</span><span className="hidden sm:inline">·</span><span>No account connection required</span></div>
          {error && <div role="alert" className="animate-in fade-in slide-in-from-top-1 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive duration-200">{error}</div>}
        </div>
      </section>

      {data ? (
        <div key={`${data.platform}:${data.profile.username}`} className="animate-in fade-in slide-in-from-bottom-3 space-y-7 duration-500">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">02 · Profile intelligence</p><h2 className="mt-1 text-xl font-semibold text-foreground">Public profile command center</h2></div>{dataSummary && <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"><Database className="h-3.5 w-3.5" /> {dataSummary.metricCount} metrics</span><span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"><Zap className="h-3.5 w-3.5" /> {dataSummary.activityCount} activity items</span></div>}</div>
          <PublicProfileCard data={data} />
          <PublicDataOverview data={data} />
          <div className="rounded-3xl border border-border bg-card/45 p-5 backdrop-blur-xl sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">03 · Go deeper</p><h3 className="mt-1 text-base font-semibold text-foreground">Turn this public profile into analysis.</h3><p className="mt-1 text-xs text-muted-foreground">Reuse the exact fetched profile in APIVue's analysis and comparison tools.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={handleAnalyze} className="rounded-xl"><BarChart3 className="mr-2 h-4 w-4" /> Analyze</Button><Button type="button" variant="outline" onClick={handleCompare} className="rounded-xl"><GitCompareArrows className="mr-2 h-4 w-4" /> Compare</Button><a href={data.profile.profileUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:bg-muted">Open source <ArrowRight className="ml-2 h-4 w-4" /></a></div></div></div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">{[['Profile intelligence', 'A richer identity header with public context and source link.'], ['Interactive data', 'Explore metrics, breakdowns, repositories and activity instead of one static chart.'], ['Platform aware', 'The workspace adapts to what each of the five public APIs actually exposes.']].map(([title, description], index) => <div key={title} className="animate-in fade-in slide-in-from-bottom-2 rounded-3xl border border-border bg-card/40 p-5 backdrop-blur-xl duration-700 transition hover:-translate-y-1 hover:border-primary/20"><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-sm font-bold text-primary">0{index + 1}</div><h3 className="font-semibold text-foreground">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p></div>)}</div>
      )}
    </div>
  );
}
