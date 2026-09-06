import { useState, useRef, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Ticket } from "@/lib/types";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TypeIcon, PriorityBadge } from "./TicketBadges";

interface Props {
  onSelectTicket: (ticket: Ticket) => void;
}

export function GlobalSearch({ onSelectTicket }: Props) {
  const tickets = useStore((s) => s.tickets);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tickets.filter(
      (t) => t.ticketId.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, tickets]);

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="text-[9px] bg-muted px-1 py-0.5 rounded font-mono-id ml-2">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, title, or description..."
            className="pl-8 pr-8 h-8 w-64 bg-card border-border text-xs"
            onBlur={() => { if (!query) setTimeout(() => setOpen(false), 200); }}
          />
          {query && (
            <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="absolute top-full mt-1 w-80 bg-card border border-border rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto scrollbar-thin">
          {results.map((ticket) => (
            <button
              key={ticket.id}
              className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b border-border last:border-0 transition-colors"
              onClick={() => { onSelectTicket(ticket); setQuery(""); setOpen(false); }}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <TypeIcon type={ticket.type} className="h-3.5 w-3.5" />
                <span className="font-mono-id text-[10px] text-muted-foreground">{ticket.ticketId}</span>
                <PriorityBadge priority={ticket.priority} />
              </div>
              <p className="text-xs font-medium truncate">{ticket.title}</p>
            </button>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="absolute top-full mt-1 w-80 bg-card border border-border rounded-lg shadow-xl z-50 p-4 text-center">
          <p className="text-xs text-muted-foreground">No tickets found</p>
        </div>
      )}
    </div>
  );
}
