import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityEvent {
  id: string;
  user_id: string;
  profile_id: string | null;
  event_type: string;
  value: number | null;
  unit: string | null;
  metadata: Record<string, any> | null;
  occurred_at: string;
  created_at: string;
}

interface ActivitySummary {
  totalEvents: number;
  uniqueDays: number;
  recentEvents: number;
  eventCounts: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
  activityBreakdown: Record<string, number>;
}

interface TimelinePoint {
  date: string;
  count: number;
}

interface CreateActivityEvent {
  event_type: string;
  value?: number | null;
  unit?: string | null;
  metadata?: Record<string, any> | null;
  occurred_at?: string | null;
  profile_id?: string | null;
}

const db = supabase as any;

/**
 * Get user's activity events
 */
export function useActivityEvents() {
  return useQuery({
    queryKey: ['activity-events'],
    queryFn: async (): Promise<ActivityEvent[]> => {
      const { data, error } = await db
        .from('activity_events')
        .select('*')
        .order('occurred_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return (data ?? []) as ActivityEvent[];
    },
  });
}

/**
 * Get activity summary statistics
 */
export function useActivitySummary() {
  return useQuery({
    queryKey: ['activity-summary'],
    queryFn: async (): Promise<ActivitySummary> => {
      const response = await fetch('/api/activity/summary', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response.json();
    },
  });
}

/**
 * Get activity timeline for charting
 */
export function useActivityTimeline(days: number = 90) {
  return useQuery({
    queryKey: ['activity-timeline', days],
    queryFn: async (): Promise<TimelinePoint[]> => {
      const response = await fetch(`/api/activity/timeline?days=${days}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.timeline as TimelinePoint[];
    },
  });
}

/**
 * Create a new activity event via server API
 */
export function useCreateActivityEvent() {
  return useMutation({
    mutationFn: async (event: CreateActivityEvent) => {
      const response = await fetch('/api/activity', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create activity');
      }

      return response.json();
    },
  });
}

/**
 * Create a new activity event directly via Supabase
 */
export function useCreateActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: CreateActivityEvent) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('You must be signed in to create activity');
      }

      const { data, error } = await db
        .from('activity_events')
        .insert({
          user_id: userData.user.id,
          profile_id: event.profile_id ?? null,
          event_type: event.event_type,
          value: event.value ?? null,
          unit: event.unit ?? null,
          metadata: event.metadata ?? {},
          occurred_at: event.occurred_at ?? new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data as ActivityEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-events'] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
      queryClient.invalidateQueries({ queryKey: ['activity-timeline'] });
    },
  });
}

/**
 * Delete an activity event
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('activity_events')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-events'] });
      queryClient.invalidateQueries({ queryKey: ['activity-summary'] });
      queryClient.invalidateQueries({ queryKey: ['activity-timeline'] });
    },
  });
}

/**
 * Sync activity from a connected profile
 */
export function useSyncActivity() {
  return useMutation({
    mutationFn: async ({ profileId, since }: { profileId: string; since?: string }) => {
      // This would call a server function to sync activity from a connected profile
      // For now, we'll just return success
      return { success: true };
    },
  });
}
