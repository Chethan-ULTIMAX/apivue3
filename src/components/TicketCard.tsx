import { Ticket } from "@/lib/types";
import { useStore } from "@/lib/store";
import { TypeIcon, PriorityBadge, PriorityBar, MemberAvatar, PointsBadge, LabelChip } from "./TicketBadges";
import { MessageSquare, CheckCircle2 } from "lucide-react";

interface TicketCardProps {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
  compact?: boolean;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const members = useStore((s) => s.members);
  const assignee = members.find((m) => m.id === ticket.assigneeId);
  const completedSubtasks = ticket.subtasks?.filter((s) => s.completed).length ?? 0;
  const totalSubtasks = ticket.subtasks?.length ?? 0;
  const subtaskPct = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div
      className="relative bg-card border border-border rounded-lg p-3 pl-4 cursor-pointer hover:border-primary/40 transition-all group"
      onClick={() => onClick(ticket)}
    >
      <PriorityBar priority={ticket.priority} />

      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <TypeIcon type={ticket.type} className="h-3.5 w-3.5 shrink-0" />
          <span className="font-mono text-[11px] text-muted-foreground">{ticket.ticketId}</span>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>

      <p className="text-sm font-medium leading-snug mb-2 line-clamp-2 group-hover:text-foreground transition-colors">
        {ticket.title}
      </p>

      {ticket.labels?.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mb-2">
          {ticket.labels.slice(0, 3).map((label) => (
            <LabelChip key={label} label={label} />
          ))}
          {ticket.labels.length > 3 && (
            <span className="text-[9px] text-muted-foreground">+{ticket.labels.length - 3}</span>
          )}
        </div>
      )}

      {totalSubtasks > 0 && (
        <div className="mb-2">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${subtaskPct === 100 ? "bg-success" : "bg-primary"}`}
              style={{ width: `${subtaskPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          <PointsBadge points={ticket.storyPoints} />
          {totalSubtasks > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}
          {(ticket.comments?.length ?? 0) > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" />
              {ticket.comments.length}
            </span>
          )}
        </div>
        {assignee && <MemberAvatar name={assignee.name} avatar={assignee.avatar} />}
      </div>
    </div>
  );
}
