/**
 * APIVue Goals Analytics Engine.
 *
 * Connects user goals with real activity data. All progress tracking
 * is based on actual collected data from tracked profiles and their
 * snapshots. No value is invented or estimated.
 *
 * NOTE ON TYPES:
 *   The `Goal` type is currently imported from `@/hooks/use-goals`.
 *   Ideally it should live in a shared types module (e.g.
 *   `@/lib/integrations/types` or a dedicated `@/lib/types/goal`),
 *   so that analytics does not depend on a hook file. This is safe
 *   for now because it is a type-only import and creates no runtime
 *   circular dependency. It can be relocated later without changing
 *   behavior.
 */

import type { Goal } from '@/hooks/use-goals';
import type {
  TrackedProfile,
  ProfileSnapshot,
} from '@/lib/integrations/registry';
import { buildProgressReport, type ProgressReport } from './progress';

/* ============================================================
 * Types
 * ============================================================ */

export interface GoalProgress {
  goal: Goal;
  currentValue: number;
  targetValue: number | null;
  progressPercentage: number;
  unit?: string;
  status: 'on-track' | 'behind' | 'completed' | 'paused' | 'cancelled';
  daysRemaining?: number;
  trend: 'positive' | 'negative' | 'neutral' | 'insufficient-data';
  relatedMetrics: Array<{
    label: string;
    value: number | string;
    change?: number;
  }>;
  recommendations: string[];
}

export interface GoalsSummary {
  total: number;
  completed: number;
  onTrack: number;
  behind: number;
  paused: number;
  cancelled: number;
  averageProgress: number;
}

export interface GoalAction {
  id: string;
  type: 'celebrate' | 'encourage' | 'warn' | 'suggest';
  title: string;
  description: string;
  priority: 1 | 2 | 3;
  goalId?: string;
}

export interface GoalSuggestion {
  title: string;
  description: string;
  target_value: number;
  unit: string;
  category: string;
  reasoning: string;
}

/* ============================================================
 * Internals
 * ============================================================ */

const MS_PER_DAY = 86_400_000;

/**
 * Determines the display status of a goal.
 * This is the SINGLE source of truth for status; do not compute it
 * elsewhere in this module.
 */
function resolveStatus(
  goal: Goal,
  currentValue: number,
  targetValue: number | null,
  progressPercentage: number,
  daysRemaining: number | undefined,
  report: ProgressReport,
): GoalProgress['status'] {
  // Respect explicit terminal statuses set by the user.
  if (goal.status === 'paused') return 'paused';
  if (goal.status === 'cancelled') return 'cancelled';

  // Completed if the value has reached (or passed) the target.
  if (targetValue !== null && currentValue >= targetValue) {
    return 'completed';
  }

  // If there is no target or no deadline, we can only say "on-track".
  if (targetValue === null || daysRemaining === undefined) {
    return 'on-track';
  }

  // Deadline passed without reaching target.
  if (daysRemaining <= 0) {
    return 'behind';
  }

  // Heuristic based on progress vs. time remaining.
  if (progressPercentage >= 80) return 'on-track';
  if (progressPercentage >= 50) {
    return report.activity.currentStreak > 0 ? 'on-track' : 'behind';
  }
  if (progressPercentage < 20 && daysRemaining < 7) return 'behind';

  return 'on-track';
}

function resolveTrend(
  report: ProgressReport,
): GoalProgress['trend'] {
  if (report.snapshotCount >= 2 && report.trends.length > 0) {
    const positive = report.trends.filter((t) => t.change > 0).length;
    const negative = report.trends.filter((t) => t.change < 0).length;

    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  if (report.activity.totalEvents > 0) return 'neutral';

  return 'insufficient-data';
}

function buildRecommendations(
  goal: Goal,
  status: GoalProgress['status'],
  trend: GoalProgress['trend'],
  currentValue: number,
  targetValue: number | null,
  daysRemaining: number | undefined,
): string[] {
  const out: string[] = [];

  if (status === 'behind' || trend === 'negative') {
    if (
      daysRemaining !== undefined &&
      daysRemaining > 0 &&
      targetValue !== null
    ) {
      const dailyNeeded = Math.ceil(
        (targetValue - currentValue) / daysRemaining,
      );
      if (dailyNeeded > 0) {
        out.push(
          `Increase daily ${goal.unit ?? 'activity'} by ${dailyNeeded} to stay on track`,
        );
      }
    }
    out.push('Review your recent activity patterns');
    out.push('Consider setting smaller milestones');
    return out;
  }

  if (status === 'on-track' && trend === 'positive') {
    out.push('Continue at your current pace');
    if (daysRemaining !== undefined && daysRemaining > 0) {
      out.push(`You're on track to complete this goal in ${daysRemaining} days`);
    }
    return out;
  }

  if (status === 'completed') {
    out.push('Great job! Consider setting a new, more challenging goal');
    out.push('Share your achievement');
  }

  return out;
}

/* ============================================================
 * Public API
 * ============================================================ */

/**
 * Calculates goal progress based on real activity data.
 * Pure function — no side effects, no network calls.
 */
export function calculateGoalProgress(
  goal: Goal,
  profiles: TrackedProfile[],
  snapshots: ProfileSnapshot[],
): GoalProgress {
  const report = buildProgressReport(profiles, snapshots);

  const now = Date.now();
  const targetDate = goal.target_date ? Date.parse(goal.target_date) : null;

  const daysRemaining =
    targetDate !== null
      ? Math.ceil((targetDate - now) / MS_PER_DAY)
      : undefined;

  const currentValue = goal.current_value;
  const targetValue = goal.target_value ?? null;

  const progressPercentage =
    targetValue !== null && targetValue > 0
      ? Math.min(100, Math.round((currentValue / targetValue) * 100))
      : 0;

  const status = resolveStatus(
    goal,
    currentValue,
    targetValue,
    progressPercentage,
    daysRemaining,
    report,
  );

  const trend = resolveTrend(report);

  const recommendations = buildRecommendations(
    goal,
    status,
    trend,
    currentValue,
    targetValue,
    daysRemaining,
  );

  // Related metrics — the top three trends from the report.
  const relatedMetrics = report.trends.slice(0, 3).map((t) => ({
    label: t.label,
    value: t.latest.value,
    change: t.change,
  }));

  return {
    goal,
    currentValue,
    targetValue,
    progressPercentage,
    unit: goal.unit ?? undefined,
    status,
    daysRemaining,
    trend,
    relatedMetrics,
    recommendations,
  };
}

/** Calculates progress for all goals at once. */
export function calculateAllGoalsProgress(
  goals: Goal[],
  profiles: TrackedProfile[],
  snapshots: ProfileSnapshot[],
): GoalProgress[] {
  return goals.map((goal) => calculateGoalProgress(goal, profiles, snapshots));
}

/** Aggregate statistics across a set of goal progresses. */
export function getGoalsSummary(progress: GoalProgress[]): GoalsSummary {
  const total = progress.length;
  const completed = progress.filter((g) => g.status === 'completed').length;
  const onTrack = progress.filter((g) => g.status === 'on-track').length;
  const behind = progress.filter((g) => g.status === 'behind').length;
  const paused = progress.filter((g) => g.status === 'paused').length;
  const cancelled = progress.filter((g) => g.status === 'cancelled').length;

  const averageProgress =
    total > 0
      ? progress.reduce((sum, g) => sum + g.progressPercentage, 0) / total
      : 0;

  return {
    total,
    completed,
    onTrack,
    behind,
    paused,
    cancelled,
    averageProgress: Math.round(averageProgress),
  };
}

/** Generates prioritized, actionable items derived from goal progress. */
export function generateGoalActions(progress: GoalProgress[]): GoalAction[] {
  const actions: GoalAction[] = [];

  progress
    .filter((g) => g.status === 'completed')
    .forEach((g) => {
      actions.push({
        id: `celebrate-${g.goal.id}`,
        type: 'celebrate',
        title: `Goal completed: ${g.goal.title}`,
        description: `You've reached ${g.currentValue}${g.unit ? ` ${g.unit}` : ''}!`,
        priority: 1,
        goalId: g.goal.id,
      });
    });

  progress
    .filter(
      (g) =>
        g.status === 'behind' &&
        g.daysRemaining !== undefined &&
        g.daysRemaining < 7,
    )
    .forEach((g) => {
      actions.push({
        id: `warn-${g.goal.id}`,
        type: 'warn',
        title: `${g.goal.title} at risk`,
        description: `You have ${g.daysRemaining} day${g.daysRemaining === 1 ? '' : 's'} left and are behind schedule.`,
        priority: 1,
        goalId: g.goal.id,
      });
    });

  progress
    .filter(
      (g) =>
        g.status === 'on-track' &&
        g.progressPercentage >= 50 &&
        g.progressPercentage < 80,
    )
    .forEach((g) => {
      actions.push({
        id: `encourage-${g.goal.id}`,
        type: 'encourage',
        title: `Keep going with ${g.goal.title}`,
        description:
          g.daysRemaining !== undefined
            ? `You're ${g.progressPercentage}% of the way there with ${g.daysRemaining} day${g.daysRemaining === 1 ? '' : 's'} remaining.`
            : `You're making great progress!`,
        priority: 2,
        goalId: g.goal.id,
      });
    });

  progress
    .filter(
      (g) =>
        g.trend === 'negative' ||
        (g.status === 'behind' &&
          g.daysRemaining !== undefined &&
          g.daysRemaining >= 7),
    )
    .forEach((g) => {
      actions.push({
        id: `suggest-${g.goal.id}`,
        type: 'suggest',
        title: `Improve ${g.goal.title} progress`,
        description:
          g.recommendations[0] ?? 'Review your activity for this goal',
        priority: 2,
        goalId: g.goal.id,
      });
    });

  const typeOrder: Record<GoalAction['type'], number> = {
    celebrate: 0,
    warn: 1,
    encourage: 2,
    suggest: 3,
  };

  return actions.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return typeOrder[a.type] - typeOrder[b.type];
  });
}

/**
 * Suggests new goals based on real activity patterns.
 * Skips suggestions that already have an equivalent goal.
 */
export function suggestNewGoals(
  profiles: TrackedProfile[],
  snapshots: ProfileSnapshot[],
  existingGoals: Goal[],
): GoalSuggestion[] {
  const report = buildProgressReport(profiles, snapshots);
  if (report.snapshotCount === 0) return [];

  const suggestions: GoalSuggestion[] = [];

  const existingTitles = new Set(
    existingGoals.map((g) => g.title.toLowerCase()),
  );
  const isDuplicate = (title: string) =>
    existingTitles.has(title.toLowerCase());

  // Category-based suggestions.
  report.categoryProgress.forEach((category) => {
    const startingValue = category.trends.reduce(
      (sum, t) => sum + t.latest.value,
      0,
    );
    if (startingValue <= 0) return;

    const title = `Increase ${category.label} metrics`;
    if (isDuplicate(title)) return;

    const target = Math.round(startingValue * 1.15);

    suggestions.push({
      title,
      description: `Improve your combined metrics in ${category.label}`,
      target_value: target,
      unit: 'points',
      category: category.category,
      reasoning: `Current combined value is ${startingValue}; aiming for ${target} (15% increase).`,
    });
  });

  // Streak suggestion.
  if (report.activity.longestStreak > 0) {
    const title = 'Beat your longest streak';
    if (!isDuplicate(title)) {
      const nextStreak = report.activity.longestStreak + 3;
      suggestions.push({
        title,
        description: `Maintain daily activity for ${nextStreak} consecutive days`,
        target_value: nextStreak,
        unit: 'days',
        category: 'activity',
        reasoning: `Your current longest streak is ${report.activity.longestStreak} day${report.activity.longestStreak === 1 ? '' : 's'}.`,
      });
    }
  }

  // Active days suggestion.
  if (report.activity.activeDays > 0 && report.activity.activeDays < 30) {
    const title = 'Increase active days';
    if (!isDuplicate(title)) {
      const target = Math.min(30, report.activity.activeDays + 5);
      suggestions.push({
        title,
        description: `Aim for ${target} active days in the next tracking period`,
        target_value: target,
        unit: 'days',
        category: 'activity',
        reasoning: `You've had ${report.activity.activeDays} active day${report.activity.activeDays === 1 ? '' : 's'} so far.`,
      });
    }
  }

  return suggestions;
}