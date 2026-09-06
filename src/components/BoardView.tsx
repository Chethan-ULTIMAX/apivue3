import { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useStore } from "@/lib/store";
import { COLUMNS, Ticket, TicketStatus, TicketType } from "@/lib/types";
import { TicketCard } from "./TicketCard";
import { TicketDetailPanel } from "./TicketDetailPanel";
import { TicketContextMenu } from "./TicketContextMenu";
import { SprintHeader } from "./SprintHeader";
import { CreateTicketModal } from "./CreateTicketModal";
import { SkeletonCard } from "./TicketBadges";
import { Plus, Inbox } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";

export function BoardView() {
  const tickets = useStore((s) => s.tickets);
  const activeSprint = useStore((s) => s.activeSprint);
  const sprints = useStore((s) => s.sprints);
  const members = useStore((s) => s.members);
  const moveTicket = useStore((s) => s.moveTicket);
  const permissions = usePermissions();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TicketStatus | undefined>();
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [focusedCol, setFocusedCol] = useState(0);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable) return;
      if ((e.key === "n" || e.key === "N") && permissions.can("create_ticket")) {
        e.preventDefault();
        setCreateDefaultStatus(COLUMNS[focusedCol]?.key);
        setShowCreate(true);
      }
      if (e.key === "Escape") setSelectedTicket(null);
      if (e.key === "ArrowRight") { e.preventDefault(); setFocusedCol((c) => Math.min(c + 1, COLUMNS.length - 1)); }
      if (e.key === "ArrowLeft") { e.preventDefault(); setFocusedCol((c) => Math.max(c - 1, 0)); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusedCol, permissions]);

  const viewingSprint = useMemo(() => {
    if (selectedSprintId) return sprints.find((s) => s.id === selectedSprintId) || null;
    return activeSprint || sprints[0] || null;
  }, [activeSprint, selectedSprintId, sprints]);

  useEffect(() => {
    if (selectedSprintId && !sprints.some((s) => s.id === selectedSprintId)) {
      setSelectedSprintId(null);
    }
  }, [selectedSprintId, sprints]);

  const sprintTickets = useMemo(
    () => tickets.filter((t) => t.sprintId === viewingSprint?.id),
    [tickets, viewingSprint?.id]
  );

  const availableTypes = useMemo(() => {
    const set = new Set<TicketType>();
    sprintTickets.forEach((t) => t.type && set.add(t.type));
    return Array.from(set).sort();
  }, [sprintTickets]);

  useEffect(() => {
    if (filterType !== "all" && !availableTypes.includes(filterType as TicketType)) {
      setFilterType("all");
    }
  }, [availableTypes, filterType]);

  const filteredTickets = useMemo(() => sprintTickets.filter((t) => {
    if (filterAssignee !== "all" && t.assigneeId !== filterAssignee) return false;
    if (filterType !== "all" && t.type !== filterType) return false;
    return true;
  }), [sprintTickets, filterAssignee, filterType]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    if (!permissions.can("move_ticket")) return;
    const newStatus = result.destination.droppableId as TicketStatus;
    if (result.source.droppableId === newStatus) return;
    moveTicket(result.draggableId, newStatus);
  }, [moveTicket, permissions]);

  if (!viewingSprint) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <Inbox className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-medium mb-1">No sprints yet</h2>
        <p className="text-sm text-muted-foreground">Create a sprint from the sprint planning view to see your board.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SprintHeader sprint={viewingSprint} tickets={sprintTickets} />

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 border-b border-border">
        <Select value={viewingSprint.id} onValueChange={setSelectedSprintId}>
          <SelectTrigger className="w-full sm:w-52 h-9 sm:h-8 text-xs bg-card border-border"><SelectValue placeholder="Select sprint" /></SelectTrigger>
          <SelectContent>
            {sprints.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}{s.isActive ? " (active)" : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="flex-1 sm:flex-none sm:w-40 h-9 sm:h-8 text-xs bg-card border-border min-w-[140px]"><SelectValue placeholder="Filter by assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="flex-1 sm:flex-none sm:w-32 h-9 sm:h-8 text-xs bg-card border-border min-w-[120px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {availableTypes.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="hidden sm:block flex-1" />
        {permissions.can("create_ticket") && (
          <Button size="sm" variant="outline" className="w-full sm:w-auto h-9 sm:h-8 text-xs gap-1.5 min-h-11 sm:min-h-0" onClick={() => { setCreateDefaultStatus(undefined); setShowCreate(true); }}>
            <Plus className="h-3.5 w-3.5" /> New ticket
            <kbd className="ml-1.5 text-[9px] bg-muted px-1 py-0.5 rounded font-mono hidden sm:inline">N</kbd>
          </Button>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 p-4 sm:p-6 overflow-x-auto scrollbar-thin min-w-0 snap-x snap-mandatory md:snap-none">
          {COLUMNS.map((col, colIdx) => {
            const colTickets = filteredTickets.filter((t) => t.status === col.key);
            const isFocused = colIdx === focusedCol;
            return (
              <Droppable key={col.key} droppableId={col.key}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={`flex-shrink-0 w-72 min-w-[280px] snap-center flex flex-col rounded-lg transition-all duration-200 ${
                      snapshot.isDraggingOver ? "bg-primary/5 ring-2 ring-primary/30 shadow-lg" : ""
                    } ${isFocused ? "ring-1 ring-primary/20" : ""}`}>
                    <div className="flex items-center gap-2 px-2 pb-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</h3>
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">{colTickets.length}</span>
                    </div>
                    <div className="flex-1 space-y-2 min-h-[120px]" role="list" aria-label={`${col.label} column`}>
                      {loading ? (<><SkeletonCard />{col.key !== "done" && <SkeletonCard />}</>) : (
                        <>
                          {colTickets.map((ticket, index) => (
                            <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                  className={`transition-transform duration-200 ${snapshot.isDragging ? "opacity-90 rotate-[2deg] scale-105 z-50 shadow-xl" : ""}`}
                                  style={provided.draggableProps.style}
                                  role="listitem"
                                  aria-label={`${ticket.ticketId}: ${ticket.title}`}
                                >
                                  <TicketContextMenu ticket={ticket} onEdit={setSelectedTicket}>
                                    <div><TicketCard ticket={ticket} onClick={setSelectedTicket} /></div>
                                  </TicketContextMenu>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {colTickets.length === 0 && !snapshot.isDraggingOver && (
                            <div className="border-2 border-dashed border-border/50 rounded-lg h-24 flex items-center justify-center">
                              <p className="text-xs text-muted-foreground/50">Drop tickets here</p>
                            </div>
                          )}
                        </>
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {selectedTicket && <TicketDetailPanel ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
      <CreateTicketModal open={showCreate} onClose={() => setShowCreate(false)} defaultSprintId={viewingSprint.id} defaultStatus={createDefaultStatus} />
    </div>
  );
}
