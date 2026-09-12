import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Compass,
  ExternalLink,
  Loader2,
  Plug,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfileAvatar } from '@/components/apivue/ProfileBits';
import { toast } from '@/hooks/use-toast';
import {
  useRemoveProfile,
  useSyncProfile,
  useTrackedProfiles,
} from '@/hooks/use-profiles';
import {
  connectCodewars,
  connectCodeforces,
  connectGitHub,
  connectLeetCode,
  connectStackOverflow,
  disconnectCodewars,
  disconnectCodeforces,
  disconnectGitHub,
  disconnectLeetCode,
  disconnectStackOverflow,
  getIntegrationStatus,
  syncGitHub,
  syncIntegration,
} from '@/lib/integrations/api';
import { getIntegration, integrations } from '@/lib/integrations/registry';
import type {
  ConnectedAccount,
  IntegrationId,
  IntegrationStatus,
  TrackedProfile,
} from '@/lib/integrations/types';

function pick<T>(...values: Array<T | undefined | null>): T | undefined {
  return values.find((value) => value !== undefined && value !== null && value !== '') as
    | T
    | undefined;
}

async function connectIntegration(id: IntegrationId, handle: string): Promise<void> {
  switch (id) {
    case 'github':
      return connectGitHub();
    case 'codeforces':
      return connectCodeforces(handle);
    case 'leetcode':
      return connectLeetCode(handle);
    case 'codewars':
      return connectCodewars(handle);
    case 'stackoverflow':
      return connectStackOverflow(handle);
  }
}

async function disconnectIntegration(id: IntegrationId): Promise<void> {
  switch (id) {
    case 'github':
      return disconnectGitHub();
    case 'codeforces':
      return disconnectCodeforces();
    case 'leetcode':
      return disconnectLeetCode();
    case 'codewars':
      return disconnectCodewars();
    case 'stackoverflow':
      return disconnectStackOverflow();
  }
}

function AccountSummary({
  account,
  name,
  busy,
  onSync,
  onDisconnect,
}: {
  account: ConnectedAccount;
  name: string;
  busy: boolean;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  const handle = pick(account.username, account.handle);

  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
          <Plug className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            Connected to {name}
          </p>
          <p className="mt-0.5 truncate text-sm font-medium">
            {handle ? `@${handle}` : 'Account connected'}
            {account.displayName && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {account.displayName}
              </span>
            )}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {account.lastSyncedAt
              ? `Last synced ${new Date(account.lastSyncedAt).toLocaleString()}`
              : account.connectedAt
                ? `Connected ${new Date(account.connectedAt).toLocaleDateString()}`
                : 'Not synced yet'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onSync} disabled={busy} className="gap-1.5">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Sync now
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDisconnect}
          disabled={busy}
          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Disconnect
        </Button>
      </div>
    </div>
  );
}

function ConnectForm({
  integrationId,
  name,
  placeholder,
  authType,
  busy,
  onConnect,
}: {
  integrationId: IntegrationId;
  name: string;
  placeholder: string;
  authType: 'oauth' | 'username' | 'coming-soon';
  busy: boolean;
  onConnect: (id: IntegrationId, handle: string) => Promise<void>;
}) {
  const [handle, setHandle] = useState('');
  const requiresHandle = authType === 'username';

  if (authType === 'coming-soon') {
    return <p className="text-xs text-muted-foreground">Coming soon.</p>;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && (!requiresHandle || handle.trim())) {
          void onConnect(integrationId, handle.trim());
        }
      }}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      {requiresHandle && (
        <Input
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder={placeholder}
          disabled={busy}
          autoComplete="off"
          spellCheck={false}
          className="sm:flex-1"
        />
      )}
      <Button
        type="submit"
        disabled={busy || (requiresHandle && !handle.trim())}
        className="gap-1.5"
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {busy ? 'Connecting…' : authType === 'oauth' ? `Connect with ${name}` : `Connect ${name}`}
      </Button>
    </form>
  );
}

function TrackedProfilesList({
  profiles,
  busyId,
  onRefresh,
  onRemove,
  platformName,
}: {
  profiles: TrackedProfile[];
  busyId: string | null;
  onRefresh: (id: string, platform: string, handle: string) => void;
  onRemove: (id: string, handle: string) => void;
  platformName: string;
}) {
  if (!profiles.length) return null;

  return (
    <div className="mt-4 space-y-2 border-t border-border pt-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Public profiles tracked on {platformName}
      </p>
      {profiles.map((profile) => {
        const profileUrl = pick(profile.profileUrl, profile.profile_url);
        const displayName = pick(profile.displayName, profile.display_name, profile.handle);
        const lastSynced = pick(profile.lastSyncedAt, profile.last_synced_at);
        const syncError = pick(profile.syncError, profile.sync_error);
        const busy = busyId === profile.id;

        return (
          <div key={profile.id} className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3">
            <ProfileAvatar profile={profile} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                @{profile.handle}{lastSynced ? ` · Synced ${new Date(lastSynced).toLocaleDateString()}` : ' · Never synced'}
              </p>
              {syncError && <p className="mt-0.5 truncate text-[11px] text-destructive">{syncError}</p>}
            </div>
            <div className="flex items-center gap-1">
              {profileUrl && (
                <a href={profileUrl} target="_blank" rel="noreferrer noopener" className="rounded p-1.5 text-muted-foreground hover:bg-muted" title="Open profile">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button type="button" onClick={() => onRefresh(profile.id, profile.platform, profile.handle)} disabled={busy} className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50" title="Refresh data">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => onRemove(profile.id, profile.handle)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Remove">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function IntegrationsView() {
  const { data: profiles = [], isLoading, error } = useTrackedProfiles();
  const remove = useRemoveProfile();
  const syncProfile = useSyncProfile();
  const [accountStatus, setAccountStatus] = useState<IntegrationStatus | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [busyPlatform, setBusyPlatform] = useState<IntegrationId | null>(null);
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);

  const loadAccountStatus = useCallback(async () => {
    try {
      setAccountStatus(await getIntegrationStatus());
      setConnectionError(null);
    } catch (err) {
      setConnectionError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    void loadAccountStatus();
  }, [loadAccountStatus]);

  const handleConnect = useCallback(async (id: IntegrationId, handle: string) => {
    setBusyPlatform(id);
    setConnectionError(null);
    try {
      await connectIntegration(id, handle);
      await loadAccountStatus();
      toast({ title: `${getIntegration(id).name} connection started` });
    } catch (err) {
      const message = (err as Error).message;
      setConnectionError(message);
      toast({ title: `Could not connect ${getIntegration(id).name}`, description: message, variant: 'destructive' });
    } finally {
      setBusyPlatform(null);
    }
  }, [loadAccountStatus]);

  const handleDisconnect = useCallback(async (id: IntegrationId) => {
    if (!window.confirm(`Disconnect ${getIntegration(id).name}?`)) return;
    setBusyPlatform(id);
    try {
      await disconnectIntegration(id);
      await loadAccountStatus();
      toast({ title: `${getIntegration(id).name} disconnected` });
    } catch (err) {
      const message = (err as Error).message;
      setConnectionError(message);
      toast({ title: 'Could not disconnect', description: message, variant: 'destructive' });
    } finally {
      setBusyPlatform(null);
    }
  }, [loadAccountStatus]);

  const handleSync = useCallback(async (id: IntegrationId) => {
    setBusyPlatform(id);
    setConnectionError(null);
    try {
      if (id === 'github') await syncGitHub();
      else await syncIntegration(id);
      await loadAccountStatus();
      toast({ title: `${getIntegration(id).name} synced` });
    } catch (err) {
      const message = (err as Error).message;
      setConnectionError(message);
      toast({ title: `${getIntegration(id).name} sync failed`, description: message, variant: 'destructive' });
    } finally {
      setBusyPlatform(null);
    }
  }, [loadAccountStatus]);

  const handleRefreshProfile = useCallback(async (id: string, platform: string, handle: string) => {
    setBusyProfileId(id);
    try {
      await syncProfile.mutateAsync({ platform, handle });
      toast({ title: 'Refreshed', description: `${handle} is up to date.` });
    } catch (err) {
      toast({ title: 'Refresh failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setBusyProfileId(null);
    }
  }, [syncProfile]);

  const handleRemoveProfile = useCallback((id: string, handle: string) => {
    if (!window.confirm(`Remove ${handle}? This will delete its history.`)) return;
    remove.mutate(id, {
      onSuccess: () => toast({ title: `${handle} removed` }),
      onError: (err) => toast({ title: 'Remove failed', description: (err as Error).message, variant: 'destructive' }),
    });
  }, [remove]);

  const profilesByPlatform = useMemo(() => {
    const grouped: Record<string, TrackedProfile[]> = {};
    for (const profile of profiles) {
      (grouped[profile.platform] ??= []).push(profile);
    }
    return grouped;
  }, [profiles]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect real developer accounts, sync live platform data, and build private history.
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/[0.03]">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Compass className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Public profile tracking still works independently.</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Use Explore when you only want public data without connecting an account.</p>
            </div>
          </div>
          <Link to="/dashboard/explore" className="shrink-0"><Button size="sm" variant="outline">Explore public data</Button></Link>
        </CardContent>
      </Card>

      {connectionError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div><p className="font-medium">Integration service error</p><p className="mt-0.5 text-xs">{connectionError}</p></div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Could not load tracked profiles: {(error as Error).message}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const account = accountStatus?.[integration.id];
          const connected = account?.connected === true;
          const platformProfiles = profilesByPlatform[integration.id] ?? [];
          const busy = busyPlatform === integration.id;

          return (
            <Card key={integration.id} className="flex flex-col border-border bg-card transition-colors hover:border-primary/30">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted" style={{ color: integration.accent }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold">{integration.name}</h2>
                      <p className="text-[11px] text-muted-foreground">
                        {integration.authType === 'oauth' ? 'OAuth connection' : integration.authType === 'username' ? 'Public handle verification' : 'Coming soon'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={connected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}>
                    {connected ? 'Connected' : platformProfiles.length ? `${platformProfiles.length} tracked` : 'Not connected'}
                  </Badge>
                </div>

                <p className="mt-4 text-sm text-muted-foreground">{integration.description}</p>

                <div className="mt-5">
                  {connected && account ? (
                    <AccountSummary
                      account={account}
                      name={integration.name}
                      busy={busy}
                      onSync={() => void handleSync(integration.id)}
                      onDisconnect={() => void handleDisconnect(integration.id)}
                    />
                  ) : (
                    <ConnectForm
                      integrationId={integration.id}
                      name={integration.name}
                      placeholder={integration.handlePlaceholder}
                      authType={integration.authType}
                      busy={busy}
                      onConnect={handleConnect}
                    />
                  )}
                </div>

                <TrackedProfilesList
                  platformName={integration.name}
                  profiles={platformProfiles}
                  busyId={busyProfileId}
                  onRefresh={handleRefreshProfile}
                  onRemove={handleRemoveProfile}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isLoading && profiles.length === 0 && <p className="text-center text-xs text-muted-foreground">Loading your tracked profiles…</p>}

      <p className="text-[11px] text-muted-foreground">
        APIVue uses public provider APIs for public profiles. OAuth credentials stay on the backend and are never returned to the browser.
      </p>
    </div>
  );
}
