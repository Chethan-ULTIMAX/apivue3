import { useEffect, useRef, useState } from "react";
import { Ticket, Comment, ALL_LABELS, LABEL_COLORS, TicketLabel, COLUMNS } from "@/lib/types";
import { useStore } from "@/lib/store";
import { TypeIcon, PriorityBadge, MemberAvatar, PointsBadge } from "./TicketBadges";
import { MessageSquare, CheckCircle2, Circle, Clock, Send, Tag, X, Trash2, Paperclip, FileText, Download, Image as ImageIcon, Upload, Link2, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_FILE_SIZE = 20 * 1024 * 1024;


interface Props {
  ticket: Ticket;
  onClose: () => void;
}

const STORY_POINTS = [1, 2, 3, 5, 8, 13];
const COMMENTS_PER_PAGE = 5;

export function TicketDetailPanel({ ticket: initialTicket, onClose }: Props) {
  const members = useStore((s) => s.members);
  const epics = useStore((s) => s.epics);
  const sprints = useStore((s) => s.sprints);
  const tickets = useStore((s) => s.tickets);
  const currentMemberId = useStore((s) => s.currentMemberId);
  const workspaceId = useStore((s) => s.workspaceId);
  const updateTicket = useStore((s) => s.updateTicket);
  const deleteTicket = useStore((s) => s.deleteTicket);
  const addComment = useStore((s) => s.addComment);
  const toggleSubtask = useStore((s) => s.toggleSubtask);
  const toggleLabel = useStore((s) => s.toggleLabel);
  const permissions = usePermissions();
  const canEditTicket = permissions.can("edit_ticket");
  const canDeleteTicket = permissions.can("delete_ticket");
  const canComment = permissions.can("comment_ticket");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const ticket = tickets.find((t) => t.id === initialTicket.id) || initialTicket;
  const currentMember = members.find((m) => m.id === currentMemberId);
  const assignee = members.find((m) => m.id === ticket.assigneeId);
  const epic = epics.find((e) => e.id === ticket.epicId);
  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(ticket.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(ticket.description);
  const [editingAC, setEditingAC] = useState(false);
  const [acDraft, setACDraft] = useState(ticket.acceptanceCriteria || "");
  const [attachments, setAttachments] = useState<Array<{ id: string; file_name: string; file_path: string; content_type: string | null; file_size: number; url: string | null }>>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);
  const [relatedPicker, setRelatedPicker] = useState<string>("");

  const loadAttachments = async () => {
    const db: any = supabase;
    const { data, error } = await db.from("ticket_attachments")
      .select("id,file_name,file_path,content_type,file_size")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });
    if (error || !data) return;
    const withUrls = await Promise.all((data as any[]).map(async (a) => {
      const { data: signed } = await supabase.storage.from("ticket-attachments").createSignedUrl(a.file_path, 3600);
      return { ...a, url: signed?.signedUrl ?? null };
    }));
    setAttachments(withUrls);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadAttachments();
      const db: any = supabase;
      const { data } = await db.from("ticket_relations")
        .select("related_ticket_id")
        .eq("ticket_id", ticket.id);
      if (!cancelled && data) setRelatedIds((data as any[]).map((r) => r.related_ticket_id));
    })();
    return () => { cancelled = true; };
  }, [ticket.id]);

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!workspaceId) { toast.error("Workspace not loaded"); return; }
    setUploading(true);
    try {
      const db: any = supabase;
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) { toast.error(`${file.name} exceeds 20MB`); continue; }
        const path = `${workspaceId}/${ticket.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("ticket-attachments").upload(path, file, { contentType: file.type });
        if (upErr) { toast.error(`Upload failed: ${file.name}`); continue; }
        const { error: metaErr } = await db.from("ticket_attachments").insert({
          workspace_id: workspaceId, ticket_id: ticket.id,
          file_name: file.name, file_path: path, file_size: file.size, content_type: file.type || null,
        });
        if (metaErr) toast.error(`Failed to save ${file.name}`);
      }
      await loadAttachments();
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Attachments uploaded");
    } finally {
      setUploading(false);
    }
  };

  const addRelated = async (id: string) => {
    if (!id || relatedIds.includes(id) || id === ticket.id || !workspaceId) return;
    const db: any = supabase;
    const { error } = await db.from("ticket_relations").insert({
      workspace_id: workspaceId, ticket_id: ticket.id, related_ticket_id: id,
    });
    if (error) { toast.error("Failed to link ticket"); return; }
    setRelatedIds((prev) => [...prev, id]);
    setRelatedPicker("");
  };

  const removeRelated = async (id: string) => {
    const db: any = supabase;
    const { error } = await db.from("ticket_relations")
      .delete().eq("ticket_id", ticket.id).eq("related_ticket_id", id);
    if (error) { toast.error("Failed to unlink"); return; }
    setRelatedIds((prev) => prev.filter((r) => r !== id));
  };

  const availableRelated = tickets.filter((t) => t.id !== ticket.id && !relatedIds.includes(t.id));


  const handleAddComment = () => {
    if (!commentText.trim() || !canComment) return;
    if (!currentMemberId) {
      toast.error("Your team profile isn't loaded yet — try again in a moment.");
      return;
    }
    const comment: Comment = { id: crypto.randomUUID(), authorId: currentMemberId, content: commentText.trim(), createdAt: new Date().toISOString() };
    addComment(ticket.id, comment);
    setCommentText("");
  };


  const handleStatusChange = (status: string) => {
    updateTicket(ticket.id, { status: status as Ticket["status"], completedAt: status === "done" ? new Date().toISOString() : (null as unknown as string) });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    updateTicket(ticket.id, { assigneeId: assigneeId === "unassigned" ? null : assigneeId });
  };

  const handlePriorityChange = (priority: string) => {
    updateTicket(ticket.id, { priority: priority as Ticket["priority"] });
  };

  const handleTypeChange = (type: string) => {
    updateTicket(ticket.id, { type: type as Ticket["type"] });
  };

  const handleEpicChange = (epicId: string) => {
    updateTicket(ticket.id, { epicId });
  };

  const handlePointsChange = (points: string) => {
    updateTicket(ticket.id, { storyPoints: Number(points) });
  };

  const handleSprintChange = (sprintId: string) => {
    updateTicket(ticket.id, { sprintId: sprintId === "none" ? null : sprintId });
  };

  const saveTitle = () => {
    if (titleDraft.trim() && titleDraft !== ticket.title) {
      updateTicket(ticket.id, { title: titleDraft.trim() });
    }
    setEditingTitle(false);
  };

  const saveDesc = () => {
    if (descDraft !== ticket.description) {
      updateTicket(ticket.id, { description: descDraft });
    }
    setEditingDesc(false);
  };

  const saveAC = () => {
    if (acDraft !== (ticket.acceptanceCriteria || "")) {
      updateTicket(ticket.id, { acceptanceCriteria: acDraft || undefined });
    }
    setEditingAC(false);
  };

  const completedSubtasks = ticket.subtasks.filter((s) => s.completed).length;
  const visibleComments = showAllComments ? ticket.comments : ticket.comments.slice(-COMMENTS_PER_PAGE);
  const hasMoreComments = ticket.comments.length > COMMENTS_PER_PAGE && !showAllComments;

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:!max-w-[50vw] sm:w-[50vw] p-0 bg-card border-border overflow-hidden flex flex-col">
        <SheetHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <TypeIcon type={ticket.type} className="h-5 w-5" />
            <span className="font-mono-id text-sm text-muted-foreground">{ticket.ticketId}</span>
            <PriorityBadge priority={ticket.priority} />
          </div>
          {editingTitle ? (
            <Input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") { setTitleDraft(ticket.title); setEditingTitle(false); } }}
              className="text-lg font-semibold mt-2 bg-muted border-border"
              autoFocus
            />
          ) : (
            <SheetTitle className={`text-lg mt-2 ${canEditTicket ? "cursor-pointer hover:text-primary transition-colors" : ""}`} onClick={() => { if (!canEditTicket) return; setTitleDraft(ticket.title); setEditingTitle(true); }}>
              {ticket.title}
            </SheetTitle>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-5">
            {/* Fields grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">Status</label>
                <Select value={ticket.status} onValueChange={handleStatusChange} disabled={!permissions.can("move_ticket")}>
                  <SelectTrigger className="bg-muted/30 border-border text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((col) => <SelectItem key={col.key} value={col.key}>{col.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">Assignee</label>
                <Select value={ticket.assigneeId || "unassigned"} onValueChange={handleAssigneeChange} disabled={!permissions.can("assign_ticket")}>
                  <SelectTrigger className="bg-muted/30 border-border text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">Priority</label>
                <Select value={ticket.priority} onValueChange={handlePriorityChange} disabled={!canEditTicket}>
                  <SelectTrigger className="bg-muted/30 border-border text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P0">P0 — Critical</SelectItem>
                    <SelectItem value="P1">P1 — High</SelectItem>
                    <SelectItem value="P2">P2 — Medium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">Type</label>
                <Select value={ticket.type} onValueChange={handleTypeChange} disabled={!canEditTicket}>
                  <SelectTrigger className="bg-muted/30 border-border text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">Epic</label>
                <Select value={ticket.epicId} onValueChange={handleEpicChange} disabled={!canEditTicket}>
                  <SelectTrigger className="bg-muted/30 border-border text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {epics.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">Story points</label>
                <Select value={String(ticket.storyPoints)} onValueChange={handlePointsChange} disabled={!canEditTicket}>
                  <SelectTrigger className="bg-muted/30 border-border text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STORY_POINTS.map((p) => <SelectItem key={p} value={String(p)}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">Sprint</label>
                <Select value={ticket.sprintId || "none"} onValueChange={handleSprintChange} disabled={!permissions.can("move_ticket_to_sprint")}>
                  <SelectTrigger className="bg-muted/30 border-border text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No sprint</SelectItem>
                    {sprints.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Created {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              {ticket.completedAt && <span className="text-success">Completed {new Date(ticket.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
            </div>

            <Separator className="bg-border" />

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Description</h3>
              {editingDesc ? (
                <div className="space-y-2">
                  <Textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)} className="min-h-[100px] bg-muted border-border text-sm resize-none" autoFocus />
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={saveDesc}>Save</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setDescDraft(ticket.description); setEditingDesc(false); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed whitespace-pre-wrap rounded p-2 -mx-2 ${canEditTicket ? "cursor-pointer hover:bg-muted/30 transition-colors" : ""}`} onClick={() => { if (!canEditTicket) return; setDescDraft(ticket.description); setEditingDesc(true); }}>
                  {ticket.description || "Click to add description..."}
                </p>
              )}
            </div>

            {/* Acceptance criteria */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Acceptance criteria</h3>
              {editingAC ? (
                <div className="space-y-2">
                  <Textarea value={acDraft} onChange={(e) => setACDraft(e.target.value)} className="min-h-[100px] bg-muted border-border text-sm resize-none" autoFocus />
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={saveAC}>Save</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setACDraft(ticket.acceptanceCriteria || ""); setEditingAC(false); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed whitespace-pre-wrap rounded p-2 -mx-2 ${canEditTicket ? "cursor-pointer hover:bg-muted/30 transition-colors" : ""}`} onClick={() => { if (!canEditTicket) return; setACDraft(ticket.acceptanceCriteria || ""); setEditingAC(true); }}>
                  {ticket.acceptanceCriteria || "Click to add acceptance criteria..."}
                </p>
              )}
            </div>

            {/* Labels */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" /> Labels
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ALL_LABELS.map((label) => (
                  <button
                    key={label}
                    onClick={() => { if (canEditTicket) toggleLabel(ticket.id, label); }}
                    disabled={!canEditTicket}
                    className={`text-[10px] font-medium px-2 py-1 rounded border transition-all ${
                      ticket.labels.includes(label)
                        ? LABEL_COLORS[label]
                        : "bg-muted/30 text-muted-foreground border-border/50 opacity-50 hover:opacity-75"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtasks */}
            {ticket.subtasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2">
                  Subtasks
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{completedSubtasks}/{ticket.subtasks.length}</span>
                </h3>
                {ticket.subtasks.length > 1 && (
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-success rounded-full transition-all" style={{ width: `${(completedSubtasks / ticket.subtasks.length) * 100}%` }} />
                  </div>
                )}
                <div className="space-y-1">
                  {ticket.subtasks.map((st) => (
                    <button key={st.id} className="flex items-center gap-2.5 text-sm w-full text-left py-1.5 px-2 rounded hover:bg-muted/50 transition-colors disabled:cursor-default disabled:hover:bg-transparent" disabled={!canEditTicket} onClick={() => toggleSubtask(ticket.id, st.id)}>
                      {st.completed ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <span className={st.completed ? "line-through text-muted-foreground" : ""}>{st.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator className="bg-border" />

            {/* Attachments */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2">
                <Paperclip className="h-4 w-4" /> Attachments
                {attachments.length > 0 && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{attachments.length}</span>}
              </h3>
              {attachments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic mb-3">No attachments</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {attachments.map((a) => {
                    const isImage = (a.content_type || "").startsWith("image/");
                    return (
                      <a key={a.id} href={a.url || "#"} target="_blank" rel="noreferrer"
                        className="group border border-border rounded-md overflow-hidden bg-muted/30 hover:border-primary/50 transition-colors flex flex-col">
                        <div className="h-24 flex items-center justify-center bg-muted/50 overflow-hidden">
                          {isImage && a.url ? (
                            <img src={a.url} alt={a.file_name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="p-2 flex items-center gap-1.5 min-w-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate" title={a.file_name}>{a.file_name}</p>
                            <p className="text-[10px] text-muted-foreground">{(a.file_size / 1024).toFixed(1)} KB</p>
                          </div>
                          <Download className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
              {canEditTicket && (
                <>
                  <input ref={fileInputRef} type="file" multiple className="hidden"
                    onChange={(e) => handleUploadFiles(e.target.files)} />
                  <Button type="button" variant="outline" size="sm" className="w-full gap-2 text-xs h-8 border-dashed"
                    disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploading ? "Uploading..." : "Add attachment"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-1">Max 20MB per file</p>
                </>
              )}
            </div>

            <Separator className="bg-border" />

            {/* Related tickets */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2">
                <Link2 className="h-4 w-4" /> Related stories
                {relatedIds.length > 0 && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{relatedIds.length}</span>}
              </h3>
              {relatedIds.length === 0 ? (
                <p className="text-xs text-muted-foreground italic mb-3">No related stories</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {relatedIds.map((rid) => {
                    const t = tickets.find((x) => x.id === rid);
                    if (!t) return null;
                    return (
                      <Badge key={rid} variant="secondary" className="gap-1.5 pr-1">
                        <Link2 className="h-3 w-3" />
                        <span className="font-mono text-[10px]">{t.ticketId}</span>
                        <span className="truncate max-w-[180px]">{t.title}</span>
                        {canEditTicket && (
                          <button type="button" onClick={() => removeRelated(rid)} className="hover:bg-muted rounded p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    );
                  })}
                </div>
              )}
              {canEditTicket && (
                <Select value={relatedPicker} onValueChange={addRelated}>
                  <SelectTrigger className="bg-muted/30 border-border text-xs h-8">
                    <SelectValue placeholder={availableRelated.length ? "Link a related story..." : "No other stories available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRelated.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="font-mono text-[11px] mr-2">{t.ticketId}</span>{t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Separator className="bg-border" />





            {/* Comments */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Comments
                {ticket.comments.length > 0 && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{ticket.comments.length}</span>}
              </h3>
              {hasMoreComments && (
                <button onClick={() => setShowAllComments(true)} className="text-xs text-primary hover:underline mb-3 block">
                  Show {ticket.comments.length - COMMENTS_PER_PAGE} older comments...
                </button>
              )}
              <div className="space-y-3 mb-4">
                {visibleComments.map((comment) => {
                  const author = members.find((m) => m.id === comment.authorId);
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <MemberAvatar name={author?.name || "Unknown"} avatar={author?.avatar || "??"} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium">{author?.name || "Unknown"}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
                {ticket.comments.length === 0 && <p className="text-xs text-muted-foreground italic">No comments yet</p>}
              </div>
              <div className="flex gap-2">
                <Textarea placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] bg-muted border-border text-sm resize-none"
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment(); }}
                  disabled={!canComment}
                />
                <Button size="icon" className="shrink-0 h-10 w-10" onClick={handleAddComment} disabled={!commentText.trim() || !canComment}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Activity */}
            <div>
              <h3 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Activity</h3>
              <div className="space-y-2">
                {ticket.activity.map((entry) => {
                  const actor = members.find((m) => m.id === entry.userId);
                  return (
                    <div key={entry.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                      <span className="font-medium text-foreground/70">{actor?.name || "System"}</span>
                      <span>{entry.action} this ticket</span>
                      <span>·</span>
                      <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
        {canDeleteTicket && (
          <div className="border-t border-border px-6 py-3 shrink-0 bg-card">
            <Button variant="destructive" size="sm" className="w-full" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete story
            </Button>
          </div>
        )}
      </SheetContent>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete story <span className="font-mono">{ticket.ticketId}</span> — "{ticket.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { deleteTicket(ticket.id); setConfirmDelete(false); onClose(); }}
            >
              Delete story
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
