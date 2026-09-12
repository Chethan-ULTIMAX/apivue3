/**
 * Goals hooks.
 *
 * Goals are stored in the `goals` table and protected by RLS.
 * All reads and writes go through the Supabase client, which attaches
 * the user's bearer token automatically.
 *
 * The `Goal` type is exported and consumed by
 * `@/lib/analytics/goals.ts`. Keep its shape stable.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/* ============================================================
 * Types
 * ============================================================ */

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  start_date: string | null;
  target_date: string | null;
  status: GoalStatus;
  created_at: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  category?: string;
  target_value?: number | null;
  unit?: string;
  target_date?: string;
}

export interface UpdateGoalInput {
  id: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  target_value?: number | null;
  current_value?: number;
  unit?: string | null;
  start_date?: string | null;
  target_date?: string | null;
  status?: GoalStatus;
}

/* ============================================================
 * Query keys
 * ============================================================ */

export const goalsKey = ['goals'] as const;

/* ============================================================
 * Queries
 * ============================================================ */

export function useGoals() {
  return useQuery({
    queryKey: goalsKey,
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('status', { ascending: true })
        .order('target_date', { ascending: true, nullsFirst: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Goal[];
    },
  });
}

/* ============================================================
 * Mutations
 * ============================================================ */

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: CreateGoalInput) => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('You must be signed in to create a goal.');
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({ ...goal, user_id: userData.user.id })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data as Goal;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsKey }),
  });
}

/**
 * Updates an existing goal.
 * Accepts a partial update of every editable field (except id/user_id).
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateGoalInput) => {
      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsKey }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsKey }),
  });
}