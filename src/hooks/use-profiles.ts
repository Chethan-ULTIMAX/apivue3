import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { NormalizedProfile, ProfileSnapshot, TrackedProfile } from "@/lib/integrations/registry";

const db = supabase as any;

export function useTrackedProfiles() {
  return useQuery({
    queryKey: ["tracked-profiles"],
    queryFn: async (): Promise<TrackedProfile[]> => {
      const { data, error } = await db
        .from("tracked_profiles")
        .select("*")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as TrackedProfile[];
    },
  });
}

export function useProfileSnapshots(profileId?: string) {
  return useQuery({
    queryKey: ["profile-snapshots", profileId ?? "all"],
    queryFn: async (): Promise<ProfileSnapshot[]> => {
      let query = db.from("profile_snapshots").select("*").order("captured_at", { ascending: true });
      if (profileId) query = query.eq("profile_id", profileId);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as ProfileSnapshot[];
    },
  });
}

async function callSync(platform: string, handle: string, save = true) {
  const { data, error } = await supabase.functions.invoke("sync-profile", {
    body: { platform, handle, save },
  });
  if (error) {
    let message = error.message;
    const ctx = (error as any).context;
    if (ctx?.json) {
      try {
        const body = await ctx.json();
        if (typeof body?.error === "string") message = body.error;
      } catch {
        /* keep default message */
      }
    }
    throw new Error(message);
  }
  if ((data as any)?.error) throw new Error(String((data as any).error));
  return data as { profile: TrackedProfile | NormalizedProfile };
}

export function useSyncProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ platform, handle }: { platform: string; handle: string }) => callSync(platform, handle, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracked-profiles"] });
      qc.invalidateQueries({ queryKey: ["profile-snapshots"] });
    },
  });
}

export function usePreviewProfile() {
  return useMutation({
    mutationFn: ({ platform, handle }: { platform: string; handle: string }) => callSync(platform, handle, false),
  });
}

export function useRemoveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("tracked_profiles").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tracked-profiles"] });
      qc.invalidateQueries({ queryKey: ["profile-snapshots"] });
    },
  });
}

export function useTogglePinned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await db.from("tracked_profiles").update({ pinned }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tracked-profiles"] }),
  });
}
