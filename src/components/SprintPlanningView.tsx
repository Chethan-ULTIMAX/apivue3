import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useStore } from "@/lib/store";
import { TicketCard } from "./TicketCard";
import { Ticket } from "@/lib/types";
import { TicketDetailPanel } from "./TicketDetailPanel";
import { CreateTicketModal } from "./CreateTicketModal";
import { CreateSprintModal } from "./CreateSprintModal";
import { SkeletonCard } from "./TicketBadges";
import { ArrowRight, Users, Plus, Inbox, Play, TrendingUp, Info, CalendarRange, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePermissions } from "@/hooks/use-permissions";

export function SprintPlanningView() {
  const tickets = useStore((s) => s.tickets);
  const activeSprint = useStore((s) => s.activeSprint);
  const sprints = useStore((s) => s.sprints);
  const members = useStore((s) => s.members);
  const assignToSprint = useStore((s) => s.assignToSprint);
  const startSprint = useStore((s) => s.startSprint);
  const deleteSprint = useStore((s) => s.deleteSprint);
  const permissions = usePermissions();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberDays, setMemberDays] = useState<Record<string, number>>(
    Object.fromEntries(members.map((m) => [m.id, m.availableDays || 10]))
  );

  useEffect(() => { const t = setTimeout(() => setLoading(false), 300); return () => clearTimeout(t); }, []);

  // Determine which sprint to show on right side
  const viewingSprint = selectedSprintId
    ? sprints.find((s) => s.id === selectedSprintId) || activeSprint
    : activeSprint;

  const backlogTickets = tickets.filter((t) => !t.sprintId);
  const sprintTickets = viewingSprint ? tickets.filter((t) => t.sprintId === viewingSprint.id) : [];
  const futureSprints = sprints.filter((s) => !s.isActive);

  const totalCapacity = Object.values(memberDays).reduce((s, d) => s + d * 1.5, 0);
  const committedPoints = sprintTickets.reduce((s, t) => s + t.storyPoints, 0);
  const capacityPct = totalCapacity > 0 ? Math.min(100, (committedPoints / totalCapacity) * 100) : 0;

  const completedSprints = sprints.filter((s) => !s.isActive);
  const lastThree = completedSprints.slice(-3);
  const avgVelocity = lastThree.length > 0
    ? Math.round(lastThree.reduce((sum, sprint) => {
        const sprintDone = tickets.filter((t) => t.sprintId === sprint.id && t.status === "done");
        return sum + sprintDone.reduce((s, t) => s + t.storyPoints, 0);
      }, 0) / lastThree.length)
    : 0;

  const addToSprint = (ticketId: string) => {
    if (viewingSprint && permissions.can("move_ticket_to_sprint")) assignToSprint(ticketId, viewingSprint.id);
  };

  const removeFromSprint = (ticketId: string) => {
    if (permissions.can("move_ticket_to_sprint")) assignToSprint(ticketId, null);
  };

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    if (!permissions.can("move_ticket_to_sprint")) return;
    const ticketId = result.draggableId;
    const dest = result.destination.droppableId;
    if (result.source.droppableId === dest) return;
    if (dest === "sprint" && viewingSprint) {
      assignToSprint(ticketId, viewingSprint.id);
    } else if (dest === "backlog") {
      assignToSprint(ticketId, null);
    }
  }, [viewingSprint, assignToSprint, permissions]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden">
        {/* Left: Backlog */}
        <Droppable droppableId="backlog">
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps}
              className={`w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-border p-4 sm:p-6 lg:overflow-y-auto scrollbar-thin transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Backlog ({backlogTickets.length})</h2>
                {permissions.can("create_ticket") && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setShowCreate(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {loading ? [1, 2, 3].map((i) => <SkeletonCard key={i} />) : (
                  <>
                    {backlogTickets.map((t, index) => (
                      <Draggable key={t.id} draggableId={t.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}
                            className={`relative group ${dragSnapshot.isDragging ? "opacity-90 rotate-[1deg] scale-105 z-50 shadow-xl" : ""}`}
                            style={dragProvided.draggableProps.style}>
                            <TicketCard ticket={t} onClick={setSelectedTicket} />
                            {permissions.can("move_ticket_to_sprint") && <button onClick={(e) => { e.stopPropagation(); addToSprint(t.id); }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground rounded p-1" title={`Add to ${viewingSprint?.name || "sprint"}`}>
                              <ArrowRight className="h-3 w-3" />
                            </button>}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {backlogTickets.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex flex-col items-center py-12 text-center">
                        <Inbox className="h-8 w-8 text-muted-foreground/40 mb-2" />
                        <p className="text-xs text-muted-foreground">Backlog is empty</p>
                      </div>
                    )}
                  </>
                )}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>

        {/* Right: Sprint */}
        <Droppable droppableId="sprint">
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps}
              className={`w-full lg:w-1/2 p-4 sm:p-6 lg:overflow-y-auto scrollbar-thin transition-colors ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}>
              {/* Sprint selector + create */}
              <div className="flex items-center gap-2 mb-4">
                <Select value={viewingSprint?.id || ""} onValueChange={(id) => setSelectedSprintId(id)}>
                  <SelectTrigger className="h-8 text-xs bg-card border-border flex-1">
                    <SelectValue placeholder="Select sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    {sprints.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.isActive ? "(active)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {permissions.can("create_sprint") && (
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1 shrink-0" onClick={() => setShowCreateSprint(true)}>
                    <Plus className="h-3.5 w-3.5" /> New sprint
                  </Button>
                )}
              </div>

              {!viewingSprint ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h2 className="text-lg font-medium mb-1">No sprints yet</h2>
                  <p className="text-sm text-muted-foreground mb-4">Create a sprint to begin planning.</p>
                  {permissions.can("create_sprint") && <Button className="gap-1.5" onClick={() => setShowCreateSprint(true)}>
                    <Plus className="h-4 w-4" /> Create sprint
                  </Button>}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-sm font-semibold">{viewingSprint.name}</h2>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(viewingSprint.startDate).toLocaleDateString()} — {new Date(viewingSprint.endDate).toLocaleDateString()}
                        {viewingSprint.goal && ` · ${viewingSprint.goal}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!viewingSprint.isActive && permissions.can("start_sprint") && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => startSprint(viewingSprint.id)}>
                            <Play className="h-3 w-3" /> Start
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { deleteSprint(viewingSprint.id); setSelectedSprintId(null); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {viewingSprint.isActive && (
                        <span className="text-[10px] bg-success/15 text-success px-2 py-0.5 rounded font-medium">Active</span>
                      )}
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="bg-card border border-border rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Team capacity</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                      {members.map((m) => (
                        <div key={m.id} className="text-center">
                          <span className="text-[10px] text-muted-foreground block mb-1 truncate">{m.name.split(" ")[0]}</span>
                            <Input type="number" value={memberDays[m.id] ?? 10} onChange={(e) => setMemberDays((d) => ({ ...d, [m.id]: Number(e.target.value) }))}
                            className="h-9 sm:h-7 text-center text-xs bg-muted border-border" min={0} max={14} disabled={!permissions.can("edit_capacity")} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{committedPoints} / {Math.round(totalCapacity)} pts</span>
                        <span>{Math.round(capacityPct)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${capacityPct > 90 ? "bg-destructive" : capacityPct > 70 ? "bg-warning" : "bg-primary"}`}
                          style={{ width: `${capacityPct}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Velocity Stats */}
                  {completedSprints.length >= 2 && avgVelocity > 0 ? (
                    <div className="bg-card border border-border rounded-lg p-4 mb-4 flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-success shrink-0" />
                      <div>
                        <span className="text-xs text-muted-foreground">Avg. velocity (last {lastThree.length} sprints)</span>
                        <p className="text-sm font-semibold">{avgVelocity} pts/sprint</p>
                      </div>
                      {committedPoints > avgVelocity * 1.2 && (
                        <span className="text-[10px] text-warning bg-warning/10 px-2 py-0.5 rounded ml-auto">Over-committed</span>
                      )}
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-lg p-4 mb-4 flex items-center gap-3">
                      <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">Not enough data for AI suggestions yet. Complete at least 2 sprints to see velocity insights.</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground mb-2">{sprintTickets.length} ticket{sprintTickets.length !== 1 ? "s" : ""}</div>
                  <div className="space-y-2">
                    {loading ? [1, 2].map((i) => <SkeletonCard key={i} />) : (
                      <>
                        {sprintTickets.map((t, index) => (
                          <Draggable key={t.id} draggableId={t.id} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}
                                className={`relative ${dragSnapshot.isDragging ? "opacity-90 rotate-[1deg] scale-105 z-50 shadow-xl" : ""}`}
                                style={dragProvided.draggableProps.style}>
                                <TicketCard ticket={t} onClick={setSelectedTicket} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {sprintTickets.length === 0 && !snapshot.isDraggingOver && (
                          <div className="border-2 border-dashed border-border/50 rounded-lg py-12 flex flex-col items-center text-center">
                            <p className="text-xs text-muted-foreground/50">Drag tickets from the backlog or click the arrow to add</p>
                          </div>
                        )}
                      </>
                    )}
                    {provided.placeholder}
                  </div>
                </>
              )}
            </div>
          )}
        </Droppable>
      </div>

      {selectedTicket && <TicketDetailPanel ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
      <CreateTicketModal open={showCreate} onClose={() => setShowCreate(false)} />
      <CreateSprintModal open={showCreateSprint} onClose={() => setShowCreateSprint(false)} />
    </DragDropContext>
  );
}
