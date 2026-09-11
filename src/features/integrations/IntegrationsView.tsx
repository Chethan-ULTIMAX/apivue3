import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AddProfileDialog } from "@/components/apivue/AddProfileDialog";
import { Button } from "@/components/ui/button";
import { getIntegration, integrations } from "@/lib/integrations/registry";
import { useRemoveProfile, useSyncProfile, useTrackedProfiles } from "@/hooks/use-profiles";
import { ProfileAvatar } from "@/components/apivue/ProfileBits";
import { connectGitHub, disconnectGitHub, getIntegrationStatus, syncGitHub } from "@/lib/integrations/api";
import type { IntegrationStatus } from "@/lib/integrations/types";

export function IntegrationsView() {
  const { data: profiles = [], isLoading, error } = useTrackedProfiles();
  const remove = useRemoveProfile();
  const sync = useSyncProfile();
  const [addOpen, setAddOpen] = useState(false);
  const [platform, setPlatform] = useState<string | undefined>();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<IntegrationStatus | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const loadAccountStatus = async () => {
    try {
      setAccountStatus(await getIntegrationStatus());
    } catch (error) {
      setConnectionError((error as Error).message);
    }
  };

  useEffect(() => { void loadAccountStatus(); }, []);

  const refresh = async (id: string, provider: string, handle: string) => {
    setBusyId(id);
    try {
      await sync.mutateAsync({ platform: provider, handle });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track public profiles and build private history from authenticated syncs.</p>
      </div>

      {connectionError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{connectionError}</div>}

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        Integrations connect your own account. Public username lookup remains available in <Link className="text-primary hover:underline" to="/dashboard/explore">Explore</Link> and does not create a private account connection.
      </div>

      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Could not load integrations: {(error as Error).message}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const connected = profiles.filter((profile) => profile.platform === integration.id);
          const githubConnected = integration.id === "github" && accountStatus?.github.connected;
          return <div key={integration.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted"><Icon className="h-5 w-5" style={{ color: integration.accent }} /></div><div><h2 className="font-semibold">{integration.name}</h2><p className="text-xs text-muted-foreground">{integration.authType === "oauth" ? "Public profile sync available" : "Public handle sync available"}</p></div></div>
              <span className={`rounded-full px-2 py-1 text-[11px] ${githubConnected || connected.length ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{githubConnected ? "Connected" : connected.length ? `${connected.length} public profiles` : "Not connected"}</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{integration.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {integration.id === "github" ? (
                githubConnected ? <><Button size="sm" variant="outline" onClick={async () => { setConnecting(true); try { await syncGitHub(); await loadAccountStatus(); } catch (error) { setConnectionError((error as Error).message); } finally { setConnecting(false); } }} disabled={connecting}>{connecting ? "Syncing..." : "Sync now"}</Button><Button size="sm" variant="outline" onClick={async () => { await disconnectGitHub(); await loadAccountStatus(); }}>Disconnect GitHub</Button></> : <Button size="sm" disabled={connecting} onClick={async () => { setConnecting(true); setConnectionError(null); try { await connectGitHub(); } catch (error) { setConnectionError((error as Error).message); setConnecting(false); } }}> {connecting ? "Connecting..." : "Connect GitHub"} </Button>
              ) : <><span className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">Public data integration</span><Link to="/dashboard/explore"><Button size="sm" variant="outline">Explore public profile</Button></Link></>}
            </div>
            {githubConnected && accountStatus?.github.username && <p className="mt-3 text-xs text-muted-foreground">Connected as @{accountStatus.github.username}{accountStatus.github.connectedAt ? ` · ${new Date(accountStatus.github.connectedAt).toLocaleDateString()}` : ""}</p>}
            {connected.length > 0 && <div className="mt-5 space-y-3 border-t border-border pt-4">{connected.map((profile) => <div key={profile.id} className="flex items-center gap-3"><ProfileAvatar profile={profile} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{profile.display_name || profile.handle}</p><p className="text-xs text-muted-foreground">@{profile.handle} · {profile.last_synced_at ? `Synced ${new Date(profile.last_synced_at).toLocaleString()}` : "Not synced"}</p>{profile.sync_error && <p className="text-xs text-destructive">{profile.sync_error}</p>}</div>{profile.profile_url && <a href={profile.profile_url} target="_blank" rel="noreferrer" title="Open profile"><ExternalLink className="h-4 w-4 text-muted-foreground" /></a>}<button title="Sync profile" disabled={busyId === profile.id} onClick={() => refresh(profile.id, profile.platform, profile.handle)} className="text-muted-foreground hover:text-foreground"><RefreshCw className={`h-4 w-4 ${busyId === profile.id ? "animate-spin" : ""}`} /></button><button title="Disconnect profile" onClick={() => remove.mutate(profile.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>)}</div>}
          </div>;
        })}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading connected profiles...</p>}
      <AddProfileDialog open={addOpen} onOpenChange={setAddOpen} defaultPlatform={platform} />
    </div>
  );
}
