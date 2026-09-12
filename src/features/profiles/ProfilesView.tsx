import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Github,
  Loader2,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useRemoveProfile,
  useSyncProfile,
  useTogglePinned,
  useTrackedProfiles,
} from '@/hooks/use-profiles';
import { formatMetric, getIntegration, metricOf } from '@/lib/integrations/registry';
import { AddProfileDialog } from '@/components/apivue/AddProfileDialog';
import { PlatformChip, ProfileAvatar } from '@/components/apivue/ProfileBits';
import { toast } from '@/hooks/use-toast';

function pick<T>(...values: Array<T | undefined | null>): T | undefined {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function formatSyncedAt(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'Unknown' : d.toLocaleString();
}

export function ProfilesView() {
  const { data: profiles = [], isLoading, refetch } = useTrackedProfiles();
  const sync = useSyncProfile();
  const remove = useRemoveProfile();
  const pin = useTogglePinned();

  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshingList, setRefreshingList] = useState(false);

  const filtered = profiles.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const name = pick(p.displayName, p.display_name, '') ?? '';
    return (
      p.handle.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      getIntegration(p.platform).name.toLowerCase().includes(q)
    );
  });

  const refreshList = async () => {
    setRefreshingList(true);
    try {
      await refetch();
      toast({ title: 'Profiles refreshed', description: 'Latest connected profile data is loaded.' });
    } catch (err) {
      toast({ title: 'Refresh failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setRefreshingList(false);
    }
  };

  const refresh = async (id: string, platform: string, handle: string) => {
    setBusyId(id);
    try {
      await sync.mutateAsync({ platform, handle });
      toast({ title: 'Refreshed', description: `${handle} is up to date.` });
    } catch (err) {
      toast({ title: 'Refresh failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = (id: string, handle: string) => {
    if (!window.confirm(`Remove ${handle}? This will delete its history.`)) return;
    remove.mutate(id, {
      onSuccess: () => toast({ title: 'Removed', description: `${handle} is no longer tracked.` }),
      onError: (err) => toast({ title: 'Remove failed', description: (err as Error).message, variant: 'destructive' }),
    });
  };

  return (
    <div className="max-w-6xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Profiles</h1>
            {!isLoading && (
              <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {profiles.length} tracked
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your connected and publicly tracked developer identities, all in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search profiles" className="h-8 w-44 pl-8 text-xs" />
          </div>
          <Button size="sm" variant="outline" onClick={() => void refreshList()} disabled={refreshingList} title="Refresh profiles">
            {refreshingList ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Connect
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center">
          <Plug className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="mb-1 text-sm font-medium">{profiles.length ? 'No matches' : 'Nothing tracked yet'}</p>
          <p className="text-xs text-muted-foreground">{profiles.length ? 'Try a different search.' : 'Connect your first developer profile.'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const integration = getIntegration(p.platform);
            const displayName = pick(p.displayName, p.display_name, p.handle);
            const profileUrl = pick(p.profileUrl, p.profile_url);
            const lastSynced = pick(p.lastSyncedAt, p.last_synced_at);
            const syncError = pick(p.syncError, p.sync_error);
            const data = p.data ?? {};
            const isGitHub = p.platform.toLowerCase() === 'github';
            const repoCount = typeof data.accessibleRepoCount === 'number' ? data.accessibleRepoCount : data.repositories?.length;

            return (
              <div key={p.id} className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                {isGitHub && data.privateAccess && <div className="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-primary/5" />}
                <div className="mb-3 flex items-start gap-3">
                  <ProfileAvatar profile={p} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/dashboard/profile/${p.id}`} className="block truncate text-sm font-medium hover:text-primary">{displayName}</Link>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">@{p.handle}</p>
                  </div>
                  <button type="button" onClick={() => pin.mutate({ id: p.id, pinned: !p.pinned })} title={p.pinned ? 'Unpin' : 'Pin to top'} className="text-muted-foreground transition-colors hover:text-amber-500" aria-label={p.pinned ? 'Unpin' : 'Pin'}>
                    <Star className={`h-3.5 w-3.5 ${p.pinned ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  <PlatformChip platform={p.platform} />
                  {isGitHub && data.privateAccess && (
                    <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      <Github className="h-3 w-3" /> Connected
                    </span>
                  )}
                  {isGitHub && typeof repoCount === 'number' && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {repoCount} repositories
                    </span>
                  )}
                  {integration.headlineMetrics.slice(0, 2).map((key) => {
                    const m = metricOf(p, key);
                    if (!m) return null;
                    return <span key={key} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{m.label}: <span className="font-semibold text-foreground">{formatMetric(m.value, m.format)}</span></span>;
                  })}
                </div>

                {isGitHub && data.privateAccess && (
                  <Link to="/dashboard/integrations/github" className="mb-3 flex items-center justify-between rounded-lg border border-primary/15 bg-primary/[0.04] px-3 py-2 text-[11px] transition-colors hover:bg-primary/[0.08]">
                    <span className="font-medium">Repository data available</span>
                    <span className="text-primary">Open data →</span>
                  </Link>
                )}

                {syncError && <p className="mb-2 text-[11px] text-destructive">{syncError}</p>}

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{lastSynced ? `Synced ${formatSyncedAt(lastSynced)}` : 'Never synced'}</span>
                  <div className="flex items-center gap-1">
                    {profileUrl && <a href={profileUrl} target="_blank" rel="noreferrer noopener" className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted" title="Open on platform"><ExternalLink className="h-3.5 w-3.5" /></a>}
                    <Link to={`/dashboard/profile/${p.id}`} className="rounded px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">Details</Link>
                    <button type="button" onClick={() => refresh(p.id, p.platform, p.handle)} disabled={busyId === p.id} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50" title="Refresh data">
                      {busyId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    </button>
                    <button type="button" onClick={() => handleRemove(p.id, p.handle)} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Remove profile"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddProfileDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
