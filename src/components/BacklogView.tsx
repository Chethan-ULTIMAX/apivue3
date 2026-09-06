import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Ticket, TicketType } from "@/lib/types";
import { TicketCard } from "./TicketCard";
import { TicketDetailPanel } from "./TicketDetailPanel";
import { TicketContextMenu } from "./TicketContextMenu";
import { CreateTicketModal } from "./CreateTicketModal";
import { SkeletonCard } from "./TicketBadges";
import { Plus, Search, Inbox, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

export function BacklogView() {
  const tickets = useStore((s) => s.tickets);
  const epics = useStore((s) => s.epics);
  const members = useStore((s) => s.members);
  const activeSprint = useStore((s) => s.activeSprint);
  const assignToSprint = useStore((s) => s.assignToSprint);
  const permissions = usePermissions();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterEpic, setFilterEpic] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { const t = setTimeout(() => setLoading(false), 300); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable) return;
      if ((e.key === "n" || e.key === "N") && permissions.can("create_ticket")) { e.preventDefault(); setShowCreate(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [permissions]);

  const backlogTickets = tickets.filter((t) => t.status === "backlog" || !t.sprintId);

  const availableTypes = useMemo(() => {
    const set = new Set<TicketType>();
    backlogTickets.forEach((t) => t.type && set.add(t.type));
    return Array.from(set).sort();
  }, [backlogTickets]);

  useEffect(() => {
    if (filterType !== "all" && !availableTypes.includes(filterType as TicketType)) {
      setFilterType("all");
    }
  }, [availableTypes, filterType]);

  const filtered = useMemo(() => backlogTickets.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.ticketId.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterEpic === "unassigned") { if (t.epicId) return false; }
    else if (filterEpic !== "all" && t.epicId !== filterEpic) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterAssignee !== "all" && t.assigneeId !== filterAssignee) return false;
    if (filterType !== "all" && t.type !== filterType) return false;
    return true;
  }), [backlogTickets, search, filterEpic, filterPriority, filterAssignee, filterType]);

  const grouped = epics.map((epic) => ({
    epic,
    tickets: filtered.filter((t) => t.epicId === epic.id),
  })).filter((g) => g.tickets.length > 0);

  const unassignedTickets = filtered.filter((t) => !t.epicId);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkMoveToSprint = () => {
    if (!activeSprint || selected.size === 0 || !permissions.can("move_ticket_to_sprint")) return;
    selected.forEach((id) => assignToSprint(id, activeSprint.id));
    toast.success(`${selected.size} ticket${selected.size > 1 ? "s" : ""} moved to ${activeSprint.name}`);
    setSelected(new Set());
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-lg font-semibold">Backlog</h1>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-sm text-muted-foreground">{backlogTickets.length} tickets</span>
          {permissions.can("create_ticket") && (
            <Button size="sm" variant="outline" className="h-9 sm:h-8 text-xs gap-1.5 min-h-11 sm:min-h-0" onClick={() => setShowCreate(true)}>
              <Plus className="h-3.5 w-3.5" /> Add ticket
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
        <div className="relative w-full sm:flex-1 sm:max-w-xs sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border h-11 sm:h-10" />
        </div>
        <Select value={filterEpic} onValueChange={setFilterEpic}>
          <SelectTrigger className="flex-1 sm:flex-none sm:w-32 bg-card border-border min-w-[120px]"><SelectValue placeholder="Epic" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Epics</SelectItem>
            <SelectItem value="unassigned">Not assigned</SelectItem>
            {epics.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="flex-1 sm:flex-none sm:w-32 bg-card border-border min-w-[110px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="P0">P0</SelectItem><SelectItem value="P1">P1</SelectItem><SelectItem value="P2">P2</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="flex-1 sm:flex-none sm:w-36 bg-card border-border min-w-[130px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="flex-1 sm:flex-none sm:w-32 bg-card border-border min-w-[120px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {availableTypes.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5 animate-fade-in">
          <span className="text-xs font-medium">{selected.size} selected</span>
          {activeSprint && permissions.can("move_ticket_to_sprint") && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={bulkMoveToSprint}>
              <ArrowRight className="h-3 w-3" /> Move to {activeSprint.name}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ epic, tickets: epicTickets }) => (
            <div key={epic.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full bg-${epic.color}`} />
                <h2 className="text-sm font-semibold">{epic.name}</h2>
                <span className="text-xs text-muted-foreground">({epicTickets.length})</span>
              </div>
              <div className="space-y-2">
                {epicTickets.slice(0, visibleCount).map((t) => (
                  <div key={t.id} className="flex items-start gap-2">
                    <div className="pt-3.5">
                      {permissions.can("move_ticket_to_sprint") && <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} aria-label={`Select ${t.ticketId}`} />}
                    </div>
                    <div className="flex-1">
                      <TicketContextMenu ticket={t} onEdit={setSelectedTicket}>
                        <div><TicketCard ticket={t} onClick={setSelectedTicket} /></div>
                      </TicketContextMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {unassignedTickets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />
                <h2 className="text-sm font-semibold">Not assigned</h2>
                <span className="text-xs text-muted-foreground">({unassignedTickets.length})</span>
              </div>
              <div className="space-y-2">
                {unassignedTickets.slice(0, visibleCount).map((t) => (
                  <div key={t.id} className="flex items-start gap-2">
                    <div className="pt-3.5">
                      {permissions.can("move_ticket_to_sprint") && <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} aria-label={`Select ${t.ticketId}`} />}
                    </div>
                    <div className="flex-1">
                      <TicketContextMenu ticket={t} onEdit={setSelectedTicket}>
                        <div><TicketCard ticket={t} onClick={setSelectedTicket} /></div>
                      </TicketContextMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {grouped.length === 0 && unassignedTickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-sm font-medium mb-1">No tickets in backlog</h3>
              <p className="text-xs text-muted-foreground mb-4">Add your first ticket to get started</p>
              {permissions.can("create_ticket") && (
                <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add ticket
                </Button>
              )}
            </div>
          )}
          {filtered.length > visibleCount && (
            <div className="text-center pt-4">
              <Button variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + 20)}>
                Load more ({filtered.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {selectedTicket && <TicketDetailPanel ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
      <CreateTicketModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
