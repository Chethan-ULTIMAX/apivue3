import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { TicketCard } from "./TicketCard";
import { TicketDetailPanel } from "./TicketDetailPanel";
import { CreateEpicModal } from "./CreateEpicModal";
import { Ticket } from "@/lib/types";
import { ChevronDown, ChevronRight, Inbox, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/hooks/use-permissions";

export function EpicsView() {
  const tickets = useStore((s) => s.tickets);
  const epics = useStore((s) => s.epics);
  const updateEpic = useStore((s) => s.updateEpic);
  const deleteEpic = useStore((s) => s.deleteEpic);
  const permissions = usePermissions();
  const [loading, setLoading] = useState(true);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEpic, setEditingEpic] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const toggleEpic = (epicId: string) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(epicId)) next.delete(epicId);
      else next.add(epicId);
      return next;
    });
  };

  const handleSaveEpicName = (epicId: string) => {
    if (editName.trim()) {
      updateEpic(epicId, { name: editName.trim() });
    }
    setEditingEpic(null);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-lg font-semibold mb-6">Epics</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-24 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="h-2 w-full bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Epics</h1>
        {permissions.can("create_epic") && (
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" /> New epic
          </Button>
        )}
      </div>

      {epics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-medium mb-1">No epics yet</h3>
          <p className="text-xs text-muted-foreground mb-4">Create your first epic to organize tickets.</p>
          {permissions.can("create_epic") && <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" /> Create epic
          </Button>}
        </div>
      ) : (
        <div className="space-y-4">
          {epics.map((epic) => {
            const epicTickets = tickets.filter((t) => t.epicId === epic.id);
            const done = epicTickets.filter((t) => t.status === "done").length;
            const total = epicTickets.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const isExpanded = expandedEpics.has(epic.id);
            const totalPoints = epicTickets.reduce((s, t) => s + t.storyPoints, 0);
            const donePoints = epicTickets.filter((t) => t.status === "done").reduce((s, t) => s + t.storyPoints, 0);

            return (
              <div key={epic.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="w-full p-5 text-left flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <button className="flex items-center gap-3 flex-1" onClick={() => toggleEpic(epic.id)}>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div className={`w-3 h-3 rounded-full bg-${epic.color}`} />
                    {editingEpic === epic.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleSaveEpicName(epic.id)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveEpicName(epic.id); if (e.key === "Escape") setEditingEpic(null); }}
                        className="h-7 text-sm font-semibold bg-muted border-border w-48"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h2 className="font-semibold">{epic.name}</h2>
                    )}
                    {epic.targetQuarter && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{epic.targetQuarter}</span>}
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{donePoints}/{totalPoints} pts</span>
                    <span className="text-sm text-muted-foreground">{done}/{total} tickets</span>
                    {permissions.can("edit_epic") && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditName(epic.name); setEditingEpic(epic.id); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>}
                    {permissions.can("delete_epic") && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteEpic(epic.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>}
                  </div>
                </div>
                <div className="px-5 pb-4">
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{pct}% complete</p>
                </div>
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-2 border-t border-border pt-3">
                    {epicTickets.length > 0 ? (
                      epicTickets.map((t) => (
                        <TicketCard key={t.id} ticket={t} onClick={setSelectedTicket} compact />
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">No tickets in this epic</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedTicket && <TicketDetailPanel ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
      <CreateEpicModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
