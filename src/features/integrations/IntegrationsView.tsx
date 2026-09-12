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
import { getIntegration, integrations } from '@/lib/integrations/registry';
import type { IntegrationId } from '@/lib/integrations/types';
import {
  useRemoveProfile,
  useSyncProfile,
  useTrackedProfiles,
} from '@/hooks/use-profiles';
import { ProfileAvatar } from '@/components/apivue/ProfileBits';
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
} from '@/lib/integrations/api';
import type { IntegrationStatus } from '@/lib/integrations/types';
import { toast } from '@/hooks/use-toast';

/* ============================================================
 * Per-platform connect / disconnect dispatch
 * ============================================================ */

async function connectIntegration(
  id: IntegrationId,
  handle: string,
): Promise<void> {
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

/* ============================================================
 * Helpers
 * ============================================================ */

function pick<T>(...values: Array<T | undefined | null>): T | undefined {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

/* ============================================================
 * Connected account summary
 * ============================================================ */

function AccountSummary({
  account,
  integrationName,
  onDisconnect,
  onSync,
  busy,
  canSync,
}: {
  account: NonNullable<IntegrationStatus[keyof IntegrationStatus]>;
  integrationName: string;
  onDisconnect: () => void;
  onSync?: () => void;
  busy: boolean;
  canSync: boolean;
}) {
  const handle = pick(account.username, account.handle);
  const displayName = pick(account.displayName);

  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
          <Plug className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            Connected to {integrationName}
          </p>

          {handle && (
            <p className="mt-0.5 truncate text-sm font-medium">
              @{handle}
              {displayName && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {displayName}
                </span>
              )}
            </p>
          )}

          {account.connectedAt && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Connected{' '}
              {new Date(account.connectedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {canSync && onSync && (
          <Button
            size="sm"
            variant="outline"
            onClick={onSync}
            disabled={busy}
            className="gap-1.5"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sync now
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={onDisconnect}
          disabled={busy}
          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Disconnect
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
 * Connect form (per-card)
 * ============================================================ */

function ConnectForm({
  integrationId,
  integrationName,
  placeholder,
  authType,
  busy,
  onConnect,
}: {
  integrationId: IntegrationId;
  integrationName: string;
  placeholder: string;
  authType: 'oauth' | 'username' | 'coming-soon';
  busy: boolean;
  onConnect: (id: IntegrationId, handle: string) => Promise<void>;
}) {
  const [handle, setHandle] = useState('');

  const requiresHandle = authType === 'username';
  const canSubmit = !requiresHandle || handle.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || busy) return;
    await onConnect(integrationId, handle.trim());
  };

  if (authType === 'coming-soon') {
    return (
      <p className="text-xs text-muted-foreground">
        Coming soon.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      {requiresHandle && (
        <Input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={placeholder}
          disabled={busy}
          autoComplete="off"
          spellCheck={false}
          className="sm:flex-1"
        />
      )}

      <Button
        type="submit"
        disabled={busy || !canSubmit}
        className="gap-1.5 sm:w-auto"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : null}
        {busy
          ? 'Connecting…'
          : authType === 'oauth'
            ? `Connect with ${integrationName}`
            : `Connect ${integrationName}`}
      </Button>
    </form>
  );
}

/* ============================================================
 * Tracked-profile rows for a platform
 * ============================================================ */

function TrackedProfilesList({
  platform,
  profiles,
  busyId,
  onRefresh,
  onRemove,
}: {
  platform: string;
  profiles: ReturnType<typeof useTrackedProfiles>['data'] extends
    | Array<infer T>
    | undefined
    ? T[]
    : never;
  busyId: string | null;
  onRefresh: (id: string, platform: string, handle: string) => void;
  onRemove: (id: string, handle: string) => void;
}) {
  if (profiles.length === 0) return null;

  return (
    <div className="mt-4 space-y-2 border-t border-border pt-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Public profiles tracked on {platform}
      </p>

      {profiles.map((profile) => {
        const profileUrl = pick(profile.profileUrl, profile.profile_url);
        const displayName = pick(
          profile.displayName,
          profile.display_name,
          profile.handle,
        );
        const lastSynced = pick(
          profile.lastSyncedAt,
          profile.last_synced_at,
        );
        const syncError = pick(profile.syncError, profile.sync_error);
        const isBusy = busyId === profile.id;

        return (
          <div
            key={profile.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3"
          >
            <ProfileAvatar profile={profile} size="sm" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                @{profile.handle}
                {lastSynced && (
                  <>
                    {' · '}
                    Synced {new Date(lastSynced).toLocaleDateString()}
                  </>
                )}
                {!lastSynced && ' · Never synced'}
              </p>
              {syncError && (
                <p className="mt-0.5 truncate text-[11px] text-destructive">
                  {syncError}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1">
              {profileUrl && (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                  title="Open profile"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              <button
                type="button"
                onClick={() =>
                  onRefresh(profile.id, profile.platform, profile.handle)
                }
                disabled={isBusy}
                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                title="Refresh data"
              >
                {isBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onRemove(profile.id, profile.handle)}
                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
 * Main view
 * ============================================================ */

export function IntegrationsView() {
  const { data: profiles = [], isLoading, error } = useTrackedProfiles();
  const remove = useRemoveProfile();
  const sync = useSyncProfile();

  const [accountStatus, setAccountStatus] = useState<IntegrationStatus | null>(
    null,
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [busyPlatform, setBusyPlatform] = useState<IntegrationId | null>(null);
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);

  /* ---------- Load backend status ---------- */

  const loadAccountStatus = useCallback(async () => {
    try {
      const status = await getIntegrationStatus();
      setAccountStatus(status);
      setConnectionError(null);
    } catch (err) {
      // Backend may not be running during development. Surface the
      // message but do not crash the page — the tracked-profiles list
      // still works independently.
      setConnectionError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    void loadAccountStatus();
  }, [loadAccountStatus]);

  /* ---------- Connect ---------- */

  const handleConnect = useCallback(
    async (id: IntegrationId, handle: string) => {
      setBusyPlatform(id);
      setConnectionError(null);
      try {
        await connectIntegration(id, handle);
        await loadAccountStatus();
        toast({
          title: 'Connection started',
          description: `Follow the instructions to finish connecting ${getIntegration(id).name}.`,
        });
      } catch (err) {
        const message = (err as Error).message;
        setConnectionError(message);
        toast({
          title: `Could not connect ${getIntegration(id).name}`,
          description: message,
          variant: 'destructive',
        });
      } finally {
        setBusyPlatform(null);
      }
    },
    [loadAccountStatus],
  );

  /* ---------- Disconnect ---------- */

  const handleDisconnect = useCallback(
    async (id: IntegrationId) => {
      if (
        !window.confirm(
          `Disconnect ${getIntegration(id).name}? You can reconnect at any time.`,
        )
      ) {
        return;
      }

      setBusyPlatform(id);
      try {
        await disconnectIntegration(id);
        await loadAccountStatus();
        toast({ title: `${getIntegration(id).name} disconnected` });
      } catch (err) {
        const message = (err as Error).message;
        setConnectionError(message);
        toast({
          title: 'Could not disconnect',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setBusyPlatform(null);
      }
    },
    [loadAccountStatus],
  );

  /* ---------- Sync GitHub ---------- */

  const handleSyncGitHub = useCallback(async () => {
    setBusyPlatform('github');
    try {
      await syncGitHub();
      await loadAccountStatus();
      toast({ title: 'GitHub synced' });
    } catch (err) {
      const message = (err as Error).message;
      setConnectionError(message);
      toast({
        title: 'GitHub sync failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setBusyPlatform(null);
    }
  }, [loadAccountStatus]);

  /* ---------- Tracked profile actions ---------- */

  const handleRefreshProfile = useCallback(
    async (id: string, platform: string, handle: string) => {
      setBusyProfileId(id);
      try {
        await sync.mutateAsync({ platform, handle });
        toast({ title: 'Refreshed', description: `${handle} is up to date.` });
      } catch (err) {
        toast({
          title: 'Refresh failed',
          description: (err as Error).message,
          variant: 'destructive',
        });
      } finally {
        setBusyProfileId(null);
      }
    },
    [sync],
  );

  const handleRemoveProfile = useCallback(
    (id: string, handle: string) => {
      if (!window.confirm(`Remove ${handle}? This will delete its history.`)) {
        return;
      }
      remove.mutate(id, {
        onSuccess: () => toast({ title: `${handle} removed` }),
        onError: (err) =>
          toast({
            title: 'Remove failed',
            description: (err as Error).message,
            variant: 'destructive',
          }),
      });
    },
    [remove],
  );

  /* ---------- Group tracked profiles per platform ---------- */

  const profilesByPlatform = useMemo(() => {
    const grouped: Record<string, typeof profiles> = {};
    for (const p of profiles) {
      const list = grouped[p.platform] ?? [];
      list.push(p);
      grouped[p.platform] = list;
    }
    return grouped;
  }, [profiles]);

  /* ---------- Render ---------- */

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your own accounts to build private history, or track
          public profiles from Explore.
        </p>
      </div>

      {/* Explainer */}
      <Card className="border-primary/30 bg-primary/[0.03]">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Compass className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">
                Don&apos;t want to connect yet?
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Public username lookup stays available — it doesn&apos;t
                require an account connection.
              </p>
            </div>
          </div>
          <Link to="/dashboard/explore" className="shrink-0">
            <Button size="sm" variant="outline">
              Explore public data
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Connection error banner */}
      {connectionError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">Connection service unavailable</p>
            <p className="mt-0.5 text-xs">
              {connectionError} — check that the APIVue backend is running
              and reachable at <code>VITE_API_URL</code>.
            </p>
          </div>
        </div>
      )}

      {/* Tracked profiles loading error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Could not load tracked profiles: {(error as Error).message}</p>
        </div>
      )}

      {/* Integration cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const account = accountStatus?.[integration.id];
          const isAccountConnected = account?.connected === true;
          const platformProfiles = profilesByPlatform[integration.id] ?? [];
          const isBusy = busyPlatform === integration.id;

          return (
            <Card
              key={integration.id}
              className="flex flex-col border-border bg-card transition-colors hover:border-primary/30"
            >
              <CardContent className="flex flex-1 flex-col p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted"
                      style={{ color: integration.accent }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="font-semibold">{integration.name}</h2>
                      <p className="text-[11px] text-muted-foreground">
                        {integration.authType === 'oauth'
                          ? 'OAuth connection'
                          : integration.authType === 'username'
                            ? 'Handle verification'
                            : 'Coming soon'}
                      </p>
                    </div>
                  </div>

                  {isAccountConnected ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    >
                      Connected
                    </Badge>
                  ) : platformProfiles.length > 0 ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      {platformProfiles.length} tracked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not connected
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <p className="mt-4 text-sm text-muted-foreground">
                  {integration.description}
                </p>

                {/* Connect / connected area */}
                <div className="mt-5">
                  {isAccountConnected && account ? (
                    <AccountSummary
                      account={account}
                      integrationName={integration.name}
                      onDisconnect={() => handleDisconnect(integration.id)}
                      onSync={
                        integration.id === 'github'
                          ? handleSyncGitHub
                          : undefined
                      }
                      canSync={integration.id === 'github'}
                      busy={isBusy}
                    />
                  ) : (
                    <ConnectForm
                      integrationId={integration.id}
                      integrationName={integration.name}
                      placeholder={integration.handlePlaceholder}
                      authType={integration.authType}
                      busy={isBusy}
                      onConnect={handleConnect}
                    />
                  )}
                </div>

                {/* Tracked public profiles */}
                <TrackedProfilesList
                  platform={integration.name}
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

      {/* Loading indicator */}
      {isLoading && profiles.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Loading your tracked profiles…
        </p>
      )}

      {/* Footer note */}
      <p className="text-[11px] text-muted-foreground">
        APIVue only accesses information you explicitly authorize. Public
        profile data is fetched from each platform&apos;s public API.
      </p>
    </div>
  );
}