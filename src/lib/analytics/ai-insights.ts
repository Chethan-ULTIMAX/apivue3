/**
 * APIVue AI Insights Engine.
 *
 * Provides deterministic, data-driven insights and recommendations
 * based on real user activity, progress, and historical data.
 *
 * IMPORTANT: All insights MUST be derived from actual collected data.
 * No fabricated, estimated, or invented statistics are allowed.
 *
 * The output of this module is designed to be consumed verbatim as
 * the structured context for a future LLM layer. The LLM interprets
 * these facts; it does NOT compute them.
 */

import type {
  ProfileSnapshot,
  TrackedProfile,
} from '@/lib/integrations/registry';
import { getIntegration } from '@/lib/integrations/registry';
import {
  buildProgressReport,
  type ProgressReport,
} from './progress';

/* ============================================================
 * Types
 * ============================================================ */

export type InsightCategory =
  | 'progress'
  | 'activity'
  | 'goals'
  | 'trends'
  | 'patterns'
  | 'recommendations'
  | 'warnings';

export type InsightSeverity = 'info' | 'good' | 'great' | 'warning' | 'critical';

export interface AIInsight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description: string;
  explanation: string;
  evidence: Record<string, string | number | boolean>;
  actionable: boolean;
  suggestions?: string[];
  timestamp: string;
}

export interface AIRecommendation {
  id: string;
  type: 'daily' | 'weekly' | 'improvement' | 'goal' | 'maintenance';
  /** 1 = highest priority, 3 = lowest. */
  priority: 1 | 2 | 3;
  title: string;
  description: string;
  reasoning: string[];
  action: string;
  expectedImpact: string;
  /** IDs of insights this recommendation is based on. */
  basedOn: string[];
}

export interface AISession {
  id: string;
  generatedAt: string;
  dataSummary: {
    profiles: number;
    snapshots: number;
    historyDays: number;
    events: number;
    streak: number;
    /**
     * Goals count. Currently 0 because goals are not yet wired into
     * the analytics pipeline. When that integration lands, this
     * becomes the real count.
     */
    goals: number;
  };
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  overallAssessment: {
    strength: string;
    areasForImprovement: string[];
    /** 0–100, deterministic, derived from the report. */
    score: number;
    confidence: 'low' | 'medium' | 'high';
  };
}

export interface AIShortSummary {
  summary: string;
  confidence: 'low' | 'medium' | 'high';
  score: number;
  insightsCount: {
    total: number;
    strengths: number;
    warnings: number;
  };
}

/* ============================================================
 * Scoring & confidence
 * ============================================================ */

/** Confidence is a proxy for "how much data do we have to work with". */
function calculateConfidence(
  profiles: TrackedProfile[],
  snapshots: ProfileSnapshot[],
): AISession['overallAssessment']['confidence'] {
  if (profiles.length === 0) return 'low';
  if (snapshots.length < 3) return 'low';
  if (snapshots.length < 10) return 'medium';
  return 'high';
}

/**
 * Deterministic 0–100 score derived from real report values.
 *
 * Weights:
 *   40% — activity volume (relative to a soft cap of 100 events)
 *   30% — proportion of positive trends
 *   30% — consistency (average of current & longest streak vs. 30 days)
 *
 * Each component is scaled to 0–100 BEFORE weighting, so the final
 * score is also 0–100. Previously the "progress" component was
 * multiplied by 0.3 without being scaled to 0–100 first, which
 * silently capped the maximum score at ~70.
 */
function calculateOverallScore(report: ProgressReport): number {
  if (report.profileCount === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  // Activity volume (weight 40)
  {
    const weight = 40;
    const activityScore = Math.min(report.activity.totalEvents / 100, 1) * 100;
    weightedSum += activityScore * weight;
    totalWeight += weight;
  }

  // Progress — proportion of positive trends (weight 30)
  {
    const weight = 30;
    const total = report.trends.length;
    if (total > 0) {
      const positive = report.trends.filter((t) => t.change > 0).length;
      const progressScore = (positive / total) * 100;
      weightedSum += progressScore * weight;
      totalWeight += weight;
    }
  }

  // Consistency — average streak vs. 30 days (weight 30)
  {
    const weight = 30;
    const avgStreak =
      (report.activity.currentStreak + report.activity.longestStreak) / 2;
    const consistencyScore = Math.min(avgStreak / 30, 1) * 100;
    weightedSum += consistencyScore * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
}

/* ============================================================
 * Insight generators
 * ============================================================ */

function generateStrengthInsights(report: ProgressReport): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = new Date().toISOString();

  const positiveTrends = report.trends.filter((t) => t.change > 0);
  for (const trend of positiveTrends.slice(0, 3)) {
    insights.push({
      id: `strength-${trend.profileId}-${trend.metricKey}`,
      category: 'progress',
      severity: 'great',
      title: `Growth in ${trend.label}`,
      description: `Your ${trend.label} has improved by +${trend.change.toLocaleString()}`,
      explanation: `This metric has grown from ${trend.first.value.toLocaleString()} to ${trend.latest.value.toLocaleString()} over ${trend.points.length} recorded points.`,
      evidence: {
        metric: trend.metricKey,
        from: trend.first.value,
        to: trend.latest.value,
        change: trend.change,
        points: trend.points.length,
      },
      actionable: false,
      suggestions: [
        `Continue tracking ${trend.label} regularly`,
        `Set a goal related to this improvement`,
      ],
      timestamp: now,
    });
  }

  if (report.activity.longestStreak >= 7) {
    insights.push({
      id: 'strength-consistency',
      category: 'activity',
      severity: 'great',
      title: `Consistency streak of ${report.activity.longestStreak} days`,
      description: `You've demonstrated impressive consistency with your digital activity`,
      explanation: `Your longest streak of ${report.activity.longestStreak} days shows strong commitment to maintaining regular activity.`,
      evidence: {
        longestStreak: report.activity.longestStreak,
        activeDays: report.activity.activeDays,
      },
      actionable: false,
      suggestions: [
        'Maintain this consistency',
        'Set goals to extend your streak',
      ],
      timestamp: now,
    });
  }

  if (report.activity.activeDays >= 30) {
    insights.push({
      id: 'strength-active-days',
      category: 'activity',
      severity: 'great',
      title: `${report.activity.activeDays} active days on record`,
      description: `Significant activity history built`,
      explanation: `You have ${report.activity.activeDays} days with recorded activity, providing a solid foundation for analysis.`,
      evidence: {
        activeDays: report.activity.activeDays,
        totalEvents: report.activity.totalEvents,
        snapshotCount: report.snapshotCount,
      },
      actionable: false,
      suggestions: [
        'Consider analyzing patterns in your most active periods',
        'Set goals based on your activity patterns',
      ],
      timestamp: now,
    });
  }

  return insights;
}

function generateImprovementInsights(report: ProgressReport): AIInsight[] {
  const insights: AIInsight[] = [];
  const now = new Date().toISOString();

  const nonPositive = report.trends.filter((t) => t.change <= 0);
  for (const trend of nonPositive.slice(0, 3)) {
    if (trend.change < 0) {
      insights.push({
        id: `improvement-${trend.profileId}-${trend.metricKey}`,
        category: 'trends',
        severity: 'warning',
        title: `Decline in ${trend.label}`,
        description: `Your ${trend.label} has decreased by ${trend.change.toLocaleString()}`,
        explanation: `This metric has declined from ${trend.first.value.toLocaleString()} to ${trend.latest.value.toLocaleString()} over time.`,
        evidence: {
          metric: trend.metricKey,
          from: trend.first.value,
          to: trend.latest.value,
          change: trend.change,
        },
        actionable: true,
        suggestions: [
          `Focus on improving ${trend.label}`,
          'Review your activity patterns',
          'Set a goal to reverse this trend',
        ],
        timestamp: now,
      });
    } else if (trend.change === 0) {
      insights.push({
        id: `improvement-stagnant-${trend.profileId}-${trend.metricKey}`,
        category: 'trends',
        severity: 'info',
        title: `Stagnant ${trend.label}`,
        description: `Your ${trend.label} has remained at ${trend.latest.value.toLocaleString()}`,
        explanation: `No change detected across ${trend.points.length} recorded points.`,
        evidence: {
          metric: trend.metricKey,
          value: trend.latest.value,
          points: trend.points.length,
        },
        actionable: true,
        suggestions: [
          `Consider setting a goal to improve ${trend.label}`,
          'Increase activity to see progress',
        ],
        timestamp: now,
      });
    }
  }

  if (report.activity.activeDays === 0) {
    insights.push({
      id: 'improvement-no-activity',
      category: 'activity',
      severity: 'critical',
      title: 'No activity recorded yet',
      description: 'No events have been collected from your connected profiles',
      explanation:
        'APIVue needs activity data to provide meaningful insights. Connect profiles and refresh them to start building your history.',
      evidence: {
        profiles: report.profileCount,
        snapshots: report.snapshotCount,
        events: report.activity.totalEvents,
      },
      actionable: true,
      suggestions: [
        'Connect your first profile',
        'Refresh your connected profiles to collect activity',
        'Wait for activity data to accumulate',
      ],
      timestamp: now,
    });
  }

  if (report.snapshotCount < 5 && report.profileCount > 0) {
    insights.push({
      id: 'improvement-short-history',
      category: 'progress',
      severity: 'warning',
      title: 'Limited history for analysis',
      description: `Only ${report.snapshotCount} snapshot${report.snapshotCount === 1 ? '' : 's'} collected`,
      explanation:
        'More snapshots will enable better trend analysis and more accurate insights. Refresh your profiles at different times to build history.',
      evidence: {
        snapshots: report.snapshotCount,
        profileCount: report.profileCount,
        historyDays: report.historyDays,
      },
      actionable: true,
      suggestions: [
        'Refresh your profiles regularly',
        'Connect more profiles for comprehensive analysis',
        'Wait for more data to accumulate',
      ],
      timestamp: now,
    });
  }

  if (report.activity.currentStreak === 0 && report.activity.activeDays > 0) {
    insights.push({
      id: 'improvement-broken-streak',
      category: 'activity',
      severity: 'warning',
      title: 'Current streak reset',
      description: 'Your current activity streak has been broken',
      explanation: `Your longest streak was ${report.activity.longestStreak} days, but your current streak is now 0 days. Consistency is key for long-term progress.`,
      evidence: {
        currentStreak: report.activity.currentStreak,
        longestStreak: report.activity.longestStreak,
      },
      actionable: true,
      suggestions: [
        'Resume your daily activity',
        'Set a goal to rebuild your streak',
        'Analyze what interrupted your consistency',
      ],
      timestamp: now,
    });
  }

  return insights;
}

function generateGoalInsights(
  profiles: TrackedProfile[],
  report: ProgressReport,
): AIInsight[] {
  const insights: AIInsight[] = [];

  const coveredCategories = new Set<string>();
  for (const profile of profiles) {
    const integration = getIntegration(profile.platform);
    for (const c of integration?.categories ?? []) {
      coveredCategories.add(c);
    }
  }

  const totalCategories = 5; // development, competitive-programming, learning, activity, goals

  if (coveredCategories.size < totalCategories) {
    insights.push({
      id: 'goal-category-coverage',
      category: 'goals',
      severity: 'info',
      title: `${coveredCategories.size} of ${totalCategories} areas covered`,
      description: 'Expand your digital presence across more categories',
      explanation: `Currently tracking ${coveredCategories.size} categories. Connecting diverse platforms provides a more complete picture of your digital life.`,
      evidence: {
        covered: coveredCategories.size,
        total: totalCategories,
        categories: Array.from(coveredCategories).join(', '),
        reportProfiles: report.profileCount,
      },
      actionable: true,
      suggestions: [
        'Connect profiles from uncovered categories',
        'Explore platforms in different areas',
      ],
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
}

function generatePatternInsights(report: ProgressReport): AIInsight[] {
  const insights: AIInsight[] = [];

  if (report.activity.last7 > 0 && report.activity.previous7 > 0) {
    const change = report.activity.last7 - report.activity.previous7;
    const pctChange = (change / report.activity.previous7) * 100;
    const rounded = Math.round(pctChange);

    if (pctChange > 20) {
      insights.push({
        id: 'pattern-increased-activity',
        category: 'patterns',
        severity: 'great',
        title: `${rounded}% increase in recent activity`,
        description: `Your activity has significantly increased compared to the previous week`,
        explanation: `Recent 7 days: ${report.activity.last7.toLocaleString()} events; previous 7 days: ${report.activity.previous7.toLocaleString()} events.`,
        evidence: {
          recent: report.activity.last7,
          previous: report.activity.previous7,
          change,
          pctChange: rounded,
        },
        actionable: false,
        suggestions: [
          'Maintain this increased level of activity',
          'Identify what drove this increase',
        ],
        timestamp: new Date().toISOString(),
      });
    } else if (pctChange < -20) {
      insights.push({
        id: 'pattern-decreased-activity',
        category: 'patterns',
        severity: 'warning',
        title: `${Math.abs(rounded)}% decrease in recent activity`,
        description: `Your activity has significantly decreased compared to the previous week`,
        explanation: `Recent 7 days: ${report.activity.last7.toLocaleString()} events; previous 7 days: ${report.activity.previous7.toLocaleString()} events.`,
        evidence: {
          recent: report.activity.last7,
          previous: report.activity.previous7,
          change,
          pctChange: rounded,
        },
        actionable: true,
        suggestions: [
          'Investigate why activity decreased',
          'Set a goal to increase activity',
          'Review your schedule and commitments',
        ],
        timestamp: new Date().toISOString(),
      });
    }
  }

  return insights;
}

/* ============================================================
 * Recommendations
 * ============================================================ */

function generateRecommendations(
  insights: AIInsight[],
  report: ProgressReport,
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];
  const ids = new Set(insights.map((i) => i.id));

  if (ids.has('improvement-no-activity')) {
    recommendations.push({
      id: 'rec-connect-profiles',
      type: 'improvement',
      priority: 1,
      title: 'Connect your first profile',
      description: 'Start collecting real activity data from supported platforms',
      reasoning: [
        'No activity data is currently available for analysis',
        'Profiles need to be connected and refreshed to collect data',
        'APIVue can only provide insights based on real, authorized data',
      ],
      action: 'Go to Integrations and connect a platform',
      expectedImpact:
        'Immediate access to profile data and ability to collect activity history',
      basedOn: ['improvement-no-activity'],
    });
  }

  if (ids.has('improvement-short-history')) {
    recommendations.push({
      id: 'rec-build-history',
      type: 'improvement',
      priority: 1,
      title: 'Build your history with regular refreshes',
      description: 'Collect more snapshots to enable better trend analysis',
      reasoning: [
        'Current history is limited to few snapshots',
        'More data points enable more accurate pattern detection',
        'Regular refreshes ensure up-to-date tracking',
      ],
      action: 'Refresh your connected profiles at different times',
      expectedImpact:
        'More accurate trend analysis and longer-term insights',
      basedOn: ['improvement-short-history'],
    });
  }

  if (ids.has('improvement-broken-streak')) {
    recommendations.push({
      id: 'rec-rebuild-streak',
      type: 'goal',
      priority: 2,
      title: 'Rebuild your consistency streak',
      description: 'Get back on track with daily activity',
      reasoning: [
        'Your current streak has been reset to 0',
        `You previously achieved a streak of ${report.activity.longestStreak} days`,
        'Consistency is a key indicator of long-term progress',
      ],
      action: 'Perform activity on your connected platforms today',
      expectedImpact: 'Rebuild streak and maintain consistency',
      basedOn: ['improvement-broken-streak'],
    });
  }

  const hasPositiveProgress = insights.some(
    (i) => i.category === 'progress' && i.severity === 'great',
  );
  if (hasPositiveProgress) {
    recommendations.push({
      id: 'rec-set-goals',
      type: 'goal',
      priority: 3,
      title: 'Set goals based on your progress',
      description:
        'Capitalize on your positive trends by setting specific targets',
      reasoning: [
        'You have demonstrated positive growth in multiple metrics',
        'Setting goals helps maintain focus and measure progress',
        'Goals provide direction for continued improvement',
      ],
      action: 'Create goals for metrics showing positive trends',
      expectedImpact: 'Structured approach to continued improvement',
      basedOn: insights
        .filter((i) => i.category === 'progress' && i.severity === 'great')
        .map((i) => i.id),
    });
  }

  const hasNegativeTrends = insights.some(
    (i) => i.category === 'trends' && i.severity === 'warning',
  );
  if (hasNegativeTrends) {
    recommendations.push({
      id: 'rec-analyze-declines',
      type: 'improvement',
      priority: 2,
      title: 'Analyze and address declining metrics',
      description: 'Understand why certain metrics are decreasing',
      reasoning: [
        'Some of your tracked metrics are showing negative trends',
        'Identifying the cause can help you address the issue',
        'Early intervention prevents long-term decline',
      ],
      action:
        'Review your activity patterns and identify factors affecting performance',
      expectedImpact:
        'Identify issues and implement solutions to reverse negative trends',
      basedOn: insights
        .filter((i) => i.category === 'trends' && i.severity === 'warning')
        .map((i) => i.id),
    });
  }

  return recommendations;
}

/* ============================================================
 * Public entry points
 * ============================================================ */

/**
 * Generates a full AI coach session from real APIVue data.
 * Pure function — the same inputs always yield the same outputs.
 */
export function generateAICoachSession(
  profiles: TrackedProfile[],
  snapshots: ProfileSnapshot[],
): AISession {
  const report = buildProgressReport(profiles, snapshots);
  const confidence = calculateConfidence(profiles, snapshots);
  const score = calculateOverallScore(report);

  const allInsights = [
    ...generateStrengthInsights(report),
    ...generateImprovementInsights(report),
    ...generateGoalInsights(profiles, report),
    ...generatePatternInsights(report),
  ].sort((a, b) => {
    // Push critical/warning insights first, then actionable ones.
    const severityOrder: Record<InsightSeverity, number> = {
      critical: 0,
      warning: 1,
      info: 2,
      good: 3,
      great: 4,
    };
    const sevDiff =
      (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5);
    if (sevDiff !== 0) return sevDiff;
    return (b.actionable ? 1 : 0) - (a.actionable ? 1 : 0);
  });

  const recommendations = generateRecommendations(allInsights, report);

  const strengths: string[] = [];
  const improvements: string[] = [];

  for (const insight of allInsights) {
    if (insight.severity === 'great' || insight.severity === 'good') {
      strengths.push(insight.title);
    } else if (
      insight.severity === 'warning' ||
      insight.severity === 'critical'
    ) {
      improvements.push(insight.title);
    }
  }

  const strength =
    strengths.length > 0
      ? strengths[0]
      : improvements.length > 0
        ? `Address ${improvements[0].toLowerCase()}`
        : 'Start building your digital history';

  return {
    id: `session-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    dataSummary: {
      profiles: profiles.length,
      snapshots: snapshots.length,
      historyDays: report.historyDays,
      events: report.activity.totalEvents,
      streak: report.activity.currentStreak,
      goals: 0, // Will be populated when goals are wired into analytics.
    },
    insights: allInsights,
    recommendations,
    overallAssessment: {
      strength,
      areasForImprovement: improvements.slice(0, 3),
      score,
      confidence,
    },
  };
}

/** Lightweight summary for hero cards / dashboard widgets. */
export function getAIShortSummary(
  profiles: TrackedProfile[],
  snapshots: ProfileSnapshot[],
): AIShortSummary {
  const report = buildProgressReport(profiles, snapshots);
  const confidence = calculateConfidence(profiles, snapshots);
  const score = calculateOverallScore(report);

  const allInsights = [
    ...generateStrengthInsights(report),
    ...generateImprovementInsights(report),
    ...generateGoalInsights(profiles, report),
    ...generatePatternInsights(report),
  ];

  const strengths = allInsights.filter(
    (i) => i.severity === 'great' || i.severity === 'good',
  ).length;
  const warnings = allInsights.filter(
    (i) => i.severity === 'warning' || i.severity === 'critical',
  ).length;

  let summary: string;
  if (profiles.length === 0) {
    summary =
      'No profiles connected yet. Connect platforms to start analytical intelligence.';
  } else if (snapshots.length < 3) {
    const needed = 3 - snapshots.length;
    summary = `Building your history with ${snapshots.length} snapshot${
      snapshots.length === 1 ? '' : 's'
    }. Collect ${needed} more to reach 1 snapshot and unlock deeper insights.`;
  } else if (score >= 70) {
    summary = `Strong progress! Score: ${score}/100. Your digital activity shows ${allInsights.length} notable pattern${
      allInsights.length === 1 ? '' : 's'
    }.`;
  } else if (score >= 40) {
    summary = `Moderate progress. Score: ${score}/100. Focus on ${
      warnings > 0
        ? `${warnings} area${warnings === 1 ? '' : 's'} needing improvement`
        : 'sustaining your momentum'
    }.`;
  } else {
    const first = allInsights[0];
    const nextStep = first
      ? first.actionable
        ? `addressing ${first.title.toLowerCase()}`
        : 'building more history'
      : 'collecting more data';
    summary = `Early stages. Score: ${score}/100. Start by ${nextStep}.`;
  }

  return {
    summary,
    confidence,
    score,
    insightsCount: {
      total: allInsights.length,
      strengths,
      warnings,
    },
  };
}