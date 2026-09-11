/**
 * Goals Analytics Engine
 * 
 * Connects user goals with real activity data from APIVue.
 * All progress tracking must be based on actual collected data.
 */

import type {
  Goal,
} from "@/hooks/use-goals";
import type {
  TrackedProfile,
  ProfileSnapshot,
} from "@/lib/integrations/registry";
import { buildProgressReport, type ProgressReport } from "./progress";

export interface GoalProgress {
  goal: Goal;
  currentValue: number;
  targetValue: number | null;
  progressPercentage: number;
  unit?: string;
  status: "on-track" | "behind" | "completed" | "paused" | "cancelled";
  daysRemaining?: number;
  trend: "positive" | "negative" | "neutral" | "insufficient-data";
  relatedMetrics: Array<{ label: string; value: number | string; change?: number }>;
  recommendations: string[];
}

/**
 * Calculate goal progress based on real activity data
 */
export function calculateGoalProgress(
  goal: Goal,
  profiles: TrackedProfile[],
  snapshots: ProfileSnapshot[]
): GoalProgress {
  const report = buildProgressReport(profiles, snapshots);
  const now = new Date();
  const targetDate = goal.target_date ? new Date(goal.target_date) : null;
  
  // Calculate days remaining if target date exists
  let daysRemaining: number | undefined;
  if (targetDate) {
    const diffTime = targetDate.getTime() - now.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Determine progress value based on goal type
  const currentValue = goal.current_value;
  const targetValue = goal.target_value ?? null;

  // Calculate progress percentage
  let progressPercentage = 0;
  if (targetValue && targetValue > 0) {
    progressPercentage = Math.min(100, Math.round((currentValue / targetValue) * 100));
  }

  // Determine status
  let status: GoalProgress["status"] = goal.current_value >= (goal.target_value ?? Number.POSITIVE_INFINITY)
    ? "completed"
    : goal.status === "active" ? "on-track" : goal.status;
  
  if (!status) {
    if (targetValue && currentValue >= targetValue) {
      status = "completed";
    } else if (goal.target_date) {
      const daysLeft = daysRemaining ?? 0;
      if (daysLeft <= 0) {
        status = currentValue >= (targetValue ?? 0) ? "completed" : "behind";
      } else if (progressPercentage >= 80) {
        status = "on-track";
      } else if (progressPercentage >= 50) {
        status = report.activity.currentStreak > 0 ? "on-track" : "behind";
      } else if (progressPercentage < 20 && daysLeft < 7) {
        status = "behind";
      } else {
        status = "on-track";
      }
    } else {
      status = "on-track";
    }
  }

  // Determine trend based on recent activity
  let trend: GoalProgress["trend"] = "insufficient-data";
  
  if (report.snapshotCount >= 2) {
    const positiveTrends = report.trends.filter((t) => t.change > 0).length;
    const negativeTrends = report.trends.filter((t) => t.change < 0).length;
    
    if (positiveTrends > negativeTrends && positiveTrends > 0) {
      trend = "positive";
    } else if (negativeTrends > positiveTrends && negativeTrends > 0) {
      trend = "negative";
    } else if (positiveTrends === 0 && negativeTrends === 0 && report.trends.length > 0) {
      trend = "neutral";
    }
  } else if (report.activity.totalEvents > 0) {
    trend = "neutral";
  }

  // Generate recommendations based on status and trend
  const recommendations: string[] = [];
  
  if (status === "behind" || trend === "negative") {
    if (daysRemaining && daysRemaining > 0) {
      const dailyNeeded = targetValue ? Math.ceil((targetValue - currentValue) / daysRemaining) : 0;
      if (dailyNeeded > 0) {
        recommendations.push(`Increase daily ${goal.unit ?? "activity"} by ${dailyNeeded} to stay on track`);
      }
    }
    recommendations.push("Review your recent activity patterns");
    recommendations.push("Consider setting smaller milestones");
  } else if (status === "on-track" && trend === "positive") {
    recommendations.push("Continue at your current pace");
    if (daysRemaining && daysRemaining > 0) {
      recommendations.push(`You're on track to complete this goal in ${daysRemaining} days`);
    }
  } else if (status === "completed") {
    recommendations.push("Great job! Consider setting a new, more challenging goal");
    recommendations.push("Share your achievement");
  }

  // Find related metrics
  const relatedMetrics: GoalProgress["relatedMetrics"] = [];
  
  // Look for metrics that might be related to this goal
  report.trends.slice(0, 3).forEach((trend) => {
    relatedMetrics.push({
      label: trend.label,
      value: trend.latest.value,
      change: trend.change,
    });
  });

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

/**
 * Calculate progress for all goals
 */
export function calculateAllGoalsProgress(
  goals: Goal[],
  profiles: TrackedProfile[],
  snapshots: ProfileSnapshot[]
): GoalProgress[] {
  return goals.map((goal) => calculateGoalProgress(goal, profiles, snapshots));
}

/**
 * Get goals summary statistics
 */
export function getGoalsSummary(progress: GoalProgress[]): {
  total: number;
  completed: number;
  onTrack: number;
  behind: number;
  paused: number;
  cancelled: number;
  averageProgress: number;
} {
  const total = progress.length;
  const completed = progress.filter((g) => g.status === "completed").length;
  const onTrack = progress.filter((g) => g.status === "on-track").length;
  const behind = progress.filter((g) => g.status === "behind").length;
  const paused = progress.filter((g) => g.status === "paused").length;
  const cancelled = progress.filter((g) => g.status === "cancelled").length;
  
  const averageProgress = total > 0
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

/**
 * Generate goal-based actions
 */
export function generateGoalActions(progress: GoalProgress[]): Array<{
  id: string;
  type: "celebrate" | "encourage" | "warn" | "suggest";
  title: string;
  description: string;
  priority: 1 | 2 | 3;
  goalId?: string;
}> {
  const actions: Array<{
    id: string;
    type: "celebrate" | "encourage" | "warn" | "suggest";
    title: string;
    description: string;
    priority: 1 | 2 | 3;
    goalId?: string;
  }> = [];
  
  // Celebrate completed goals
  progress.filter((g) => g.status === "completed").forEach((g) => {
    actions.push({
      id: `celebrate-${g.goal.id}`,
      type: "celebrate",
      title: `Goal completed: ${g.goal.title}`,
      description: `You've reached ${g.currentValue}${g.unit ? ` ${g.unit}` : ""}!`,
      priority: 1,
      goalId: g.goal.id,
    });
  });

  // Warn about at-risk goals
  progress.filter((g) => g.status === "behind" && g.daysRemaining && g.daysRemaining < 7).forEach((g) => {
    actions.push({
      id: `warn-${g.goal.id}`,
      type: "warn",
      title: ` ${g.goal.title} at risk`,
      description: `You have ${g.daysRemaining} days left and are behind schedule.`,
      priority: 1,
      goalId: g.goal.id,
    });
  });

  // Encourage goals that are on track
  progress.filter((g) => g.status === "on-track" && g.progressPercentage >= 50 && g.progressPercentage < 80).forEach((g) => {
    actions.push({
      id: `encourage-${g.goal.id}`,
      type: "encourage",
      title: `Keep going with ${g.goal.title}`,
      description: g.daysRemaining ? `You're ${g.progressPercentage}% of the way there with ${g.daysRemaining} days remaining.` : `You're making great progress!`,
      priority: 2,
      goalId: g.goal.id,
    });
  });

  // Suggest actions for stalled goals
  progress.filter((g) => g.trend === "negative" || (g.status === "behind" && g.daysRemaining && g.daysRemaining >= 7)).forEach((g) => {
    actions.push({
      id: `suggest-${g.goal.id}`,
      type: "suggest",
      title: `Improve ${g.goal.title} progress`,
      description: g.recommendations[0] ?? `Review your activity for this goal`,
      priority: 2,
      goalId: g.goal.id,
    });
  });

  // Sort by priority (1 first), then by type
  return actions.sort((a, b) => {
    const priorityDiff = a.priority - b.priority;
    if (priorityDiff !== 0) return priorityDiff;
    
    const typeOrder = { celebrate: 0, warn: 1, encourage: 2, suggest: 3 };
    return (typeOrder[a.type] ?? 4) - (typeOrder[b.type] ?? 4);
  });
}

/**
 * Suggest new goals based on user activity patterns
 */
export function suggestNewGoals(
  profiles: TrackedProfile[],
  snapshots: ProfileSnapshot[],
  existingGoals: Goal[]
): Array<{
  title: string;
  description: string;
  target_value: number;
  unit: string;
  category: string;
  reasoning: string;
}> {
  const report = buildProgressReport(profiles, snapshots);
  const suggestions: Array<{ title: string; description: string; target_value: number; unit: string; category: string; reasoning: string }> = [];
  
  if (report.snapshotCount === 0) {
    return suggestions; // No data to base suggestions on
  }

  // Suggest based on current metrics
  report.categoryProgress.forEach((category) => {
    const startingValue = category.trends.reduce((sum, t) => sum + t.latest.value, 0);
    
    if (startingValue > 0) {
      // Suggest a 10-20% improvement goal
      const target = Math.round(startingValue * 1.15);
      
      suggestions.push({
        title: `Increase ${category.label} metrics`,
        description: `Improve your combined metrics in ${category.label}`,
        target_value: target,
        unit: "points",
        category: category.category,
        reasoning: `Current combined value is ${startingValue}, aiming for ${target} (15% increase)`,
      });
    }
  });

  // Suggest based on streaks
  if (report.activity.longestStreak > 0) {
    const nextStreak = report.activity.longestStreak + 3;
    suggestions.push({
      title: `Beat your longest streak`,
      description: `Maintain daily activity for ${nextStreak} consecutive days`,
      target_value: nextStreak,
      unit: "days",
      category: "activity",
      reasoning: `Your current longest streak is ${report.activity.longestStreak} days`,
    });
  }

  // Suggest based on active days
  if (report.activity.activeDays > 0 && report.activity.activeDays < 30) {
    const target = Math.min(30, report.activity.activeDays + 5);
    suggestions.push({
      title: `Increase active days`,
      description: `Aim for ${target} active days in the next tracking period`,
      target_value: target,
      unit: "days",
      category: "activity",
      reasoning: `You've had ${report.activity.activeDays} active days so far`,
    });
  }

  return suggestions;
}
