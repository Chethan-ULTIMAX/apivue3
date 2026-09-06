import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { TicketType, Priority, Ticket, ALL_LABELS, TicketLabel, TicketStatus } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LABEL_COLORS } from "@/lib/types";
import { Sparkles, Loader2, Paperclip, X, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultSprintId?: string | null;
  defaultStatus?: TicketStatus;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function CreateTicketModal({ open, onClose, defaultSprintId = null, defaultStatus }: Props) {
  const addTicket = useStore((s) => s.addTicket);
  const epics = useStore((s) => s.epics);
  const members = useStore((s) => s.members);
  const tickets = useStore((s) => s.tickets);
  const workspaceId = useStore((s) => s.workspaceId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [type, setType] = useState<TicketType>("task");
  const [priority, setPriority] = useState<Priority | "">("");
  const [storyPoints, setStoryPoints] = useState<number | "">("");
  const [epicId, setEpicId] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [selectedLabels, setSelectedLabels] = useState<TicketLabel[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);
  const [relatedPicker, setRelatedPicker] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enhancingDesc, setEnhancingDesc] = useState(false);
  const [enhancingAC, setEnhancingAC] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleLabel = (label: TicketLabel) => {
    setSelectedLabels((prev) => prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]);
  };

  const handleFilesPicked = (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `${f.name} exceeds 20MB.`, variant: "destructive" });
        continue;
      }
      valid.push(f);
    }
    setAttachments((prev) => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (idx: number) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const addRelated = (id: string) => {
    if (!id || relatedIds.includes(id)) return;
    setRelatedIds((prev) => [...prev, id]);
    setRelatedPicker("");
  };
  const removeRelated = (id: string) => setRelatedIds((prev) => prev.filter((r) => r !== id));

  const stripMarkdown = (text: string): string => text
    .replace(/^#{1,6}\s+/gm, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1").replace(/_(.+?)_/g, "$1")
    .replace(/^[\s]*[-*]\s+/gm, "• ").replace(/\n{3,}/g, "\n\n").trim();

  const enhanceWithAI = async (field: "description" | "acceptanceCriteria") => {
    const own = field === "description" ? description : acceptanceCriteria;
    // AC can be generated from the description if empty
    const text = field === "acceptanceCriteria" && !own.trim() ? description : own;
    if (!text.trim()) {
      toast({ title: "Nothing to enhance", description: field === "acceptanceCriteria" ? "Write a description or some acceptance criteria first." : "Please write some text first.", variant: "destructive" });
      return;
    }
    const setLoading = field === "description" ? setEnhancingDesc : setEnhancingAC;
    setLoading(true);
    try {
      const body: { text: string; field: string; context?: string } = { text, field };
      if (field === "acceptanceCriteria" && description.trim()) body.context = description.trim();
      const { data, error } = await supabase.functions.invoke("enhance-ticket", { body });
      if (error) throw error;
      if (data?.enhanced) {
        const clean = stripMarkdown(data.enhanced);
        if (field === "description") setDescription(clean); else setAcceptanceCriteria(clean);
        toast({ title: "Enhanced!", description: `${field === "description" ? "Description" : "Acceptance criteria"} improved with AI.` });
      }
    } catch (err: any) {
      toast({ title: "Enhancement failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    else if (title.trim().length < 3) errs.title = "Title must be at least 3 characters";
    else if (title.trim().length > 200) errs.title = "Title must be under 200 characters";
    if (!description.trim()) errs.description = "Description is required";
    if (!acceptanceCriteria.trim()) errs.acceptanceCriteria = "Acceptance criteria are required";
    if (!priority) errs.priority = "Priority is required";
    if (storyPoints === "" || typeof storyPoints !== "number") errs.points = "Story points are required";
    else if (storyPoints < 1 || !Number.isInteger(storyPoints)) errs.points = "Must be a positive integer";
    else if (storyPoints > 21) errs.points = "Maximum 21 story points";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setAcceptanceCriteria(""); setType("task");
    setPriority(""); setStoryPoints(""); setEpicId(""); setAssigneeId("unassigned");
    setSelectedLabels([]); setAttachments([]); setRelatedIds([]); setRelatedPicker(""); setErrors({});
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!workspaceId) {
      toast({ title: "Workspace not ready", description: "Please refresh and try again.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const epic = epics.find((e) => e.id === epicId);
      const epicPrefix = epic ? (epic.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "TICK") : "TICK";
      const epicTickets = epicId ? tickets.filter((t) => t.epicId === epicId) : tickets.filter((t) => !t.epicId);
      const nextNum = 100 + epicTickets.length + 1;
      const ticketId = crypto.randomUUID();

      const ticket: Ticket = {
        id: ticketId, ticketId: `${epicPrefix}-${nextNum}`,
        title: title.trim(), description: description.trim(),
        acceptanceCriteria: acceptanceCriteria.trim(),
        status: defaultStatus || "backlog", type, priority: priority as Priority,
        storyPoints: storyPoints as number,
        assigneeId: assigneeId === "unassigned" ? null : assigneeId,
        epicId, sprintId: defaultSprintId, labels: selectedLabels,
        subtasks: [], comments: [],
        activity: [{ id: crypto.randomUUID(), action: "created", userId: "m1", createdAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
      };
      addTicket(ticket);

      // Upload attachments
      const db: any = supabase;
      for (const file of attachments) {
        const path = `${workspaceId}/${ticketId}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("ticket-attachments").upload(path, file, { contentType: file.type });
        if (upErr) {
          toast({ title: `Failed to upload ${file.name}`, description: upErr.message, variant: "destructive" });
          continue;
        }
        const { error: metaErr } = await db.from("ticket_attachments").insert({
          workspace_id: workspaceId, ticket_id: ticketId,
          file_name: file.name, file_path: path, file_size: file.size, content_type: file.type || null,
        });
        if (metaErr) toast({ title: `Failed to save ${file.name}`, description: metaErr.message, variant: "destructive" });
      }

      // Related tickets
      if (relatedIds.length > 0) {
        const rows = relatedIds.map((rid) => ({
          workspace_id: workspaceId, ticket_id: ticketId, related_ticket_id: rid,
        }));
        const { error: relErr } = await db.from("ticket_relations").insert(rows);
        if (relErr) toast({ title: "Failed to link related tickets", description: relErr.message, variant: "destructive" });
      }

      onClose();
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const availableRelated = tickets.filter((t) => !relatedIds.includes(t.id));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); resetForm(); } }}>
      <DialogContent className="w-[80vw] max-w-[80vw] h-[80vh] max-h-[80vh] flex flex-col bg-card border-border p-0" aria-describedby={undefined}>
        <DialogHeader className="px-6 pt-6"><DialogTitle>Create ticket</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2 overflow-y-auto px-6 flex-1 min-h-0">
          <div>
            <Label className="text-xs text-muted-foreground">Title *</Label>
            <Input value={title} onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: "" })); }}
              placeholder="What needs to be done?" className={`mt-1 bg-muted border-border ${errors.title ? "border-destructive" : ""}`} autoFocus />
            {errors.title && <p className="text-[11px] text-destructive mt-1">{errors.title}</p>}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Description *</Label>
            <Textarea value={description} onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors((p) => ({ ...p, description: "" })); }}
              placeholder="Add details..." className={`mt-1 bg-muted border-border min-h-[160px] resize-none ${errors.description ? "border-destructive" : ""}`} />
            {errors.description && <p className="text-[11px] text-destructive mt-1">{errors.description}</p>}
            <Button type="button" variant="outline" className="w-full mt-2 gap-2 text-xs h-8 border-dashed"
              onClick={() => enhanceWithAI("description")} disabled={enhancingDesc || !description.trim()}>
              {enhancingDesc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Enhance with AI
            </Button>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Acceptance criteria *</Label>
            <Textarea value={acceptanceCriteria} onChange={(e) => { setAcceptanceCriteria(e.target.value); if (errors.acceptanceCriteria) setErrors((p) => ({ ...p, acceptanceCriteria: "" })); }}
              placeholder="Define what 'done' looks like..." className={`mt-1 bg-muted border-border min-h-[160px] resize-none ${errors.acceptanceCriteria ? "border-destructive" : ""}`} />
            {errors.acceptanceCriteria && <p className="text-[11px] text-destructive mt-1">{errors.acceptanceCriteria}</p>}
            <Button type="button" variant="outline" className="w-full mt-2 gap-2 text-xs h-8 border-dashed"
              onClick={() => enhanceWithAI("acceptanceCriteria")} disabled={enhancingAC || (!acceptanceCriteria.trim() && !description.trim())}>
              {enhancingAC ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {acceptanceCriteria.trim() ? "Enhance with AI" : "Generate from description"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TicketType)}>
                <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="task">Task</SelectItem><SelectItem value="feature">Feature</SelectItem><SelectItem value="bug">Bug</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Priority *</Label>
              <Select value={priority} onValueChange={(v) => { setPriority(v as Priority); if (errors.priority) setErrors((p) => ({ ...p, priority: "" })); }}>
                <SelectTrigger className={`mt-1 bg-muted border-border ${errors.priority ? "border-destructive" : ""}`}><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent><SelectItem value="P0">P0 — Critical</SelectItem><SelectItem value="P1">P1 — High</SelectItem><SelectItem value="P2">P2 — Medium</SelectItem></SelectContent>
              </Select>
              {errors.priority && <p className="text-[11px] text-destructive mt-1">{errors.priority}</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Epic</Label>
              <Select value={epicId || "none"} onValueChange={(v) => setEpicId(v === "none" ? "" : v)}>
                <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {epics.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Story points *</Label>
              <Select value={storyPoints === "" ? "" : String(storyPoints)}
                onValueChange={(v) => { setStoryPoints(Number(v)); if (errors.points) setErrors((p) => ({ ...p, points: "" })); }}>
                <SelectTrigger className={`mt-1 bg-muted border-border ${errors.points ? "border-destructive" : ""}`}><SelectValue placeholder="Select points" /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 5, 8, 13].map((p) => <SelectItem key={p} value={String(p)}>{p}</SelectItem>)}</SelectContent>
              </Select>
              {errors.points && <p className="text-[11px] text-destructive mt-1">{errors.points}</p>}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Related tickets</Label>
            <Select value={relatedPicker} onValueChange={addRelated}>
              <SelectTrigger className="mt-1 bg-muted border-border">
                <SelectValue placeholder={availableRelated.length ? "Link a related ticket..." : "No other tickets available"} />
              </SelectTrigger>
              <SelectContent>
                {availableRelated.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="font-mono text-[11px] mr-2">{t.ticketId}</span>{t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {relatedIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {relatedIds.map((rid) => {
                  const t = tickets.find((x) => x.id === rid);
                  if (!t) return null;
                  return (
                    <Badge key={rid} variant="secondary" className="gap-1.5 pr-1">
                      <Link2 className="h-3 w-3" />
                      <span className="font-mono text-[10px]">{t.ticketId}</span>
                      <span className="truncate max-w-[180px]">{t.title}</span>
                      <button type="button" onClick={() => removeRelated(rid)} className="hover:bg-muted rounded p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Attachments</Label>
            <input ref={fileInputRef} type="file" multiple className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              onChange={(e) => handleFilesPicked(e.target.files)} />
            <Button type="button" variant="outline" className="w-full mt-1 gap-2 text-xs h-9 border-dashed"
              onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-3.5 w-3.5" />
              Attach files (images, PDFs, Word, Excel — 20MB max)
            </Button>
            {attachments.length > 0 && (
              <div className="space-y-1 mt-2">
                {attachments.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-muted rounded px-2 py-1.5 text-xs">
                    <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-muted-foreground text-[10px]">{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeAttachment(idx)} className="hover:bg-background rounded p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Labels</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {ALL_LABELS.map((label) => (
                <button key={label} onClick={() => toggleLabel(label)} type="button"
                  className={`text-[10px] font-medium px-2 py-1 rounded border transition-all ${
                    selectedLabels.includes(label) ? LABEL_COLORS[label] : "bg-muted/30 text-muted-foreground border-border/50 opacity-60 hover:opacity-80"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 pb-6 pt-4 border-t border-border">
          <Button variant="ghost" onClick={() => { onClose(); resetForm(); }} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Create ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
