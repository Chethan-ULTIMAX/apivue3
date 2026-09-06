import { createContext, createElement, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PlatformRole } from "@/lib/types";
import { AppPage, can, canAccessPage, PermissionAction } from "@/lib/permissions";

interface PermissionsContextValue {
  role: PlatformRole;
  loading: boolean;
  can: (action: PermissionAction) => boolean;
  canAccessPage: (page: AppPage) => boolean;
}

const defaultPermissions: PermissionsContextValue = {
  role: "viewer",
  loading: false,
  can: (action) => can("viewer", action),
  canAccessPage: (page) => canAccessPage("viewer", page),
};

const PermissionsContext = createContext<PermissionsContextValue>(defaultPermissions);

const rolePriority: Record<PlatformRole, number> = {
  admin: 5,
  product_owner: 4,
  developer: 3,
  qa_tester: 2,
  viewer: 1,
};

function highestRole(roles: PlatformRole[]): PlatformRole {
  return [...roles].sort((a, b) => rolePriority[b] - rolePriority[a])[0] || "viewer";
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [backendRole, setBackendRole] = useState<PlatformRole>("viewer");
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (authLoading) return;

      if (!user?.id) {
        setBackendRole("viewer");
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);

      try {
        await (supabase as any).rpc("claim_invited_memberships");

        const { data: members, error: memberError } = await supabase
          .from("team_members")
          .select("id, workspace_id")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (cancelled) return;

        if (memberError || !members?.length) {
          setBackendRole("viewer");
          setRoleLoading(false);
          return;
        }

        const workspaceId = members[0].workspace_id;

        const { data: roles, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("workspace_id", workspaceId)
          .in("team_member_id", members.map((member) => member.id));

        if (cancelled) return;

        if (roleError) {
          setBackendRole("viewer");
          return;
        }

        setBackendRole(highestRole((roles || []).map((row) => row.role as PlatformRole)));
      } catch {
        if (!cancelled) setBackendRole("viewer");
      } finally {
        if (!cancelled) setRoleLoading(false);
      }
    }

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  const role = useMemo<PlatformRole>(() => backendRole, [backendRole]);
  const canForRole = useCallback((action: PermissionAction) => can(role, action), [role]);
  const canAccessPageForRole = useCallback((page: AppPage) => canAccessPage(role, page), [role]);

  const value = useMemo<PermissionsContextValue>(() => ({
    role,
    loading: authLoading || roleLoading,
    can: canForRole,
    canAccessPage: canAccessPageForRole,
  }), [authLoading, canAccessPageForRole, canForRole, role, roleLoading]);

  return createElement(PermissionsContext.Provider, { value }, children);
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
