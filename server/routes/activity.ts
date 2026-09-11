import {
  Router,
  type Request,
  type Response,
} from 'express';

import { requireSupabaseUser } from '../middleware/session';
import { supabaseAdmin } from '../supabase';

const router = Router();

/**
 * GET /api/activity
 * Returns user's activity events with filtering and pagination
 */
router.get('/', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    const { data: events, error } = await supabaseAdmin
      .from('activity_events')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      events: events ?? [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load activity',
    });
  }
});

/**
 * POST /api/activity
 * Creates a new activity event
 */
router.post('/', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    const {
      event_type,
      value,
      unit,
      metadata,
      occurred_at,
      profile_id,
    } = req.body;

    if (!event_type) {
      return res.status(400).json({
        error: 'event_type is required',
      });
    }

    const { data: newEvent, error } = await supabaseAdmin
      .from('activity_events')
      .insert({
        user_id: user.id,
        profile_id: profile_id ?? null,
        event_type,
        value: value ?? null,
        unit: unit ?? null,
        metadata: metadata ?? {},
        occurred_at: occurred_at ?? new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      event: newEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create activity',
    });
  }
});

/**
 * GET /api/activity/summary
 * Returns activity summary statistics
 */
router.get('/summary', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    const { data: events, error } = await supabaseAdmin
      .from('activity_events')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Calculate summary statistics
    const totalEvents = events?.length ?? 0;
    
    // Count events by type
    const eventCounts: Record<string, number> = {};
    for (const event of events ?? []) {
      eventCounts[event.event_type] = (eventCounts[event.event_type] ?? 0) + 1;
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentEvents = events?.filter(
      (e) => new Date(e.occurred_at ?? e.created_at) >= sevenDaysAgo
    ) ?? [];

    // Calculate streaks
    const dates = events?.map((e) => e.occurred_at?.slice(0, 10) ?? e.created_at?.slice(0, 10)) ?? [];
    const uniqueDates = [...new Set(dates)].sort();
    
    let currentStreak = 0;
    let longestStreak = 0;
    
    if (uniqueDates.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      
      // Simple streak calculation
      let streak = 1;
      for (let i = uniqueDates.length - 1; i > 0; i--) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diff === 1) {
          streak++;
        } else if (diff > 1) {
          longestStreak = Math.max(longestStreak, streak);
          streak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, streak);
      currentStreak = streak;
    }

    res.json({
      totalEvents,
      uniqueDays: uniqueDates.length,
      recentEvents: recentEvents.length,
      eventCounts,
      currentStreak,
      longestStreak,
      activityBreakdown: eventCounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get activity summary',
    });
  }
});

/**
 * GET /api/activity/timeline
 * Returns activity timeline for charting
 */
router.get('/timeline', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    const { days = 90 } = req.query;
    const daysNum = Math.min(Number(days) || 90, 365);

    const { data: events, error } = await supabaseAdmin
      .from('activity_events')
      .select('occurred_at')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const timeline: Record<string, number> = {};
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    for (const event of events ?? []) {
      const dateStr = event.occurred_at?.slice(0, 10) ?? event.created_at?.slice(0, 10) ?? '';
      if (dateStr) {
        timeline[dateStr] = (timeline[dateStr] ?? 0) + 1;
      }
    }

    const result: { date: string; count: number }[] = [];
    for (let i = 0; i < daysNum; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      result.push({
        date: dateStr,
        count: timeline[dateStr] ?? 0,
      });
    }

    res.json({
      timeline: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get activity timeline',
    });
  }
});

/**
 * DELETE /api/activity/:id
 * Deletes an activity event
 */
router.delete('/:id', async (req, res) => {
  const user = await requireSupabaseUser(req, res);
  if (!user) return;

  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('activity_events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: 'Activity event deleted',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete activity',
    });
  }
});

export default router;
