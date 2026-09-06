import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Loader2, Plug, Plus, RefreshCw, Search, Star, Trash2 } from "lucide-react";
import { useRemoveProfile, useSyncProfile, useTogglePinned, useTrackedProfiles } from "@/hooks/use-profiles";
import { formatMetric, getIntegration, metricOf } from "@/lib/integrations/registry";
import { AddProfileDialog } from "@/components/apivue/AddProfileDialog";
import { PlatformChip, ProfileAvatar } from "@/components/apivue/ProfileBits";
import { toast } from "@/hooks/use-toast";

export function ProfilesView() {
  const { data: profiles = [], isLoading } = useTrackedProfiles();
  const sync = useSyncProfile();
  const remove = useRemoveProfile();
  const pin = useTogglePinned();
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = profiles.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.handle.toLowerCase().includes(q) ||
      (p.display_name ?? "").toLowerCase().includes(q) ||
      getIntegration(p.platform).name.toLowerCase().includes(q)
    );
  });

  const refresh = async (id: string, platform: string, handle: string) => {
    setBusyId(id);
    try {
      await sync.mutateAsync({ platform, handle });
      toast({ title: "Refreshed", description: `${handle} is up to date.` });
    } catch (err) {
      toast({ title: "Refresh failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold">Profiles</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Public handles you track, across every integration.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search profiles"
              className="h-8 pl-8 w-44 text-xs"
            />
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Connect
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-card/40">
          <Plug className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium mb-1">{profiles.length ? "No matches" : "Nothing tracked yet"}</p>
          <p className="text-xs text-muted-foreground">
            {profiles.length ? "Try a different search." : "Connect your first public developer profile."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const integration = getIntegration(p.platform);
            return (
              <div
                key={p.id}
                className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <ProfileAvatar profile={p} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/dashboard/profiles/${p.id}`} className="text-sm font-medium truncate block hover:text-primary">
                      {p.display_name || p.handle}
                    </Link>
                    <p className="text-[11px] text-muted-foreground font-mono-id truncate">@{p.handle}</p>
                  </div>
                  <button
                    onClick={() => pin.mutate({ id: p.id, pinned: !p.pinned })}
                    title={p.pinned ? "Unpin" : "Pin to top"}
                    className="text-muted-foreground hover:text-warning transition-colors"
                  >
                    <Star className={`h-3.5 w-3.5 ${p.pinned ? "fill-warning text-warning" : ""}`} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <PlatformChip platform={p.platform} />
                  {integration.headlineMetrics.slice(0, 2).map((key) => {
                    const m = metricOf(p, key);
                    if (!m) return null;
                    return (
                      <span key={key} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        {m.label}: <span className="font-semibold text-foreground">{formatMetric(m.value, m.format)}</span>
                      </span>
                    );
                  })}
                </div>

                {p.sync_error && <p className="text-[11px] text-destructive mb-2">{p.sync_error}</p>}

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {p.last_synced_at ? `Synced ${new Date(p.last_synced_at).toLocaleString()}` : "Never synced"}
                  </span>
                  <div className="flex items-center gap-1">
                    {p.profile_url && (
                      <a
                        href={p.profile_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                        title="Open on platform"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => refresh(p.id, p.platform, p.handle)}
                      disabled={busyId === p.id}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                      title="Refresh data"
                    >
                      {busyId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => remove.mutate(p.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Remove profile"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
