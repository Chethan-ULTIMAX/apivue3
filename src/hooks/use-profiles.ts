/**
 * Tracked profiles and snapshots.
 *
 * Reads go directly through Supabase (RLS enforces user isolation).
 * Sync operations go through the `sync-profile` Edge Function, which
 * uses the server-side service role to fetch and normalize public
 * platform data.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  NormalizedProfile,
  ProfileSnapshot,
  TrackedProfile,
} from '@/lib/integrations/registry';

export const trackedProfilesKey = ['tracked-profiles'] as const;
export const profileSnapshotsKey = (profileId?: string) =>
  ['profile-snapshots', profileId ?? 'all'] as const;

export function useTrackedProfiles() {
  return useQuery({
    queryKey: trackedProfilesKey,
    queryFn: async (): Promise<TrackedProfile[]> => {
      const { data, error } = await supabase
        .from('tracked_profiles')
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as TrackedProfile[];
    },
  });
}

export function useProfileSnapshots(profileId?: string) {
  return useQuery({
    queryKey: profileSnapshotsKey(profileId),
    queryFn: async (): Promise<ProfileSnapshot[]> => {
      let query = supabase
        .from('profile_snapshots')
        .select('*')
        .order('captured_at', { ascending: true });
      if (profileId) query = query.eq('profile_id', profileId);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as ProfileSnapshot[];
    },
  });
}

async function callSync(platform: string, handle: string, save = true) {
  const { data, error } = await supabase.functions.invoke('sync-profile', {
    body: { platform, handle, save },
  });

  if (error) {
    let message = error.message;
    const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context;
    if (ctx?.json) {
      try {
        const body = (await ctx.json()) as { error?: string } | undefined;
        if (typeof body?.error === 'string') message = body.error;
      } catch {
        /* keep default message */
      }
    }
    throw new Error(message);
  }

  const payload = data as { error?: string; profile?: TrackedProfile };
  if (payload?.error) throw new Error(String(payload.error));

  return data as { profile: TrackedProfile | NormalizedProfile };
}

export function useSyncProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ platform, handle }: { platform: string; handle: string }) =>
      callSync(platform, handle, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackedProfilesKey });
      queryClient.invalidateQueries({ queryKey: ['profile-snapshots'], exact: false });
    },
  });
}

export function usePreviewProfile() {
  return useMutation({
    mutationFn: ({ platform, handle }: { platform: string; handle: string }) =>
      callSync(platform, handle, false),
  });
}

export function useRemoveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tracked_profiles').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trackedProfilesKey });
      queryClient.invalidateQueries({ queryKey: ['profile-snapshots'], exact: false });
    },
  });
}

export function useTogglePinned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('tracked_profiles')
        .update({ pinned })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: trackedProfilesKey }),
  });
}
