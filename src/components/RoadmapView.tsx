import { useStore } from "@/lib/store";
import { useMemo } from "react";

export function RoadmapView() {
  const epics = useStore((s) => s.epics);
  const tickets = useStore((s) => s.tickets);

  // Timeline range: Q1-Q4 2026
  const quarters = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"];
  const quarterDates: Record<string, { start: Date; end: Date }> = {
    "Q1 2026": { start: new Date("2026-01-01"), end: new Date("2026-03-31") },
    "Q2 2026": { start: new Date("2026-04-01"), end: new Date("2026-06-30") },
    "Q3 2026": { start: new Date("2026-07-01"), end: new Date("2026-09-30") },
    "Q4 2026": { start: new Date("2026-10-01"), end: new Date("2026-12-31") },
  };

  const timelineStart = new Date("2026-01-01").getTime();
  const timelineEnd = new Date("2026-12-31").getTime();
  const totalDuration = timelineEnd - timelineStart;

  const epicData = useMemo(() => {
    return epics.map((epic) => {
      const epicTickets = tickets.filter((t) => t.epicId === epic.id);
      const done = epicTickets.filter((t) => t.status === "done").length;
      const total = epicTickets.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      const start = epic.startDate ? new Date(epic.startDate).getTime() : timelineStart;
      const end = epic.endDate ? new Date(epic.endDate).getTime() : timelineEnd;
      const leftPct = ((start - timelineStart) / totalDuration) * 100;
      const widthPct = ((end - start) / totalDuration) * 100;

      return { epic, done, total, pct, leftPct, widthPct };
    });
  }, [epics, tickets]);

  const todayPct = ((Date.now() - timelineStart) / totalDuration) * 100;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-6">Roadmap</h1>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Quarter headers */}
        <div className="flex border-b border-border">
          {quarters.map((q) => (
            <div key={q} className="flex-1 text-center py-3 text-xs font-semibold text-muted-foreground border-r border-border last:border-r-0">
              {q}
            </div>
          ))}
        </div>

        {/* Timeline body */}
        <div className="relative min-h-[200px] p-6">
          {/* Quarter grid lines */}
          {[25, 50, 75].map((pct) => (
            <div key={pct} className="absolute top-0 bottom-0 border-l border-border/50" style={{ left: `${pct}%` }} />
          ))}

          {/* Today marker */}
          {todayPct >= 0 && todayPct <= 100 && (
            <div className="absolute top-0 bottom-0 z-10" style={{ left: `${todayPct}%` }}>
              <div className="w-px h-full bg-primary/60" />
              <div className="absolute -top-0 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded-b">
                Today
              </div>
            </div>
          )}

          {/* Epic bars */}
          <div className="space-y-6 relative z-20">
            {epicData.map(({ epic, done, total, pct, leftPct, widthPct }) => (
              <div key={epic.id} className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full bg-${epic.color}`} />
                  <span className="text-sm font-semibold">{epic.name}</span>
                  <span className="text-[10px] text-muted-foreground">{done}/{total} tickets · {pct}%</span>
                  {epic.targetQuarter && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      Target: {epic.targetQuarter}
                    </span>
                  )}
                </div>
                <div className="relative h-8">
                  <div
                    className={`absolute h-full rounded-lg bg-${epic.color}/20 border border-${epic.color}/30`}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                  >
                    <div
                      className={`h-full rounded-lg bg-${epic.color}/40 transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-foreground/70">
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
