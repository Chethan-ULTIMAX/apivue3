import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfileSnapshots, useTrackedProfiles } from '@/hooks/use-profiles';
import {
  generateAICoachSession,
  getAIShortSummary,
  type AIInsight,
  type AIRecommendation,
  type InsightSeverity,
} from '@/lib/analytics/ai-insights';

/* ============================================================
 * Severity styling
 *
 * NOTE: `warning` is not a design token in this project, so we
 * use Tailwind's `amber` for warning tones and `orange` where a
 * slightly stronger signal is needed.
 * ============================================================ */

interface SeverityStyle {
  container: string;
  iconBg: string;
  icon: string;
  text: string;
}

const SEVERITY_STYLES: Record<InsightSeverity, SeverityStyle> = {
  critical: {
    container: 'border-destructive/30 bg-destructive/5',
    iconBg: 'bg-destructive/10',
    icon: 'text-destructive',
    text: 'text-destructive',
  },
  warning: {
    container: 'border-amber-500/30 bg-amber-500/5',
    iconBg: 'bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    container: 'border-blue-500/30 bg-blue-500/5',
    iconBg: 'bg-blue-500/10',
    icon: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
  },
  good: {
    container: 'border-emerald-500/30 bg-emerald-500/5',
    iconBg: 'bg-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  great: {
    container: 'border-violet-500/30 bg-violet-500/5',
    iconBg: 'bg-violet-500/10',
    icon: 'text-violet-600 dark:text-violet-400',
    text: 'text-violet-600 dark:text-violet-400',
  },
};

function iconForSeverity(severity: InsightSeverity) {
  switch (severity) {
    case 'critical':
      return AlertTriangle;
    case 'warning':
      return AlertCircle;
    case 'info':
      return Info;
    case 'good':
      return CheckCircle2;
    case 'great':
      return Sparkles;
  }
}

/* ============================================================
 * Insight card
 * ============================================================ */

function InsightCard({ insight }: { insight: AIInsight }) {
  const style = SEVERITY_STYLES[insight.severity];
  const Icon = iconForSeverity(insight.severity);

  return (
    <Card
      className={`border ${style.container} transition-colors hover:border-primary/40`}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
          >
            <Icon className={`h-5 w-5 ${style.icon}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-2">
              <h3 className="text-sm font-medium">{insight.title}</h3>
              {insight.actionable && (
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[10px] text-primary"
                >
                  Actionable
                </Badge>
              )}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {insight.description}
            </p>

            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/70">
              {insight.explanation}
            </p>

            {insight.suggestions && insight.suggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {insight.suggestions.map((suggestion, i) => (
                  <span
                    key={i}
                    className="rounded bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground"
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
 * Recommendation card
 * ============================================================ */

const PRIORITY_STYLES: Record<
  AIRecommendation['priority'],
  { container: string; badge: string }
> = {
  1: {
    container: 'border-destructive/30 bg-destructive/5',
    badge: 'border-destructive/30 text-destructive',
  },
  2: {
    container: 'border-amber-500/30 bg-amber-500/5',
    badge: 'border-amber-500/30 text-amber-600 dark:text-amber-400',
  },
  3: {
    container: 'border-blue-500/30 bg-blue-500/5',
    badge: 'border-blue-500/30 text-blue-600 dark:text-blue-400',
  },
};

function RecommendationCard({
  recommendation,
}: {
  recommendation: AIRecommendation;
}) {
  const style = PRIORITY_STYLES[recommendation.priority];

  return (
    <Card
      className={`border ${style.container} transition-colors hover:border-primary/40`}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-medium">{recommendation.title}</h3>
              <Badge
                variant="outline"
                className={`px-1.5 py-0.5 text-[10px] ${style.badge}`}
              >
                Priority {recommendation.priority}
              </Badge>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {recommendation.description}
            </p>

            <p className="mt-2 text-xs font-medium">
              {recommendation.action}
            </p>

            <p className="mt-1 text-xs italic text-muted-foreground/70">
              Expected impact: {recommendation.expectedImpact}
            </p>

            {recommendation.reasoning.length > 0 && (
              <details className="mt-2 text-xs text-muted-foreground">
                <summary className="cursor-pointer select-none text-[11px] uppercase tracking-wider hover:text-foreground">
                  Why this recommendation?
                </summary>
                <ul className="mt-2 list-inside list-disc space-y-1 pl-2">
                  {recommendation.reasoning.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
 * Score indicator
 * ============================================================ */

function scoreTone(score: number): {
  text: string;
  bg: string;
  ring: string;
} {
  if (score >= 80)
    return {
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      ring: 'text-emerald-500',
    };
  if (score >= 60)
    return {
      text: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-500/10',
      ring: 'text-cyan-500',
    };
  if (score >= 40)
    return {
      text: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10',
      ring: 'text-violet-500',
    };
  if (score >= 20)
    return {
      text: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-500/10',
      ring: 'text-orange-500',
    };
  return {
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    ring: 'text-destructive',
  };
}

function confidenceText(confidence: 'low' | 'medium' | 'high'): string {
  switch (confidence) {
    case 'high':
      return 'High confidence — substantial history available';
    case 'medium':
      return 'Medium confidence — limited history available';
    case 'low':
      return 'Low confidence — more data needed';
  }
}

function ScoreIndicator({
  score,
  confidence,
}: {
  score: number;
  confidence: 'low' | 'medium' | 'high';
}) {
  const tone = scoreTone(score);
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <Card className="border-border bg-card/60">
      <CardContent className="p-5 text-center">
        <p className="text-xs text-muted-foreground">Health score</p>

        <div
          className={`mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-transparent ${tone.bg}`}
        >
          <span className={`text-4xl font-bold tabular-nums ${tone.text}`}>
            {clampedScore}
          </span>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {confidenceText(confidence)}
        </p>

        <p className="mt-2 max-w-xs text-[11px] text-muted-foreground/80">
          Derived from your real profiles, snapshots, activity, and trends.
        </p>
      </CardContent>
    </Card>
  );
}

/* ============================================================
 * Loading skeleton
 * ============================================================ */

function AIInsightsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * Filter controls
 * ============================================================ */

type FilterId = 'all' | 'strengths' | 'warnings';

function FilterControls({
  activeFilter,
  onFilterChange,
  counts,
}: {
  activeFilter: FilterId;
  onFilterChange: (filter: FilterId) => void;
  counts: { all: number; strengths: number; warnings: number };
}) {
  const filters: Array<{ id: FilterId; label: string; count: number }> = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'strengths', label: 'Strengths', count: counts.strengths },
    {
      id: 'warnings',
      label: 'Areas to improve',
      count: counts.warnings,
    },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {filters.map((f) => (
        <Button
          key={f.id}
          variant={activeFilter === f.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(f.id)}
          className="h-8 gap-1.5 whitespace-nowrap"
        >
          {f.label}
          <span
            className={`text-xs ${
              activeFilter === f.id
                ? 'text-primary-foreground/80'
                : 'text-muted-foreground'
            }`}
          >
            ({f.count})
          </span>
        </Button>
      ))}
    </div>
  );
}

/* ============================================================
 * Empty state
 * ============================================================ */

function AIInsightsEmptyState() {
  return (
    <Card className="relative overflow-hidden border-violet-500/30 bg-gradient-to-br from-violet-500/[0.04] via-card to-card">
      <CardContent className="relative p-6 sm:p-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
              <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              AI guidance is ready when you are
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              AI insights become available once you have real activity
              history from connected platforms. All analysis is based on
              your actual data — never estimated or fabricated.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/dashboard/integrations">
                <Button className="gap-2">
                  Connect a platform
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/dashboard/progress">
                <Button variant="outline" className="gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  View progress
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-5 lg:w-80">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              What AI will analyze
            </p>

            <div className="mt-4 space-y-3">
              {[
                'Your real activity patterns',
                'Progress trends from actual data',
                'Consistency and streaks',
                'Category coverage',
                'Actionable recommendations',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
 * Main
 * ============================================================ */

export function AIInsightsView() {
  const profilesQuery = useTrackedProfiles();
  const snapshotsQuery = useProfileSnapshots();

  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  const profiles = profilesQuery.data ?? [];
  const snapshots = snapshotsQuery.data ?? [];
  const isLoading = profilesQuery.isLoading || snapshotsQuery.isLoading;
  const error = (profilesQuery.error ?? snapshotsQuery.error) as Error | null;

  /* ---------- Derived data ---------- */

  const aiSummary = useMemo(
    () => getAIShortSummary(profiles, snapshots),
    [profiles, snapshots],
  );

  const aiSession = useMemo(
    () => generateAICoachSession(profiles, snapshots),
    [profiles, snapshots],
  );

  const filteredInsights = useMemo<AIInsight[]>(() => {
    const all = aiSession.insights;
    if (activeFilter === 'strengths') {
      return all.filter(
        (i) => i.severity === 'great' || i.severity === 'good',
      );
    }
    if (activeFilter === 'warnings') {
      return all.filter(
        (i) => i.severity === 'warning' || i.severity === 'critical',
      );
    }
    return all;
  }, [aiSession.insights, activeFilter]);

  const insightsByCategory = useMemo<Record<string, AIInsight[]>>(() => {
    const groups: Record<string, AIInsight[]> = {};
    for (const insight of filteredInsights) {
      const list = groups[insight.category] ?? [];
      list.push(insight);
      groups[insight.category] = list;
    }
    return groups;
  }, [filteredInsights]);

  const hasData = profiles.length > 0 || snapshots.length > 0;

  /* ---------- Error state ---------- */

  if (error) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold">AI Insights</h1>
        <p className="text-sm text-muted-foreground">
          Turn your activity into understanding
        </p>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-destructive/60" />
            <p className="mt-3 text-sm font-medium text-destructive">
              Could not load AI insights
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error.message}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => {
                profilesQuery.refetch();
                snapshotsQuery.refetch();
              }}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------- Loading state ---------- */

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <AIInsightsSkeleton />
      </div>
    );
  }

  /* ---------- Main render ---------- */

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-48 top-0 h-[400px] w-[400px] rounded-full bg-orange-500/[0.05] blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-[500px] w-[500px] rounded-full bg-violet-500/[0.05] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300"
              >
                <Brain className="mr-1.5 h-3 w-3" />
                AI Coach
              </Badge>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Intelligent guidance
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              AI-powered insights derived exclusively from your real APIVue
              data. No estimates, no fabrications — just intelligent
              analysis of your actual digital activity.
            </p>
          </div>
        </header>

        {/* Summary */}
        <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <ScoreIndicator
            score={aiSummary.score}
            confidence={aiSummary.confidence}
          />

          <Card className="border-border bg-card/60">
            <CardContent className="p-5">
              <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                Overall assessment
              </p>

              <p className="text-lg font-medium">
                {aiSession.overallAssessment.strength}
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {aiSession.overallAssessment.areasForImprovement.length > 0 ? (
                  <>
                    Focus areas:{' '}
                    {aiSession.overallAssessment.areasForImprovement.map(
                      (area, i) => (
                        <span key={area} className="font-medium text-foreground">
                          {i > 0 ? ' · ' : ''}
                          {area}
                        </span>
                      ),
                    )}
                  </>
                ) : (
                  <>No areas needing immediate attention.</>
                )}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Profiles</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {aiSession.dataSummary.profiles}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Snapshots</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {aiSession.dataSummary.snapshots}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Streak</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {aiSession.dataSummary.streak}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Filters */}
        {hasData && (
          <FilterControls
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={{
              all: aiSummary.insightsCount.total,
              strengths: aiSummary.insightsCount.strengths,
              warnings: aiSummary.insightsCount.warnings,
            }}
          />
        )}

        {/* Insights */}
        <section className="space-y-8">
          {!hasData ? (
            <AIInsightsEmptyState />
          ) : filteredInsights.length === 0 ? (
            <Card className="border-border bg-card/60 text-center">
              <CardContent className="p-8">
                <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">
                  No insights for this filter
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different filter or collect more data.
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(insightsByCategory).map(
              ([category, categoryInsights]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold capitalize">
                      {category}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      ({categoryInsights.length})
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {categoryInsights.map((insight) => (
                      <InsightCard key={insight.id} insight={insight} />
                    ))}
                  </div>
                </div>
              ),
            )
          )}
        </section>

        {/* Recommendations */}
        {aiSession.recommendations.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">
                AI Coach recommendations
              </h2>
              <p className="text-xs text-muted-foreground">
                Priority actions based on your data
              </p>
            </div>

            <div className="grid gap-3">
              {aiSession.recommendations.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>

            <Card className="border-border bg-card/60">
              <CardContent className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>
                  All recommendations are generated from your real APIVue
                  data. The AI layer only interprets what already exists.
                </span>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/progress">
            <Button size="sm" variant="outline">
              View detailed progress
              <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link to="/dashboard/analytics">
            <Button size="sm" variant="outline">
              Deep analytics
              <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link to="/dashboard/goals">
            <Button size="sm" variant="outline">
              Set goals
              <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}