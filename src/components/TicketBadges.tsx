import { Bug, Lightbulb, CheckSquare, Tag } from "lucide-react";
import { TicketType, Priority, TicketLabel, LABEL_COLORS } from "@/lib/types";

export function TypeIcon({ type, className = "h-4 w-4" }: { type: TicketType; className?: string }) {
  switch (type) {
    case "bug": return <Bug className={`${className} text-destructive`} />;
    case "feature": return <Lightbulb className={`${className} text-info`} />;
    case "task": return <CheckSquare className={`${className} text-muted-foreground`} />;
  }
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    P0: "bg-priority-p0/15 text-priority-p0 border-priority-p0/30",
    P1: "bg-priority-p1/15 text-priority-p1 border-priority-p1/30",
    P2: "bg-muted text-muted-foreground border-border",
  };
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${styles[priority]}`}>{priority}</span>;
}

const PRIORITY_BAR_COLORS: Record<Priority, string> = {
  P0: "bg-priority-p0", P1: "bg-priority-p1", P2: "bg-muted-foreground/30",
};

export function PriorityBar({ priority }: { priority: Priority }) {
  return <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${PRIORITY_BAR_COLORS[priority]}`} />;
}

export function MemberAvatar({ name, avatar, size = "sm" }: { name: string; avatar: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "h-6 w-6 text-[10px]" : size === "md" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div className={`${s} rounded-full bg-primary/20 text-primary font-semibold flex items-center justify-center shrink-0`} title={name}>
      {avatar}
    </div>
  );
}

export function EpicBadge({ name, color }: { name: string; color: string }) {
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded bg-${color}/15 text-${color} border border-${color}/30`}>{name}</span>;
}

export function PointsBadge({ points }: { points: number }) {
  return <span className="text-[10px] font-mono-id bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{points}pt</span>;
}

export function LabelChip({ label }: { label: TicketLabel }) {
  return <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${LABEL_COLORS[label]}`}>{label}</span>;
}

export function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-3 animate-pulse">
      <div className="flex items-center justify-between mb-2"><div className="h-3 w-16 bg-muted rounded" /><div className="h-4 w-8 bg-muted rounded" /></div>
      <div className="h-4 w-full bg-muted rounded mb-1" /><div className="h-4 w-2/3 bg-muted rounded mb-3" />
      <div className="flex items-center justify-between"><div className="flex gap-1.5"><div className="h-4 w-4 bg-muted rounded" /><div className="h-4 w-10 bg-muted rounded" /></div><div className="h-6 w-6 bg-muted rounded-full" /></div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-5 animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-4" />
      <div className="h-[280px] bg-muted/50 rounded flex items-end justify-around px-8 pb-4 gap-3">
        {[40, 65, 55, 80, 45, 70].map((h, i) => (<div key={i} className="w-8 bg-muted rounded-t" style={{ height: `${h}%` }} />))}
      </div>
    </div>
  );
}
