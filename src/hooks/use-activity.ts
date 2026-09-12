/**
 * Activity hooks.
 *
 * All activity operations go through the APIVue backend
 * (`/api/activity/*`), which enforces authentication and ownership.
 * The frontend never writes directly to the `activity_events` table —
 * that would create two conflicting sources of truth and bypass
 * backend validation.
 *
 * The backend must accept Supabase bearer tokens (or cookies) for
 * every route.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/* ============================================================
 * Types
 * ============================================================ */

export interface ActivityEvent {
  id: string;
  user_id: string;
  profile_id: string | null;
  event_type: string;
  value: number | null;
  unit: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  created_at: string;
}

export interface ActivitySummary {
  totalEvents: number;
  uniqueDays: number;
  recentEvents: number;
  eventCounts: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
  activityBreakdown: Record<string, number>;
}

export interface TimelinePoint {
  date: string;
  count: number;
}

export interface CreateActivityEventInput {
  event_type: string;
  value?: number | null;
  unit?: string | null;
  metadata?: Record<string, unknown> | null;
  occurred_at?: string | null;
  profile_id?: string | null;
}

/* ============================================================
 * Query keys
 * ============================================================ */

export const activityEventsKey = ['activity-events'] as const;
export const activitySummaryKey = ['activity-summary'] as const;
export const activityTimelineKey = (days: number) =>
  ['activity-timeline', days] as const;

/* ============================================================
 * Internal API helper
 *
 * NOTE: This duplicates a small amount of logic from
 * `@/lib/integrations/api.ts` because that module does not currently
 * export its low-level `request` helper. If the request helper is
 * eventually exported, this can be replaced with a single import.
 * ============================================================ */

const API_BASE = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8787'
).replace(/\/+$/, '');

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const body = (await response.json()) as
        | { error?: string; message?: string }
        | undefined;
      if (body?.error) message = body.error;
      else if (body?.message) message = body.message;
    } catch {
      // Response body was not JSON — keep the default message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/* ============================================================
 * Queries
 * ============================================================ */

/** Fetches the user's activity events, newest first. */
export function useActivityEvents() {
  return useQuery({
    queryKey: activityEventsKey,
    queryFn: () => apiFetch<ActivityEvent[]>('/api/activity'),
  });
}

/** Fetches aggregate activity statistics. */
export function useActivitySummary() {
  return useQuery({
    queryKey: activitySummaryKey,
    queryFn: () => apiFetch<ActivitySummary>('/api/activity/summary'),
  });
}

/** Fetches a daily activity timeline for charting. */
export function useActivityTimeline(days = 90) {
  return useQuery({
    queryKey: activityTimelineKey(days),
    queryFn: () =>
      apiFetch<{ timeline: TimelinePoint[] }>(
        `/api/activity/timeline?days=${days}`,
      ).then((data) => data.timeline),
  });
}

/* ============================================================
 * Mutations
 * ============================================================ */

/**
 * Creates a new activity event.
 * Invalidates events, summary, and every timeline query on success.
 */
export function useCreateActivityEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (event: CreateActivityEventInput) =>
      apiFetch<ActivityEvent>('/api/activity', {
        method: 'POST',
        body: JSON.stringify(event),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityEventsKey });
      queryClient.invalidateQueries({ queryKey: activitySummaryKey });
      queryClient.invalidateQueries({
        queryKey: ['activity-timeline'],
        exact: false,
      });
    },
  });
}

/** Deletes an activity event by id. */
export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/activity/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityEventsKey });
      queryClient.invalidateQueries({ queryKey: activitySummaryKey });
      queryClient.invalidateQueries({
        queryKey: ['activity-timeline'],
        exact: false,
      });
    },
  });
}