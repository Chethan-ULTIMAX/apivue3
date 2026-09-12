import { useMemo, useState } from 'react';
import {
  Check,
  Lightbulb,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useUpdateGoal,
} from '@/hooks/use-goals';
import {
  useProfileSnapshots,
  useTrackedProfiles,
} from '@/hooks/use-profiles';
import {
  calculateAllGoalsProgress,
  generateGoalActions,
  getGoalsSummary,
  suggestNewGoals,
  type GoalAction,
  type GoalProgress,
} from '@/lib/analytics/goals';
import { toast } from '@/hooks/use-toast';

/* ============================================================
 * Status grouping
 *
 * GoalProgress.status values are:
 *   'on-track' | 'behind' | 'completed' | 'paused' | 'cancelled'
 *
 * Group them into display buckets for the UI.
 * ============================================================ */

type StatusBucket =
  | 'completed'
  | 'on-track'
  | 'behind'
  | 'paused'
  | 'cancelled';

const BUCKETS: StatusBucket[] = [
  'completed',
  'on-track',
  'behind',
  'paused',
  'cancelled',
];

function groupByStatus(progress: GoalProgress[]): Record<StatusBucket, GoalProgress[]> {
  const grouped: Record<StatusBucket, GoalProgress[]> = {
    completed: [],
    'on-track': [],
    behind: [],
    paused: [],
    cancelled: [],
  };
  for (const g of progress) {
    grouped[g.status].push(g);
  }
  return grouped;
}

/* ============================================================
 * Action styling
 * ============================================================ */

const ACTION_STYLES: Record<
  GoalAction['type'],
  { container: string; icon: string; badge: string; emoji: string }
> = {
  celebrate: {
    container: 'border-emerald-500/30 bg-emerald-500/[0.05]',
    icon: 'text-emerald-600 dark:text-emerald-400',
    badge: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    emoji: '🎉',
  },
  warn: {
    container: 'border-destructive/30 bg-destructive/[0.05]',
    icon: 'text-destructive',
    badge: 'border-destructive/30 text-destructive',
    emoji: '⚠️',
  },
  encourage: {
    container: 'border-cyan-500/30 bg-cyan-500/[0.05]',
    icon: 'text-cyan-600 dark:text-cyan-400',
    badge: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400',
    emoji: '💪',
  },
  suggest: {
    container: 'border-blue-500/30 bg-blue-500/[0.05]',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'border-blue-500/30 text-blue-600 dark:text-blue-400',
    emoji: '💡',
  },
};

/* ============================================================
 * Main view
 * ============================================================ */

export function GoalsView() {
  const goalsQuery = useGoals();
  const profilesQuery = useTrackedProfiles();
  const snapshotsQuery = useProfileSnapshots();

  const createGoal = useCreateGoal();
  const deleteGoal = useDeleteGoal();

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const goals = goalsQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const snapshots = snapshotsQuery.data ?? [];

  const isLoading =
    goalsQuery.isLoading ||
    profilesQuery.isLoading ||
    snapshotsQuery.isLoading;
  const error = goalsQuery.error as Error | null;
  const hasData = profiles.length > 0 || snapshots.length > 0;

  /* ---------- Derived data ---------- */

  const goalsProgress = useMemo(
    () => calculateAllGoalsProgress(goals, profiles, snapshots),
    [goals, profiles, snapshots],
  );

  const summary = useMemo(
    () => getGoalsSummary(goalsProgress),
    [goalsProgress],
  );

  const goalActions = useMemo(
    () => generateGoalActions(goalsProgress),
    [goalsProgress],
  );

  const suggestions = useMemo(
    () => suggestNewGoals(profiles, snapshots, goals),
    [profiles, snapshots, goals],
  );

  const grouped = useMemo(
    () => groupByStatus(goalsProgress),
    [goalsProgress],
  );

  /* ---------- Create ---------- */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    try {
      await createGoal.mutateAsync({
        title: title.trim(),
        target_value: target ? Number(target) : null,
        unit: unit.trim() || undefined,
      });
      setTitle('');
      setTarget('');
      setUnit('');
      toast({ title: 'Goal created' });
    } catch (err) {
      toast({
        title: 'Could not create goal',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  /* ---------- Delete ---------- */

  const handleDelete = (id: string, goalTitle: string) => {
    if (!window.confirm(`Delete "${goalTitle}"? This cannot be undone.`)) {
      return;
    }
    deleteGoal.mutate(id, {
      onSuccess: () => toast({ title: 'Goal deleted' }),
      onError: (err) =>
        toast({
          title: 'Could not delete goal',
          description: (err as Error).message,
          variant: 'destructive',
        }),
    });
  };

  /* ---------- Prefill from suggestion ---------- */

  const applySuggestion = (s: {
    title: string;
    target_value: number;
    unit: string;
  }) => {
    setTitle(s.title);
    setTarget(String(s.target_value));
    setUnit(s.unit);
    setShowSuggestions(false);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  /* ---------- Render ---------- */

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track objectives using your real progress data.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <SummaryTile label="Total goals" value={summary.total} />
        <SummaryTile
          label="Completed"
          value={summary.completed}
          tone="emerald"
        />
        <SummaryTile
          label="On track"
          value={summary.onTrack}
          tone="cyan"
        />
        <SummaryTile
          label="Behind schedule"
          value={summary.behind}
          tone="orange"
        />
        <SummaryTile
          label="Avg progress"
          value={`${summary.averageProgress}%`}
        />
      </div>

      {/* States */}
      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-destructive">
              Could not load goals
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error.message}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => goalsQuery.refetch()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-32 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-2 w-48 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
          <Target className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No goals yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a goal to start measuring progress against your real
            activity.
          </p>
          {hasData && (
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => setShowSuggestions(true)}
            >
              <Lightbulb className="mr-2 h-3.5 w-3.5" />
              Get suggestions
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Goal groups */}
          {BUCKETS.map((bucket) => {
            const items = grouped[bucket];
            if (items.length === 0) return null;

            const heading =
              bucket === 'completed'
                ? 'Completed'
                : bucket === 'on-track'
                  ? 'On track'
                  : bucket === 'behind'
                    ? 'Needs attention'
                    : bucket === 'paused'
                      ? 'Paused'
                      : 'Cancelled';

            const headingColor =
              bucket === 'completed'
                ? 'text-emerald-600 dark:text-emerald-400'
                : bucket === 'behind'
                  ? 'text-orange-600 dark:text-orange-400'
                  : bucket === 'on-track'
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-muted-foreground';

            return (
              <section key={bucket} className="space-y-3">
                <h2
                  className={`flex items-center gap-2 text-lg font-semibold ${headingColor}`}
                >
                  {bucket === 'completed' ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <TrendingUp className="h-5 w-5" />
                  )}
                  {heading}
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((g) => (
                    <GoalCard
                      key={g.goal.id}
                      goalProgress={g}
                      onDelete={() => handleDelete(g.goal.id, g.goal.title)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}

      {/* Goal actions */}
      {goalActions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Signals</h2>
          {goalActions.map((action) => {
            const style = ACTION_STYLES[action.type];
            return (
              <Card key={action.id} className={`border ${style.container}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/60 text-lg">
                      <span aria-hidden="true">{style.emoji}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium">{action.title}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {action.description}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-2 px-1.5 py-0.5 text-[10px] ${style.badge}`}
                      >
                        Priority {action.priority}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="border-border bg-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Suggested goals based on your activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.title}-${index}`}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="rounded-lg border border-border bg-muted/30 p-4 text-left transition-colors hover:bg-muted/60"
                >
                  <p className="text-sm font-medium">{suggestion.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {suggestion.description}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    {suggestion.reasoning}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showSuggestions && suggestions.length === 0 && hasData && (
        <Card className="border-dashed border-border bg-card/40">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No new goal suggestions based on your current data.
          </CardContent>
        </Card>
      )}

      {/* Create goal form */}
      <Card className="border-border bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Create a goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid gap-3 sm:grid-cols-[1fr_120px_120px_auto] sm:items-end"
          >
            <div className="space-y-1">
              <Label htmlFor="goal-title">Goal</Label>
              <Input
                id="goal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Solve 50 problems"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="goal-target">Target</Label>
              <Input
                id="goal-target"
                type="number"
                min="0"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="50"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="goal-unit">Unit</Label>
              <Input
                id="goal-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="problems"
              />
            </div>
            <Button
              type="submit"
              disabled={createGoal.isPending || !title.trim()}
            >
              {createGoal.isPending ? 'Creating…' : 'Create'}
            </Button>
          </form>

          {hasData && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSuggestions((v) => !v)}
                className="text-xs"
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
                {showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
              </Button>
            </div>
          )}

          {createGoal.error && (
            <p className="mt-3 text-sm text-destructive">
              {(createGoal.error as Error).message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
 * Summary tile
 * ============================================================ */

function SummaryTile({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  tone?: 'default' | 'emerald' | 'cyan' | 'orange';
}) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'cyan'
        ? 'text-cyan-600 dark:text-cyan-400'
        : tone === 'orange'
          ? 'text-orange-600 dark:text-orange-400'
          : 'text-foreground';

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <p className={`text-3xl font-bold tabular-nums ${toneClass}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* ============================================================
 * Goal card
 * ============================================================ */

function GoalCard({
  goalProgress,
  onDelete,
}: {
  goalProgress: GoalProgress;
  onDelete: () => void;
}) {
  const updateGoal = useUpdateGoal();

  const progress = Math.max(
    0,
    Math.min(100, Math.round(goalProgress.progressPercentage)),
  );
  const isCompleted = goalProgress.status === 'completed';
  const isBehind = goalProgress.status === 'behind';

  const containerClass = isCompleted
    ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
    : isBehind
      ? 'border-orange-500/30 bg-orange-500/[0.04]'
      : 'border-border bg-card';

  const barClass = isCompleted
    ? 'bg-emerald-500'
    : isBehind
      ? 'bg-orange-500'
      : 'bg-primary';

  const progressTextClass = isCompleted
    ? 'text-emerald-600 dark:text-emerald-400'
    : isBehind
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-primary';

  const handleComplete = () => {
    updateGoal.mutate(
      { id: goalProgress.goal.id, status: 'completed' },
      {
        onSuccess: () => toast({ title: 'Goal marked complete' }),
        onError: (err) =>
          toast({
            title: 'Could not update goal',
            description: (err as Error).message,
            variant: 'destructive',
          }),
      },
    );
  };

  return (
    <Card className={`border ${containerClass} transition-colors`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="min-w-0">
          <CardTitle className="text-base">
            {goalProgress.goal.title}
          </CardTitle>

          <p className="mt-1 text-xs text-muted-foreground">
            {goalProgress.currentValue.toLocaleString()}
            {goalProgress.targetValue !== null
              ? ` / ${goalProgress.targetValue.toLocaleString()}`
              : ''}
            {goalProgress.unit ? ` ${goalProgress.unit}` : ''}
          </p>

          {goalProgress.daysRemaining !== undefined && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {goalProgress.daysRemaining > 0
                ? `${goalProgress.daysRemaining} day${
                    goalProgress.daysRemaining === 1 ? '' : 's'
                  } remaining`
                : goalProgress.daysRemaining === 0
                  ? 'Due today'
                  : `${Math.abs(goalProgress.daysRemaining)} day${
                      Math.abs(goalProgress.daysRemaining) === 1 ? '' : 's'
                    } overdue`}
            </p>
          )}
        </div>

        <button
          type="button"
          title="Delete goal"
          onClick={onDelete}
          className="text-muted-foreground transition-colors hover:text-destructive"
          aria-label={`Delete ${goalProgress.goal.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress bar */}
        {goalProgress.targetValue !== null ? (
          <div>
            <div className="mb-1 flex justify-between text-[10px]">
              <span className="text-muted-foreground">Progress</span>
              <span className={`font-medium ${progressTextClass}`}>
                {progress}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${barClass}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {goalProgress.trend !== 'insufficient-data' && (
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>Trend: {goalProgress.trend}</span>
                <span>Status: {goalProgress.status}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Set a target to measure progress.
          </p>
        )}

        {/* Recommendation */}
        {goalProgress.recommendations.length > 0 && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {goalProgress.recommendations[0]}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Completed
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleComplete}
              disabled={updateGoal.isPending}
            >
              {updateGoal.isPending ? 'Saving…' : 'Mark complete'}
            </Button>
          )}
        </div>

        {/* Related metrics */}
        {goalProgress.relatedMetrics.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Related metrics
            </p>
            <div className="flex flex-wrap gap-2">
              {goalProgress.relatedMetrics.map((m, i) => {
                const displayValue =
                  typeof m.value === 'number'
                    ? m.value.toLocaleString()
                    : m.value;

                return (
                  <span
                    key={`${m.label}-${i}`}
                    className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {m.label}: {displayValue}
                    {m.change !== undefined && (
                      <span
                        className={
                          m.change > 0
                            ? 'ml-1 text-emerald-600 dark:text-emerald-400'
                            : m.change < 0
                              ? 'ml-1 text-destructive'
                              : 'ml-1'
                        }
                      >
                        ({m.change > 0 ? '+' : ''}
                        {m.change})
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}