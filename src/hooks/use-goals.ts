import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  status: "active" | "completed" | "paused" | "cancelled";
  created_at: string;
}

const goalsKey = ["goals"];

export function useGoals() {
  return useQuery({
    queryKey: goalsKey,
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("status", { ascending: true })
        .order("target_date", { ascending: true, nullsFirst: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Goal[];
    },
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goal: {
      title: string;
      description?: string;
      category?: string;
      target_value?: number | null;
      unit?: string;
      target_date?: string;
    }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("You must be signed in to create a goal.");
      const { data, error } = await supabase
        .from("goals")
        .insert({ ...goal, user_id: userData.user.id })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data as Goal;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsKey }),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; current_value?: number; status?: Goal["status"] }) => {
      const { error } = await supabase.from("goals").update(updates).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsKey }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: goalsKey }),
  });
}
