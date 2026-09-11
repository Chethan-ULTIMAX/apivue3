import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Check, ChevronRight, Info, Lightbulb, Target, TrendingUp, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfileSnapshots, useTrackedProfiles } from "@/hooks/use-profiles";
import { buildProgressReport } from "@/lib/analytics/progress";
import { generateAICoachSession, getAIShortSummary } from "@/lib/analytics/ai-insights";

/**
 * Severity level styling
 */
const severityStyles: Record<string, { container: string; icon: string; text: string }> = {
  critical: {
    container: "border-destructive/20 bg-destructive/5",
    icon: "text-destructive",
    text: "text-destructive",
  },
  warning: {
    container: "border-warning/20 bg-warning/5",
    icon: "text-warning",
    text: "text-warning",
  },
  info: {
    container: "border-blue-500/20 bg-blue-500/5",
    icon: "text-blue-400",
    text: "text-blue-400",
  },
  good: {
    container: "border-emerald-500/20 bg-emerald-500/5",
    icon: "text-emerald-400",
    text: "text-emerald-400",
  },
  great: {
    container: "border-violet-500/20 bg-violet-500/5",
    icon: "text-violet-400",
    text: "text-violet-400",
  },
};

/**
 * Actionable Insight Card component
 */
function InsightCard({
  insight,
  index,
}: {
  insight: any;
  index: number;
}) {
  const style = severityStyles[insight.severity] ?? severityStyles.info;
  const Icon = insight.severity === 'critical' ? X :
               insight.severity === 'warning' ? TrendingUp :
               insight.severity === 'great' ? Check :
               Lightbulb;

  return (
    <Card className={`border-border/70 ${style.container} transition-colors hover:border-primary/40`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.container}`}>
            <Icon className={`h-5 w-5 ${style.icon}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h3 className="text-sm font-medium">{insight.title}</h3>
              {insight.actionable && (
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/5 text-primary text-[10px] px-1.5 py-0.5"
                >
                  Actionable
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{insight.description}</p>
            <p className="mt-2 text-xs text-muted-foreground/70 line-clamp-2">{insight.explanation}</p>
            {insight.suggestions && insight.suggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {insight.suggestions.map((suggestion: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs bg-muted/50 px-2 py-1 rounded text-muted-foreground"
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

/**
 * Recommendation Card component
 */
function RecommendationCard({
  recommendation,
  index,
}: {
  recommendation: any;
  index: number;
}) {
  const priorityColors: Record<number, string> = {
    1: "border-destructive/20 bg-destructive/5",
    2: "border-warning/20 bg-warning/5",
    3: "border-blue-500/20 bg-blue-500/5",
  };
  
  const style = priorityColors[recommendation.priority] ?? priorityColors[3];

  return (
    <Card className={`border-border/70 ${style} transition-colors hover:border-primary/40`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium">{recommendation.title}</h3>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0.5 ${
                  recommendation.priority === 1 ? 'border-destructive/30 text-destructive' :
                  recommendation.priority === 2 ? 'border-warning/30 text-warning' :
                  'border-blue-500/30 text-blue-400'
                }`}
              >
                Priority {recommendation.priority}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{recommendation.description}</p>
            <p className="mt-2 text-xs font-medium">{recommendation.action}</p>
            <p className="mt-1 text-xs text-muted-foreground/70 italic">
              Expected: {recommendation.expectedImpact}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Score indicator component
 */
function ScoreIndicator({
  score,
  confidence,
}: {
  score: number;
  confidence: 'low' | 'medium' | 'high';
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10";
    if (score >= 60) return "text-cyan-400 bg-cyan-500/10";
    if (score >= 40) return "text-violet-400 bg-violet-500/10";
    if (score >= 20) return "text-orange-400 bg-orange-500/10";
    return "text-destructive bg-destructive/10";
  };

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'High confidence - Based on substantial history';
      case 'medium': return 'Medium confidence - Limited history available';
      case 'low': return 'Low confidence - More data needed';
      default: return 'Building confidence';
    }
  };

  return (
    <Card className="border-border/70 bg-card/40">
      <CardContent className="p-5 text-center">
        <div className="relative inline-block">
          <span className="text-xs text-muted-foreground">Score</span>
          <div
            className={`mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-2xl border ${getScoreColor(score)}`}
          >
            <span className={`text-4xl font-bold ${getScoreColor(score).split(' ')[0]}`}>
              {score}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{getConfidenceText(confidence)}</p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground max-w-md">
          Based on your real APIVue data: profiles, snapshots, activity, and trends
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for AI insights
 */
function AIInsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-6 w-48" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

/**
 * Filter controls for insights
 */
function FilterControls({
  activeFilter,
  onFilterChange,
  counts,
}: {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: Record<string, number>;
}) {
  const filters = [
    { id: 'all', label: 'All', count: counts.total },
    { id: 'strengths', label: 'Strengths', count: counts.strengths },
    { id: 'warnings', label: 'Areas to improve', count: counts.warnings },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className="h-8 gap-1.5 whitespace-nowrap"
        >
          {filter.label}
          <span className="text-xs text-muted-foreground">
            ({filter.count})
          </span>
        </Button>
      ))}
    </div>
  );
}

export function AIInsightsView() {
  const profilesQuery = useTrackedProfiles();
  const snapshotsQuery = useProfileSnapshots();
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [showRecommendations, setShowRecommendations] = useState(true);

  const profiles = profilesQuery.data ?? [];
  const snapshots = snapshotsQuery.data ?? [];
  const isLoading = profilesQuery.isLoading || snapshotsQuery.isLoading;
  const error = profilesQuery.error ?? snapshotsQuery.error;

  const aiSummary = useMemo(() => {
    return getAIShortSummary(profiles, snapshots);
  }, [profiles, snapshots]);

  const aiSession = useMemo(() => {
    return generateAICoachSession(profiles, snapshots);
  }, [profiles, snapshots]);

  const filteredInsights = useMemo(() => {
    let insights = aiSession.insights;
    
    if (activeFilter === 'strengths') {
      insights = insights.filter(
        (i) => i.severity === 'great' || i.severity === 'good'
      );
    } else if (activeFilter === 'warnings') {
      insights = insights.filter(
        (i) => i.severity === 'warning' || i.severity === 'critical'
      );
    }
    
    return insights;
  }, [aiSession.insights, activeFilter]);

  const insightsByCategory = useMemo(() => {
    const categories: Record<string, any[]> = {};
    filteredInsights.forEach((insight) => {
      if (!categories[insight.category]) {
        categories[insight.category] = [];
      }
      categories[insight.category].push(insight);
    });
    return categories;
  }, [filteredInsights]);

  const hasData = profiles.length > 0 || snapshots.length > 0;

  if (error) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl font-bold">AI Insights</h1>
        <p className="text-sm text-muted-foreground">
          Turn your activity into understanding
        </p>
        
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <Brain className="mx-auto h-8 w-8 text-destructive/40" />
            <p className="mt-3 text-sm font-medium text-destructive">
              Could not load AI insights
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => { profilesQuery.refetch(); snapshotsQuery.refetch(); }}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <AIInsightsSkeleton />
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-48 top-0 h-[400px] w-[400px] rounded-full bg-orange-600/[0.04] blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-[500px] w-[500px] rounded-full bg-violet-600/[0.05] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="flex justify-between items-start gap-5">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-violet-500/20 bg-violet-500/[0.05] text-violet-300"
              >
                <Brain className="mr-1.5 h-3 w-3" />
                AI Coach
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Intelligent guidance
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              AI-powered insights derived exclusively from your real APIVue data. 
              No estimates, no fabrications — just intelligent analysis of your actual digital activity.
            </p>
          </div>
        </header>

        {/* Quick Summary */}
        <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <ScoreIndicator score={aiSummary.score} confidence={aiSummary.confidence} />
          
          <Card className="border-border/70 bg-card/40">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground mb-2">Overall assessment</div>
              <p className="text-lg font-medium">{aiSession.overallAssessment.strength}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {aiSession.overallAssessment.areasForImprovement.length > 0 ? (
                  <>
                    Focus on: {
                      aiSession.overallAssessment.areasForImprovement.map((area, i) => (
                        <span key={i} className="font-medium text-foreground">
                          {i > 0 ? ', ' : ''}{area}
                        </span>
                      ))
                    }
                  </>
                ) : (
                  <>No areas needing immediate attention</>
                )}
              </p>
              
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Profiles</p>
                  <p className="text-xl font-semibold">{aiSession.dataSummary.profiles}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Snapshots</p>
                  <p className="text-xl font-semibold">{aiSession.dataSummary.snapshots}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Streak</p>
                  <p className="text-xl font-semibold">{aiSession.dataSummary.streak}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Filters */}
        <FilterControls
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={{
            total: aiSummary.insightsCount.total,
            strengths: aiSummary.insightsCount.strengths,
            warnings: aiSummary.insightsCount.warnings,
          }}
        />

        {/* Insights by category */}
        <section className="space-y-8">
          {hasData ? (
            filteredInsights.length > 0 ? (
              Object.entries(insightsByCategory).map(([category, categoryInsights]) => (
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
                    {categoryInsights.map((insight, index) => (
                      <InsightCard key={insight.id} insight={insight} index={index} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <Card className="border-border/70 bg-card/40 text-center">
                <CardContent className="p-8">
                  <Lightbulb className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-3 text-sm font-medium">
                    No insights for this filter
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a different filter or collect more data
                  </p>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="relative overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-card/70 to-card/50">
              <CardContent className="relative p-6 sm:p-8">
                <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="max-w-2xl">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                      <Brain className="h-5 w-5 text-violet-300" />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold">
                      AI guidance is ready when you are
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      AI insights become available once you have real activity history 
                      from connected platforms. All analysis is based on your actual data 
                      — never estimated or fabricated.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link to="/dashboard/integrations">
                        <Button className="gap-2 bg-white text-black hover:bg-zinc-200">
                          Connect a platform
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to="/dashboard/progress">
                        <Button
                          variant="outline"
                          className="gap-2 border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                        >
                          <TrendingUp className="h-4 w-4 text-violet-300" />
                          View progress
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-black/20 p-5 lg:w-80">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      What AI will analyze
                    </p>
                    <div className="mt-4 space-y-3">
                      {[
                        `Your real activity patterns`,
                        `Progress trends from actual data`,
                        `Consistency and streaks`,
                        `Category coverage`,
                        `Actionable recommendations`,
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-400/80" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Recommendations */}
        {showRecommendations && aiSession.recommendations.length > 0 && (
          <section className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold">AI Coach Recommendations</h2>
                <p className="text-xs text-muted-foreground">
                  Priority actions based on your data
                </p>
              </div>
            </div>
            <div className="grid gap-3">
              {aiSession.recommendations.map((rec, index) => (
                <RecommendationCard key={rec.id} recommendation={rec} index={index} />
              ))}
            </div>
            <Card className="border-border/70 bg-card/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  <span>
                    All recommendations are generated from your real APIVue data. 
                    The AI layer only interprets what already exists.
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/progress">
            <Button size="sm" variant="outline">
              View detailed progress
              <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
          <Link to="/dashboard/analytics">
            <Button size="sm" variant="outline">
              Deep analytics
              <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
          <Link to="/dashboard/goals">
            <Button size="sm" variant="outline">
              Set goals
              <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
