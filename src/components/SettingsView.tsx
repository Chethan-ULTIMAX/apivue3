import { useEffect, useMemo, useState } from "react";
import { MemberAvatar } from "./TicketBadges";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, UserPlus, ShieldCheck } from "lucide-react";
import { PLATFORM_ROLE_LABELS, PLATFORM_ROLES, PlatformRole, TeamMember } from "@/lib/types";
import { actionPermissionRows, pageAccessMap, pageLabels, roleDescriptions } from "@/lib/permissions";
import { usePermissions } from "@/hooks/use-permissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Workspace = { id: string };
type TeamMemberRow = {
  id: string;
  name: string;
  avatar: string;
  email: string | null;
  job_title: string | null;
  available_days: number;
};
type UserRoleRow = { team_member_id: string | null; role: PlatformRole };
type EditableMember = TeamMember & { workspaceId?: string };

const rolePriority: Record<PlatformRole, number> = {
  admin: 5,
  product_owner: 4,
  developer: 3,
  qa_tester: 2,
  viewer: 1,
};

function initialsFor(name: string) {
  return name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "TM";
}

function highestRole(roles: PlatformRole[]): PlatformRole {
  return [...roles].sort((a, b) => rolePriority[b] - rolePriority[a])[0] || "viewer";
}

export function SettingsView() {
  const permissions = usePermissions();
  const canManageMembers = permissions.can("manage_members");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingMember, setEditingMember] = useState<EditableMember | null>(null);
  const [needsAdmin, setNeedsAdmin] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newPlatformRole, setNewPlatformRole] = useState<PlatformRole>("developer");
  const [newDays, setNewDays] = useState(10);
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  const loadMembers = useMemo(() => async () => {
    setMembersLoading(true);
    try {
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", "default")
        .single<Workspace>();

      if (workspaceError || !workspace) throw workspaceError || new Error("Workspace not found");
      setWorkspaceId(workspace.id);

      const { data: memberRows, error: membersError } = await supabase
        .from("team_members")
        .select("id,name,avatar,email,job_title,available_days")
        .eq("workspace_id", workspace.id)
        .eq("is_active", true)
        .order("name", { ascending: true })
        .returns<TeamMemberRow[]>();

      if (membersError) throw membersError;

      const memberIds = (memberRows || []).map((member) => member.id);
      const { data: roleRows, error: rolesError } = memberIds.length
        ? await supabase
            .from("user_roles")
            .select("team_member_id,role")
            .eq("workspace_id", workspace.id)
            .in("team_member_id", memberIds)
            .returns<UserRoleRow[]>()
        : { data: [], error: null };

      if (rolesError) throw rolesError;

      const rolesByMember = (roleRows || []).reduce<Record<string, PlatformRole[]>>((acc, row) => {
        if (!row.team_member_id) return acc;
        acc[row.team_member_id] = [...(acc[row.team_member_id] || []), row.role];
        return acc;
      }, {});

      setMembers((memberRows || []).map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email || undefined,
        avatar: member.avatar,
        role: member.job_title || undefined,
        platformRole: highestRole(rolesByMember[member.id] || []),
        availableDays: member.available_days,
      })));
    } catch (error) {
      console.error("Failed to load team members", error);
      toast.error("Unable to load team members");
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const checkAdminNeeded = useMemo(() => async () => {
    try {
      const { data, error } = await (supabase as any).rpc("default_workspace_needs_admin");
      if (error) throw error;
      setNeedsAdmin(Boolean(data));
    } catch (error) {
      console.error("Failed to check workspace admin", error);
      setNeedsAdmin(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
    checkAdminNeeded();
  }, [loadMembers, checkAdminNeeded]);

  const handleClaimAdmin = async () => {
    setClaiming(true);
    try {
      const { error } = await (supabase as any).rpc("claim_workspace_admin", { _display_name: null });
      if (error) throw error;
      toast.success("You are now the workspace admin");
      window.location.reload();
    } catch (error) {
      console.error("Failed to claim admin", error);
      toast.error(error instanceof Error ? error.message : "Unable to claim admin");
      setClaiming(false);
      checkAdminNeeded();
    }
  };


  const validateAdd = (): boolean => {
    const errs: Record<string, string> = {};
    if (!newName.trim()) errs.name = "Name is required";
    else if (newName.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (newEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) errs.email = "Enter a valid email";
    if (newDays < 1 || newDays > 14 || !Number.isInteger(newDays)) errs.days = "Must be 1-14";
    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddMember = async () => {
    if (!validateAdd() || !canManageMembers || !workspaceId) return;
    const name = newName.trim();
    const email = newEmail.trim().toLowerCase();
    const avatar = initialsFor(name);

    try {
      const { data: member, error: memberError } = await supabase
        .from("team_members")
        .insert({
          workspace_id: workspaceId,
          name,
          email: email || null,
          avatar,
          job_title: newRole.trim() || "Engineer",
          available_days: newDays,
        })
        .select("id")
        .single<{ id: string }>();

      if (memberError || !member) throw memberError || new Error("Member was not created");

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ workspace_id: workspaceId, team_member_id: member.id, role: newPlatformRole });

      if (roleError) throw roleError;

      toast.success(`${name} added to the team`);
      setNewName(""); setNewEmail(""); setNewRole(""); setNewPlatformRole("developer"); setNewDays(10); setAddErrors({});
      setShowAdd(false);
      loadMembers();
    } catch (error) {
      console.error("Failed to add team member", error);
      toast.error("Unable to add team member");
    }
  };

  const handleEditSave = async () => {
    if (!editingMember || !editingMember.name.trim() || !canManageMembers || !workspaceId) return;

    try {
      const { error: memberError } = await supabase
        .from("team_members")
        .update({
          name: editingMember.name.trim(),
          email: editingMember.email?.trim().toLowerCase() || null,
          job_title: editingMember.role || null,
          available_days: editingMember.availableDays || 10,
          avatar: initialsFor(editingMember.name),
        })
        .eq("id", editingMember.id)
        .eq("workspace_id", workspaceId);

      if (memberError) throw memberError;

      const { error: deleteRoleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("team_member_id", editingMember.id);

      if (deleteRoleError) throw deleteRoleError;

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ workspace_id: workspaceId, team_member_id: editingMember.id, role: editingMember.platformRole || "developer" });

      if (roleError) throw roleError;

      toast.success("Team member updated");
      setEditingMember(null);
      loadMembers();
    } catch (error) {
      console.error("Failed to update team member", error);
      toast.error("Unable to update team member");
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!canManageMembers || !workspaceId) return;

    try {
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("team_member_id", member.id);

      if (roleError) throw roleError;

      const { error: memberError } = await supabase
        .from("team_members")
        .delete()
        .eq("id", member.id)
        .eq("workspace_id", workspaceId);

      if (memberError) throw memberError;

      toast.success(`${member.name} removed from team`);
      loadMembers();
    } catch (error) {
      console.error("Failed to remove team member", error);
      toast.error("Unable to remove team member");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage team members and review the long-term role permission model.</p>
      </div>

      {needsAdmin && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="text-sm font-semibold">No admin assigned yet</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  This workspace has no admin. Assign yourself as admin to get full control — you can then invite teammates and set their roles. Only the first person can claim it.
                </p>
              </div>
            </div>
            <Button size="sm" className="h-8 shrink-0 text-xs" disabled={claiming} onClick={handleClaimAdmin}>
              {claiming ? "Assigning…" : "Make me admin"}
            </Button>
          </div>
        </div>
      )}



      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2 className="text-sm font-semibold">Team members</h2>
            <p className="text-xs text-muted-foreground mt-1">Platform roles are loaded from the backend role assignments.</p>
          </div>
          {canManageMembers && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowAdd(true)}>
              <UserPlus className="h-3.5 w-3.5" /> Add member
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {membersLoading ? (
            <div className="py-6 text-sm text-muted-foreground">Loading team members…</div>
          ) : members.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">No team members found.</div>
          ) : members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0 group">
              <MemberAvatar name={m.name} avatar={m.avatar} size="md" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm block">{m.name}</span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {PLATFORM_ROLE_LABELS[m.platformRole || "viewer"]}{m.role ? ` · ${m.role}` : ""}{m.email ? ` · ${m.email}` : ""}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{m.availableDays} days/sprint</span>
              {canManageMembers && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingMember({ ...m })} aria-label={`Edit ${m.name}`}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemoveMember(m)} aria-label={`Remove ${m.name}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Role descriptions</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {PLATFORM_ROLES.map((role) => (
            <div key={role} className="rounded-lg border border-border bg-muted/20 p-3">
              <h3 className="text-xs font-semibold">{PLATFORM_ROLE_LABELS[role]}</h3>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{roleDescriptions[role]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 overflow-hidden">
        <h2 className="text-sm font-semibold mb-1">Page access map</h2>
        <p className="text-xs text-muted-foreground mb-4">This shows which pages each role can access and whether that access is full, limited, view-only, or blocked.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-3 text-left font-medium">Page</th>
                {PLATFORM_ROLES.map((role) => <th key={role} className="px-3 py-2 text-left font-medium">{PLATFORM_ROLE_LABELS[role]}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.entries(pageAccessMap).map(([page, access]) => (
                <tr key={page} className="border-b border-border/70 last:border-0">
                  <td className="py-2 pr-3 font-medium">{pageLabels[page as keyof typeof pageLabels]}</td>
                  {PLATFORM_ROLES.map((role) => (
                    <td key={role} className="px-3 py-2 text-muted-foreground">{access[role]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 overflow-hidden">
        <h2 className="text-sm font-semibold mb-1">Action permission map</h2>
        <p className="text-xs text-muted-foreground mb-4">This is the long-term role-level permission guide for edits, deletes, sprint changes, UAT, comments, and member management.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="w-64 py-2 pr-3 text-left font-medium">Action</th>
                {PLATFORM_ROLES.map((role) => <th key={role} className="px-3 py-2 text-left font-medium">{PLATFORM_ROLE_LABELS[role]}</th>)}
              </tr>
            </thead>
            <tbody>
              {actionPermissionRows.map((row) => (
                <tr key={row.action} className="border-b border-border/70 last:border-0">
                  <td className="py-2 pr-3 font-medium">{row.action}</td>
                  {PLATFORM_ROLES.map((role) => (
                    <td key={role} className="px-3 py-2 text-muted-foreground">{row.permissions[role]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-sm font-semibold mb-4">Sprint configuration</h2>
        <div className="space-y-4 max-w-2xl">
          <div>
            <Label className="text-xs text-muted-foreground">Sprint duration</Label>
            <Select defaultValue="2">
              <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 week</SelectItem><SelectItem value="2">2 weeks</SelectItem><SelectItem value="3">3 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Story point scale</Label>
            <Select defaultValue="fibonacci">
              <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fibonacci">Fibonacci (1, 2, 3, 5, 8, 13)</SelectItem>
                <SelectItem value="linear">Linear (1, 2, 3, 4, 5)</SelectItem>
                <SelectItem value="tshirt">T-shirt (XS, S, M, L, XL)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm bg-card border-border" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Name *</Label>
              <Input value={newName} onChange={(e) => { setNewName(e.target.value); if (addErrors.name) setAddErrors((p) => ({ ...p, name: "" })); }}
                placeholder="Full name" className={`mt-1 bg-muted border-border ${addErrors.name ? "border-destructive" : ""}`} autoFocus />
              {addErrors.name && <p className="text-[11px] text-destructive mt-1">{addErrors.name}</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input value={newEmail} onChange={(e) => { setNewEmail(e.target.value); if (addErrors.email) setAddErrors((p) => ({ ...p, email: "" })); }} placeholder="name@company.com" className={`mt-1 bg-muted border-border ${addErrors.email ? "border-destructive" : ""}`} />
              {addErrors.email && <p className="text-[11px] text-destructive mt-1">{addErrors.email}</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Input value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="e.g. Frontend lead" className="mt-1 bg-muted border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Platform role</Label>
              <Select value={newPlatformRole} onValueChange={(value) => setNewPlatformRole(value as PlatformRole)}>
                <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>{PLATFORM_ROLE_LABELS[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Available days/sprint *</Label>
              <Input type="number" value={newDays} onChange={(e) => setNewDays(Number(e.target.value))}
                className={`mt-1 bg-muted border-border ${addErrors.days ? "border-destructive" : ""}`} min={1} max={14} />
              {addErrors.days && <p className="text-[11px] text-destructive mt-1">{addErrors.days}</p>}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddMember}>Add member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="max-w-sm bg-card border-border" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Edit team member</DialogTitle></DialogHeader>
          {editingMember && (
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input value={editingMember.name} onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })} className="mt-1 bg-muted border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input value={editingMember.email || ""} onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })} className="mt-1 bg-muted border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Input value={editingMember.role || ""} onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })} className="mt-1 bg-muted border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Platform role</Label>
                <Select value={editingMember.platformRole || "developer"} onValueChange={(value) => setEditingMember({ ...editingMember, platformRole: value as PlatformRole })}>
                  <SelectTrigger className="mt-1 bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORM_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>{PLATFORM_ROLE_LABELS[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Available days/sprint</Label>
                <Input type="number" value={editingMember.availableDays || 10} onChange={(e) => setEditingMember({ ...editingMember, availableDays: Number(e.target.value) })} className="mt-1 bg-muted border-border" min={1} max={14} />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setEditingMember(null)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
