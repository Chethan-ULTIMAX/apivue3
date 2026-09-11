/**
 * APIVue AI Insights Engine
 * 
 * This module provides deterministic, data-driven insights and recommendations
 * based on real user activity, progress, and historical data from APIVue.
 * 
 * IMPORTANT: All insights MUST be derived from actual collected data.
 * No fabricated, estimated, or invented statistics are allowed.
 */

import type {
  ProfileSnapshot,
  TrackedProfile,
} from '@/lib/integrations/registry';
import {
  buildProgressReport,
  type ProgressReport,
} from './progress';
import { getIntegration } from '@/lib/integrations/registry';

/**
 * AI Insight categories
 */
export type InsightCategory = 
  | 'progress'
  | 'activity'
  | 'goals'
  | 'trends'
  | 'patterns'
  | 'recommendations'
  | 'warnings';

/**
 * Severity levels for insights
 */
export type InsightSeverity = 'info' | 'good' | 'great' | 'warning' | 'critical';

/**
 * AI Insight structure - deterministic and traceable
 */
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

/**
 * AI recommendation with specific next actions
 */
export interface AIRecommendation {
  id: string;
  type: 'daily' | 'weekly' | 'improvement' | 'goal' | 'maintenance';
  priority: 1 | 2 | 3; // 1 = highest
  title: string;
  description: string;
  reasoning: string[];
  action: string;
  expectedImpact: string;
  basedOn: string[]; // IDs of insights this recommendation is based on
}

/**
 * AI Coach session - structured analysis of user's digital life
 */
export interface AISession {
  id: string;
  generatedAt: string;
  dataSummary: {
    profiles: number;
    snapshots: number;
    historyDays: number;
    events: number;
    streak: number;
    goals: number;
  };
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  overallAssessment: {
    strength: string;
    areasForImprovement: string[];
    score: number; // 0-100 based on real data
    confidence: 'low' | 'medium' | 'high';
  };
}

/**
 * Calculate a confidence score based on data availability
 */
function calculateConfidence(profiles: TrackedProfile[], snapshots: ProfileSnapshot[]): 'low' | 'medium' | 'high' {
  const profileCount = profiles.length;
  const snapshotCount = snapshots.length;
  
  if (profileCount === 0) return 'low';
  if (snapshotCount < 3) return 'low';
  if (snapshotCount < 10) return 'medium';
  return 'high';
}

/**
 * Calculate overall score from real activity data
 */
function calculateOverallScore(report: ProgressReport): number {
  if (report.profileCount === 0) return 0;
  
  let score = 0;
  let totalWeight = 0;
  
  // Activity score (40% weight)
  if (report.activity.totalEvents > 0) {
    const activityEvents = Math.min(report.activity.totalEvents, 100);
    score += (activityEvents / 100) * 40;
    totalWeight += 40;
  }
  
  // Progress score (30% weight) - based on positive trends
  const positiveTrends = report.trends.filter(t => t.change > 0).length;
  if (positiveTrends > 0) {
    score += Math.min((positiveTrends / Math.max(report.trends.length, 1)) * 100, 100) * 0.3;
    totalWeight += 30;
  }
  
  // Consistency score (30% weight)
  if (report.activity.currentStreak > 0 || report.activity.longestStreak > 0) {
    const consistencyRatio = Math.min(
      ((report.activity.currentStreak + report.activity.longestStreak) / 2) / 30,
      1
    );
    score += consistencyRatio * 30;
    totalWeight += 30;
  }
  
  return totalWeight > 0 ? Math.round(score) : 0;
}

/**
 * Generate strengthen insights based on real progress data
 */
function generateStrengthInsights(report: ProgressReport): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Insight for positive trends
  const positiveTrends = report.trends.filter(t => t.change > 0);
  if (positiveTrends.length > 0) {
    positiveTrends.slice(0, 3).forEach(trend => {
      insights.push({
        id: `strength-${trend.profileId}-${trend.metricKey}`,
        category: 'progress',
        severity: 'great',
        title: `Growth in ${trend.label}`,
        description: `Your ${trend.label} has improved by ${trend.change > 0 ? '+' : ''}${trend.change.toLocaleString()}`,
        explanation: `This metric has grown from ${trend.first.value.toLocaleString()} to ${trend.latest.value.toLocaleString()} over ${trend.points.length} recorded points.`,
        evidence: {
          metric: trend.metricKey,
          from: trend.first.value,
          to: trend.latest.value,
          change: trend.change,
          points: trend.points.length,
        },
        actionable: false,
        suggestions: [`Continue tracking ${trend.label} regularly`, `Set a goal related to this improvement`],
        timestamp: new Date().toISOString(),
      });
    });
  }
  
  // Insight for long streaks
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
      suggestions: ['Maintain this consistency', 'Set goals to extend your streak'],
      timestamp: new Date().toISOString(),
    });
  }
  
  // Insight for active days
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
      suggestions: ['Consider analyzing patterns in your most active periods', 'Set goals based on your activity patterns'],
      timestamp: new Date().toISOString(),
    });
  }
  
  return insights;
}

/**
 * Generate improvement insights based on real data
 */
function generateImprovementInsights(report: ProgressReport): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Insight for negative or flat trends
  const nonPositiveTrends = report.trends.filter(t => t.change <= 0);
  if (nonPositiveTrends.length > 0) {
    nonPositiveTrends.slice(0, 3).forEach(trend => {
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
          timestamp: new Date().toISOString(),
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
          timestamp: new Date().toISOString(),
        });
      }
    });
  }
  
  // Insight for low activity
  if (report.activity.activeDays === 0) {
    insights.push({
      id: 'improvement-no-activity',
      category: 'activity',
      severity: 'critical',
      title: 'No activity recorded yet',
      description: 'No events have been collected from your connected profiles',
      explanation: 'APIVue needs activity data to provide meaningful insights. Connect profiles and refresh them to start building your history.',
      evidence: {
        profiles: report.profileCount,
        snapshots: report.snapshotCount,
        events: report.activity.totalEvents,
      },
      actionable: true,
      suggestions: [
        'Connect your first profile',
        'Refresh your connected profiles to collect activity',
        ' Wait for activity data to accumulate',
      ],
      timestamp: new Date().toISOString(),
    });
  }
  
  // Insight for short history
  if (report.snapshotCount < 5 && report.profileCount > 0) {
    insights.push({
      id: 'improvement-short-history',
      category: 'progress',
      severity: 'warning',
      title: 'Limited history for analysis',
      description: `Only ${report.snapshotCount} snapshots collected`,
      explanation: `More snapshots will enable better trend analysis and more accurate insights. Refresh your profiles at different times to build history.`,
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
      timestamp: new Date().toISOString(),
    });
  }
  
  // Insight for zero streak
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
      timestamp: new Date().toISOString(),
    });
  }
  
  return insights;
}

/**
 * Generate goal-based insights
 */
function generateGoalInsights(profiles: TrackedProfile[], report: ProgressReport): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Insight for category coverage
  const coveredCategories = new Set<string>();
  for (const profile of profiles) {
    const integration = getIntegration(profile.platform);
    if (integration?.categories) {
      integration.categories.forEach((c: string) => coveredCategories.add(c));
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

/**
 * Generate pattern insights
 */
function generatePatternInsights(report: ProgressReport): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // Insight for recent activity comparison
  if (report.activity.last7 > 0 && report.activity.previous7 > 0) {
    const change = report.activity.last7 - report.activity.previous7;
    const pctChange = (change / report.activity.previous7) * 100;
    
    if (pctChange > 20) {
      insights.push({
        id: 'pattern-increased-activity',
        category: 'patterns',
        severity: 'great',
        title: `${Math.round(pctChange)}% increase in recent activity`,
        description: `Your activity has significantly increased compared to the previous week`,
        explanation: `Recent 7 days: ${report.activity.last7.toLocaleString()} events, Previous 7 days: ${report.activity.previous7.toLocaleString()} events.`,
        evidence: {
          recent: report.activity.last7,
          previous: report.activity.previous7,
          change: change,
          pctChange: Math.round(pctChange),
        },
        actionable: false,
        suggestions: ['Maintain this increased level of activity', 'Identify what drove this increase'],
        timestamp: new Date().toISOString(),
      });
    } else if (pctChange < -20) {
      insights.push({
        id: 'pattern-decreased-activity',
        category: 'patterns',
        severity: 'warning',
        title: `${Math.round(Math.abs(pctChange))}% decrease in recent activity`,
        description: `Your activity has significantly decreased compared to the previous week`,
        explanation: `Recent 7 days: ${report.activity.last7.toLocaleString()} events, Previous 7 days: ${report.activity.previous7.toLocaleString()} events.`,
        evidence: {
          recent: report.activity.last7,
          previous: report.activity.previous7,
          change: change,
          pctChange: Math.round(pctChange),
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

/**
 * Generate actionable recommendations based on insights
 */
function generateRecommendations(insights: AIInsight[], report: ProgressReport): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];
  const insightIds = new Set<string>();
  
  // Collect insight IDs
  insights.forEach(i => insightIds.add(i.id));
  
  // If no activity recorded
  if (insightIds.has('improvement-no-activity')) {
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
      expectedImpact: 'Immediate access to profile data and ability to collect activity history',
      basedOn: ['improvement-no-activity'],
    });
  }
  
  // If limited history
  if (insightIds.has('improvement-short-history')) {
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
      expectedImpact: 'More accurate trend analysis and longer-term insights',
      basedOn: ['improvement-short-history'],
    });
  }
  
  // If streak is broken
  if (insightIds.has('improvement-broken-streak')) {
    recommendations.push({
      id: 'rec-rebuild-streak',
      type: 'goal',
      priority: 2,
      title: 'Rebuild your consistency streak',
      description: 'Get back on track with daily activity',
      reasoning: [
        'Your current streak has been reset to 0',
        'You previously achieved a streak of ' + report.activity.longestStreak + ' days',
        'Consistency is a key indicator of long-term progress',
      ],
      action: 'Perform activity on your connected platforms today',
      expectedImpact: 'Rebuild streak and maintain consistency',
      basedOn: ['improvement-broken-streak'],
    });
  }
  
  // If there are positive trends, suggest setting goals
  if (insights.some(i => i.category === 'progress' && i.severity === 'great')) {
    recommendations.push({
      id: 'rec-set-goals',
      type: 'goal',
      priority: 3,
      title: 'Set goals based on your progress',
      description: 'Capitalize on your positive trends by setting specific targets',
      reasoning: [
        'You have demonstrated positive growth in multiple metrics',
        'Setting goals helps maintain focus and measure progress',
        'Goals provide direction for continued improvement',
      ],
      action: 'Create goals for metrics showing positive trends',
      expectedImpact: 'Structured approach to continued improvement',
      basedOn: insights.filter(i => i.category === 'progress' && i.severity === 'great').map(i => i.id),
    });
  }
  
  // If there are negative trends, suggest analysis
  if (insights.some(i => i.category === 'trends' && i.severity === 'warning')) {
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
      action: 'Review your activity patterns and identify factors affecting performance',
      expectedImpact: 'Identify issues and implement solutions to reverse negative trends',
      basedOn: insights.filter(i => i.category === 'trends' && i.severity === 'warning').map(i => i.id),
    });
  }
  
  return recommendations;
}

/**
 * Generate a comprehensive AI coach session from real APIVue data
 */
export function generateAICoachSession(
  profiles: TrackedProfile[],
  snapshots: ProfileSnapshot[]
): AISession {
  const report = buildProgressReport(profiles, snapshots);
  const confidence = calculateConfidence(profiles, snapshots);
  const score = calculateOverallScore(report);
  
  // Generate all types of insights
  const strengthInsights = generateStrengthInsights(report);
  const improvementInsights = generateImprovementInsights(report);
  const goalInsights = generateGoalInsights(profiles, report);
  const patternInsights = generatePatternInsights(report);
  
  const allInsights = [
    ...strengthInsights,
    ...improvementInsights,
    ...goalInsights,
    ...patternInsights,
  ].sort((a, b) => {
    // Sort by severity (critical/warning first), then by actionable
    const severityOrder = { critical: 0, warning: 1, info: 2, good: 3, great: 4 };
    return (severityOrder[b.severity] ?? 5) - (severityOrder[a.severity] ?? 5) || 
           (b.actionable ? 1 : 0) - (a.actionable ? 1 : 0);
  });
  
  const recommendations = generateRecommendations(allInsights, report);
  
  // Determine overall assessment
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  for (const insight of allInsights) {
    if (insight.severity === 'great' || insight.severity === 'good') {
      strengths.push(insight.title);
    } else if (insight.severity === 'warning' || insight.severity === 'critical') {
      improvements.push(insight.title);
    }
  }
  
  return {
    id: `session-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    dataSummary: {
      profiles: profiles.length,
      snapshots: snapshots.length,
      historyDays: report.historyDays,
      events: report.activity.totalEvents,
      streak: report.activity.currentStreak,
      goals: 0, // Will be populated when goals integration is added
    },
    insights: allInsights,
    recommendations,
    overallAssessment: {
      strength: strengths.length > 0 
        ? strengths[0]
        : improvements.length > 0 
          ? `Address ${improvements[0].toLowerCase()}`
          : 'Start building your digital history',
      areasForImprovement: improvements.slice(0, 3),
      score,
      confidence,
    },
  };
}

/**
 * Get a simple AI summary for display
 */
export function getAIShortSummary(profiles: TrackedProfile[], snapshots: ProfileSnapshot[]): {
  summary: string;
  confidence: 'low' | 'medium' | 'high';
  score: number;
  insightsCount: { total: number; strengths: number; warnings: number };
} {
  const report = buildProgressReport(profiles, snapshots);
  const confidence = calculateConfidence(profiles, snapshots);
  const score = calculateOverallScore(report);
  
  const allInsights = [
    ...generateStrengthInsights(report),
    ...generateImprovementInsights(report),
    ...generateGoalInsights(profiles, report),
    ...generatePatternInsights(report),
  ];
  
  const strengths = allInsights.filter(i => i.severity === 'great' || i.severity === 'good').length;
  const warnings = allInsights.filter(i => i.severity === 'warning' || i.severity === 'critical').length;
  
  let summary = '';
  if (profiles.length === 0) {
    summary = 'No profiles connected yet. Connect platforms to start analytical intelligence.';
  } else if (snapshots.length < 3) {
    summary = `Building your history with ${snapshots.length} snapshot${snapshots.length === 1 ? '' : 's'}. Collect at least 1 snapshot to unlock deeper insights.`;
  } else if (score >= 70) {
    summary = `Strong progress! Score: ${score}/100. Your digital activity shows ${allInsights.length} notable pattern${allInsights.length === 1 ? '' : 's'}.`;
  } else if (score >= 40) {
    summary = `Moderate progress. Score: ${score}/100. Focus on ${warnings > 0 ? warnings + ' areas needing improvement' : 'sustaining your momentum'}.`;
  } else {
    summary = `Early stages. Score: ${score}/100. Start by ${allInsights.length > 0 ? allInsights[0].actionable ? 'addressing ' + allInsights[0].title.toLowerCase() : 'building more history' : 'collecting more data'}.`;
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
