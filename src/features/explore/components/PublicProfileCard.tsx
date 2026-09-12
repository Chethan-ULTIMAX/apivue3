import { ArrowUpRight, CalendarDays, CheckCircle2, Globe2, MapPin, Sparkles } from 'lucide-react';
import { getPublicPlatform, type PublicDataResult } from '@/lib/public-data';

interface PublicProfileCardProps { data: PublicDataResult; }

function formatJoinedAt(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

export function PublicProfileCard({ data }: PublicProfileCardProps) {
  const { profile, platform, metrics } = data;
  const definition = getPublicPlatform(platform);
  const joined = formatJoinedAt(profile.joinedAt);
  const highlights = metrics.slice(0, 3);

  return (
    <section className="animate-in fade-in zoom-in-[0.985] relative overflow-hidden rounded-3xl border border-border bg-card/50 shadow-sm backdrop-blur-xl duration-500">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="relative shrink-0 transition-transform duration-300 hover:scale-105 hover:rotate-1">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={`${profile.username} avatar`} className="h-20 w-20 rounded-2xl border border-border object-cover shadow-lg" loading="lazy" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-muted text-2xl font-bold text-muted-foreground">{profile.username.charAt(0).toUpperCase()}</div>}
              <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-4 border-card bg-primary text-primary-foreground"><CheckCircle2 className="h-3.5 w-3.5" /></span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-2xl font-bold tracking-tight text-foreground">{profile.displayName || profile.username}</h2><span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary"><Sparkles className="h-3 w-3" /> {definition.name}</span></div>
              <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {profile.location && <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/55 px-2.5 py-1"><MapPin className="h-3 w-3" /> {profile.location}</span>}
                {joined && <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/55 px-2.5 py-1"><CalendarDays className="h-3 w-3" /> Joined {joined}</span>}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/55 px-2.5 py-1"><Globe2 className="h-3 w-3" /> Public API</span>
              </div>
            </div>
          </div>
          <a href={profile.profileUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background/70 px-4 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted">View source <ArrowUpRight className="ml-2 h-4 w-4" /></a>
        </div>
        {profile.bio && <p className="mt-6 max-w-4xl border-l-2 border-primary/30 pl-4 text-sm leading-6 text-foreground/75">{profile.bio}</p>}
        {highlights.length > 0 && <div className="mt-6 grid gap-2 sm:grid-cols-3">{highlights.map((metric, index) => <div key={metric.label} className="rounded-2xl border border-border bg-background/45 p-3.5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/20"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{metric.label}</span><span className="text-[10px] font-bold text-primary">0{index + 1}</span></div><p className="mt-1.5 text-xl font-bold tracking-tight text-foreground">{typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}</p></div>)}</div>}
      </div>
    </section>
  );
}
