import { useMemo } from "react";
import { Brain, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfileSnapshots, useTrackedProfiles } from "@/hooks/use-profiles";
import { buildProgressReport } from "@/lib/analytics/progress";

export function AIInsightsView() {
  const profilesQuery = useTrackedProfiles();
  const snapshotsQuery = useProfileSnapshots();
  const profiles = profilesQuery.data ?? [];
  const snapshots = snapshotsQuery.data ?? [];
  const report = useMemo(() => buildProgressReport(profilesQuery.data ?? [], snapshotsQuery.data ?? []), [profilesQuery.data, snapshotsQuery.data]);

  if (profilesQuery.isLoading || snapshotsQuery.isLoading) return <div className="p-6 text-sm text-muted-foreground">Preparing insights from your data...</div>;
  if (profilesQuery.error || snapshotsQuery.error) return <div className="p-6 text-sm text-destructive">Could not load analytics context.</div>;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div><div className="flex items-center gap-2 text-violet-300"><Brain className="h-5 w-5" /><span className="text-sm font-medium">AI guidance</span></div><h1 className="mt-2 text-2xl font-bold">Insights from your real activity</h1><p className="mt-1 text-sm text-muted-foreground">Deterministic observations are shown now; an AI interpretation layer can use this same structured context later.</p></div>
      {profiles.length === 0 ? <Card><CardContent className="p-8 text-center"><Sparkles className="mx-auto h-8 w-8 text-muted-foreground/40" /><p className="mt-3 text-sm font-medium">No analytics context yet</p><p className="mt-1 text-sm text-muted-foreground">Connect a profile and collect snapshots before requesting guidance.</p></CardContent></Card> : <>
        <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Connected sources</p><p className="mt-1 text-2xl font-bold">{report.profileCount}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Recorded snapshots</p><p className="mt-1 text-2xl font-bold">{report.snapshotCount}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Events in last 7 days</p><p className="mt-1 text-2xl font-bold">{report.activity.last7.toLocaleString()}</p></CardContent></Card></div>
        <section className="grid gap-4 md:grid-cols-2">{report.observations.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted-foreground">More history is needed before meaningful patterns can be identified.</CardContent></Card> : report.observations.map((observation) => <Card key={observation.id}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-violet-300" />{observation.title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Based on your APIVue activity, {observation.detail}</p></CardContent></Card>)}</section>
      </>}
+    </div>
  );
}
