import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, GitFork, GitBranch, LockKeyhole, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfileAvatar } from '@/components/apivue/ProfileBits';
import { useTrackedProfiles } from '@/hooks/use-profiles';
import type { TrackedProfile } from '@/lib/integrations/types';

function formatDate(value?: string | null) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
}

export function GitHubDataView() {
  const { data: profiles = [], isLoading, error } = useTrackedProfiles();
  const profile = profiles.find((item) => item.platform === 'github') as TrackedProfile | undefined;
  const repositories = useMemo(() => profile?.data?.repositories ?? [], [profile]);
  const privateCount = repositories.filter((repo) => repo.private).length;
  const publicCount = repositories.length - privateCount;

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading GitHub data…</div>;
  if (error) return <div className="p-6 text-sm text-destructive">Could not load GitHub data: {(error as Error).message}</div>;
  if (!profile) return <div className="max-w-2xl space-y-4 p-6"><h1 className="text-xl font-semibold">GitHub is not connected</h1><p className="text-sm text-muted-foreground">Connect GitHub first to make your authorized repository data available here.</p><Link to="/dashboard/integrations"><Button>Go to Integrations</Button></Link></div>;

  return <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
    <Link to="/dashboard/integrations" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Integrations</Link>
    <div className="flex flex-wrap items-start gap-4">
      <ProfileAvatar profile={profile} size="lg" />
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold">GitHub data</h1><Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">Connected</Badge></div><p className="mt-1 text-sm text-muted-foreground">@{profile.handle} · Last synced {formatDate(profile.lastSyncedAt ?? profile.last_synced_at)}</p></div>
      <a href={profile.profileUrl ?? profile.profile_url} target="_blank" rel="noreferrer noopener"><Button variant="outline" size="sm"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View GitHub</Button></a>
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Accessible repositories</p><p className="mt-1 text-2xl font-semibold">{repositories.length}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Public</p><p className="mt-1 text-2xl font-semibold">{publicCount}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Private</p><p className="mt-1 text-2xl font-semibold">{privateCount}</p></CardContent></Card>
    </div>

    <Card><CardContent className="p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-semibold">Repositories</h2><p className="mt-1 text-xs text-muted-foreground">Repositories APIVue can currently read through your GitHub App authorization.</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" /> Read-only</div></div>
      {repositories.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No repository data was returned by GitHub.</p> : <div className="grid gap-3 md:grid-cols-2">{repositories.map((repo) => <a key={repo.id ?? repo.name} href={repo.html_url ?? repo.url} target="_blank" rel="noreferrer noopener" className="group rounded-xl border border-border bg-background/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted"><GitBranch className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-medium group-hover:text-primary">{repo.name}</h3>{repo.private && <Badge variant="outline" className="gap-1 text-[10px]"><LockKeyhole className="h-3 w-3" /> Private</Badge>}</div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{repo.description || 'No description'}</p><div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">{repo.language && <span>{repo.language}</span>}<span className="inline-flex items-center gap-1"><Star className="h-3 w-3" /> {repo.stars ?? 0}</span><span className="inline-flex items-center gap-1"><GitFork className="h-3 w-3" /> {repo.forks ?? 0}</span><span>Updated {formatDate(repo.updatedAt)}</span></div></div><ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></div></a>)}</div>}
    </CardContent></Card>
    <p className="text-[11px] text-muted-foreground">APIVue only displays repository information returned by GitHub. The GitHub user access token remains server-side and is never sent to this page.</p>
  </div>;
}
