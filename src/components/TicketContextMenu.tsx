import { ReactNode } from "react";
import { Ticket, TicketStatus, COLUMNS } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ArrowRight, Pencil, Trash2, UserCircle, Repeat } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

interface Props {
  ticket: Ticket;
  children: ReactNode;
  onEdit: (ticket: Ticket) => void;
}

export function TicketContextMenu({ ticket, children, onEdit }: Props) {
  const permissions = usePermissions();
  const members = useStore((s) => s.members);
  const sprints = useStore((s) => s.sprints);
  const moveTicket = useStore((s) => s.moveTicket);
  const updateTicket = useStore((s) => s.updateTicket);
  const deleteTicket = useStore((s) => s.deleteTicket);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={() => onEdit(ticket)}>
          <Pencil className="h-3.5 w-3.5 mr-2" /> {permissions.can("edit_ticket") ? "Edit details" : "View details"}
        </ContextMenuItem>

        {permissions.can("move_ticket") && <ContextMenuSub>
          <ContextMenuSubTrigger>
            <ArrowRight className="h-3.5 w-3.5 mr-2" /> Move to
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {COLUMNS.filter((c) => c.key !== ticket.status).map((col) => (
              <ContextMenuItem key={col.key} onClick={() => moveTicket(ticket.id, col.key)}>
                {col.label}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>}

        {permissions.can("assign_ticket") && <ContextMenuSub>
          <ContextMenuSubTrigger>
            <UserCircle className="h-3.5 w-3.5 mr-2" /> Assign to
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => updateTicket(ticket.id, { assigneeId: null })}>
              Unassigned
            </ContextMenuItem>
            {members.map((m) => (
              <ContextMenuItem key={m.id} onClick={() => updateTicket(ticket.id, { assigneeId: m.id })}>
                {m.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>}

        {permissions.can("move_ticket_to_sprint") && <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Repeat className="h-3.5 w-3.5 mr-2" /> Move to sprint
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => updateTicket(ticket.id, { sprintId: null })}>
              No sprint (backlog)
            </ContextMenuItem>
            {sprints.filter((s) => s.id !== ticket.sprintId).map((s) => (
              <ContextMenuItem key={s.id} onClick={() => updateTicket(ticket.id, { sprintId: s.id })}>
                {s.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>}

        {permissions.can("delete_ticket") && <ContextMenuSeparator />}

        {permissions.can("delete_ticket") && (
          <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteTicket(ticket.id)}>
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete ticket
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
