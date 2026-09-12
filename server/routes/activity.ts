import { Router } from 'express';

import { requireSupabaseUser } from '../middleware/session';
import { supabaseAdmin } from '../supabase';

const router = Router();

/* ============================================================
 * Types
 * ============================================================ */

interface ActivityEvent {
  id: string;
  user_id: string;
  profile_id: string | null;
  event_type: string;
  value: number | null;
  unit: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string | null;
  created_at: string;
}

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;
const MAX_EVENT_TYPE_LENGTH = 100;

/* ============================================================
 * Helpers
 * ============================================================ */

function parsePositiveInteger(
  value: unknown,
  fallback: number,
  maximum: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), maximum);
}

function parseNonNegativeInteger(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function getDateKey(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function dayDifference(olderDate: string, newerDate: string): number {
  const older = Date.parse(`${olderDate}T00:00:00.000Z`);
  const newer = Date.parse(`${newerDate}T00:00:00.000Z`);
  return Math.round((newer - older) / 86_400_000);
}

/**
 * Deterministic streak calculation.
 *
 * Current streak exists only when the most recent active day is
 * today or yesterday (UTC). Otherwise the streak is 0.
 */
function calculateStreaks(events: ActivityEvent[]): {
  currentStreak: number;
  longestStreak: number;
} {
  const dateSet = new Set<string>();
  for (const event of events) {
    const key = getDateKey(event.occurred_at ?? event.created_at);
    if (key) dateSet.add(key);
  }

  const uniqueDates = Array.from(dateSet).sort();
  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longestStreak = 1;
  let running = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    if (dayDifference(uniqueDates[i - 1], uniqueDates[i]) === 1) {
      running += 1;
    } else {
      running = 1;
    }
    longestStreak = Math.max(longestStreak, running);
  }

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterdayKey = new Date(today.getTime() - 86_400_000)
    .toISOString()
    .slice(0, 10);

  const latestDate = uniqueDates[uniqueDates.length - 1];
  if (latestDate !== todayKey && latestDate !== yesterdayKey) {
    return { currentStreak: 0, longestStreak };
  }

  let currentStreak = 1;
  for (let i = uniqueDates.length - 1; i > 0; i--) {
    if (dayDifference(uniqueDates[i - 1], uniqueDates[i]) !== 1) break;
    currentStreak += 1;
  }

  return { currentStreak, longestStreak };
}

async function loadUserActivity(userId: string): Promise<ActivityEvent[]> {
  const { data, error } = await supabaseAdmin
    .from('activity_events')
    .select(
      'id, user_id, profile_id, event_type, value, unit, metadata, occurred_at, created_at',
    )
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load activity: ${error.message}`);
  }
  return (data ?? []) as ActivityEvent[];
}

/* ============================================================
 * GET /api/activity
 *
 * Returns ActivityEvent[] directly — matches the frontend
 * `useActivityEvents()` contract.
 *
 * Pagination metadata is returned in response headers so the body
 * stays a plain array:
 *   X-Total-Count, X-Page-Limit, X-Page-Offset, X-Has-More
 * ============================================================ */

router.get('/', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    const limit = parsePositiveInteger(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);
    const offset = parseNonNegativeInteger(req.query.offset, 0);

    const eventType =
      typeof req.query.event_type === 'string'
        ? req.query.event_type.trim()
        : '';
    const profileId =
      typeof req.query.profile_id === 'string'
        ? req.query.profile_id.trim()
        : '';

    let query = supabaseAdmin
      .from('activity_events')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) query = query.eq('event_type', eventType);
    if (profileId) query = query.eq('profile_id', profileId);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const total = count ?? 0;
    const hasMore = offset + (data?.length ?? 0) < total;

    res.setHeader('X-Total-Count', String(total));
    res.setHeader('X-Page-Limit', String(limit));
    res.setHeader('X-Page-Offset', String(offset));
    res.setHeader('X-Has-More', hasMore ? 'true' : 'false');
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page-Limit, X-Page-Offset, X-Has-More');

    res.json(data ?? []);
  } catch (error) {
    console.error('[activity] GET / failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load activity.',
    });
  }
});

/* ============================================================
 * POST /api/activity
 *
 * Returns the created ActivityEvent directly — matches the
 * frontend `useCreateActivityEvent()` contract.
 * ============================================================ */

router.post('/', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    const eventType =
      typeof body.event_type === 'string' ? body.event_type.trim() : '';

    if (!eventType) {
      res.status(400).json({ error: 'event_type is required.' });
      return;
    }
    if (eventType.length > MAX_EVENT_TYPE_LENGTH) {
      res.status(400).json({
        error: `event_type must be ${MAX_EVENT_TYPE_LENGTH} characters or fewer.`,
      });
      return;
    }

    const profileId =
      typeof body.profile_id === 'string' && body.profile_id.trim()
        ? body.profile_id.trim()
        : null;

    const unit =
      typeof body.unit === 'string' && body.unit.trim()
        ? body.unit.trim()
        : null;

    const metadata =
      body.metadata &&
      typeof body.metadata === 'object' &&
      !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    let value: number | null = null;
    if (body.value !== undefined && body.value !== null && body.value !== '') {
      const parsed = Number(body.value);
      if (!Number.isFinite(parsed)) {
        res.status(400).json({ error: 'value must be a valid number.' });
        return;
      }
      value = parsed;
    }

    let occurredAt = new Date().toISOString();
    if (typeof body.occurred_at === 'string' && body.occurred_at.trim()) {
      const supplied = new Date(body.occurred_at);
      if (Number.isNaN(supplied.getTime())) {
        res.status(400).json({ error: 'occurred_at must be a valid date.' });
        return;
      }
      occurredAt = supplied.toISOString();
    }

    const { data: newEvent, error } = await supabaseAdmin
      .from('activity_events')
      .insert({
        user_id: user.id,
        profile_id: profileId,
        event_type: eventType,
        value,
        unit,
        metadata,
        occurred_at: occurredAt,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('[activity] POST / failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create activity.',
    });
  }
});

/* ============================================================
 * GET /api/activity/summary
 * ============================================================ */

router.get('/summary', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    const events = await loadUserActivity(user.id);

    const eventCounts: Record<string, number> = {};
    const dateKeys: string[] = [];
    for (const event of events) {
      eventCounts[event.event_type] = (eventCounts[event.event_type] ?? 0) + 1;
      const key = getDateKey(event.occurred_at ?? event.created_at);
      if (key) dateKeys.push(key);
    }
    const uniqueDates = new Set(dateKeys);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentEvents = events.filter((event) => {
      const date = new Date(event.occurred_at ?? event.created_at);
      return !Number.isNaN(date.getTime()) && date >= sevenDaysAgo;
    });

    const { currentStreak, longestStreak } = calculateStreaks(events);

    // Most common event type — previously misnamed `busiestDay`.
    const busiestEventType =
      Object.entries(eventCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    res.json({
      totalEvents: events.length,
      uniqueDays: uniqueDates.size,
      recentEvents: recentEvents.length,
      eventCounts,
      activityBreakdown: eventCounts,
      currentStreak,
      longestStreak,
      busiestEventType,
    });
  } catch (error) {
    console.error('[activity] GET /summary failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get activity summary.',
    });
  }
});

/* ============================================================
 * GET /api/activity/timeline
 *
 * Frontend expects { timeline: TimelinePoint[] }.
 * ============================================================ */

router.get('/timeline', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    const days = parsePositiveInteger(req.query.days, 90, 365);
    const events = await loadUserActivity(user.id);

    const timelineCounts: Record<string, number> = {};
    for (const event of events) {
      const key = getDateKey(event.occurred_at ?? event.created_at);
      if (!key) continue;
      timelineCounts[key] = (timelineCounts[key] ?? 0) + 1;
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const timeline: Array<{ date: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - i);
      const key = date.toISOString().slice(0, 10);
      timeline.push({ date: key, count: timelineCounts[key] ?? 0 });
    }

    res.json({ days, timeline });
  } catch (error) {
    console.error('[activity] GET /timeline failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get activity timeline.',
    });
  }
});

/* ============================================================
 * DELETE /api/activity/:id
 * ============================================================ */

router.delete('/:id', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!id) {
      res.status(400).json({ error: 'Activity event ID is required.' });
      return;
    }

    const { data: deleted, error } = await supabaseAdmin
      .from('activity_events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!deleted) {
      res.status(404).json({ error: 'Activity event not found.' });
      return;
    }

    res.status(200).json({ ok: true, id: deleted.id });
  } catch (error) {
    console.error('[activity] DELETE /:id failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete activity.',
    });
  }
});

export default router;