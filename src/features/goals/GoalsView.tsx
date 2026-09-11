import { useMemo, useState } from "react";
import { Check, Plus, Target, Trash2, TrendingUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal } from "@/hooks/use-goals";
import { useTrackedProfiles, useProfileSnapshots } from "@/hooks/use-profiles";
import {
  calculateAllGoalsProgress,
  generateGoalActions,
  suggestNewGoals,
  getGoalsSummary,
  type GoalProgress,
} from "@/lib/analytics/goals";

export function GoalsView() {
  const { data: goals = [], isLoading: goalsLoading, error: goalsError } = useGoals();
  const { data: profiles = [], isLoading: profilesLoading } = useTrackedProfiles();
  const { data: snapshots = [], isLoading: snapshotsLoading } = useProfileSnapshots();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isLoading = goalsLoading || profilesLoading || snapshotsLoading;
  const error = goalsError;
  const hasData = profiles.length > 0 || snapshots.length > 0;

  // Calculate goals progress using analytics
  const goalsProgress = useMemo(() => {
    return calculateAllGoalsProgress(goals, profiles, snapshots);
  }, [goals, profiles, snapshots]);

  // Get summary statistics
  const summary = useMemo(() => {
    return getGoalsSummary(goalsProgress);
  }, [goalsProgress]);

  // Get goal actions
  const goalActions = useMemo(() => {
    return generateGoalActions(goalsProgress);
  }, [goalsProgress]);

  // Get suggestions for new goals
  const suggestions = useMemo(() => {
    return suggestNewGoals(profiles, snapshots, goals);
  }, [profiles, snapshots, goals]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    await createGoal.mutateAsync({
      title: title.trim(),
      target_value: target ? Number(target) : null,
      unit: unit.trim() || undefined,
    });
    setTitle("");
    setTarget("");
    setUnit("");
  };

  // Group goals by status
  const goalsByStatus: Record<string, GoalProgress[]> = {
    completed: [],
    active: [],
    behind: [],
    paused: [],
    cancelled: [],
  };

  goalsProgress.forEach((g) => {
    const status = g.status;
    if (status in goalsByStatus) {
      goalsByStatus[status].push(g);
    } else {
      goalsByStatus.active.push(g);
    }
  });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Goals</h1>
        <p className="text-sm text-muted-foreground">Track objectives using your real progress data.</p>
      </div>

      {/* Goal summary statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">{summary.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Goals</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-emerald-400">{summary.completed}</p>
          <p className="text-xs text-muted-foreground mt-1">Completed</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-cyan-400">{summary.onTrack}</p>
          <p className="text-xs text-muted-foreground mt-1">On Track</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-orange-400">{summary.behind}</p>
          <p className="text-xs text-muted-foreground mt-1">Behind Schedule</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-muted-foreground">{summary.averageProgress}%</p>
          <p className="text-xs text-muted-foreground mt-1">Avg Progress</p>
        </div>
      </div>

      {/* Goals by status sections */}
      {goalsByStatus.completed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-400" />
              Completed
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {goalsByStatus.completed.map((g) => (
              <GoalCard key={g.goal.id} goalProgress={g} onDelete={() => deleteGoal.mutate(g.goal.id)} />
            ))}
          </div>
        </div>
      )}

      {goalsByStatus.onTrack.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              On Track
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {goalsByStatus.onTrack.map((g) => (
              <GoalCard key={g.goal.id} goalProgress={g} onDelete={() => deleteGoal.mutate(g.goal.id)} />
            ))}
          </div>
        </div>
      )}

      {goalsByStatus.behind.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-400" />
              Needs Attention
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {goalsByStatus.behind.map((g) => (
              <GoalCard key={g.goal.id} goalProgress={g} onDelete={() => deleteGoal.mutate(g.goal.id)} />
            ))}
          </div>
        </div>
      )}

      {(goalsByStatus.paused.length > 0 || goalsByStatus.cancelled.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              Inactive
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {goalsByStatus.paused.map((g) => (
              <GoalCard key={g.goal.id} goalProgress={g} onDelete={() => deleteGoal.mutate(g.goal.id)} />
            ))}
            {goalsByStatus.cancelled.map((g) => (
              <GoalCard key={g.goal.id} goalProgress={g} onDelete={() => deleteGoal.mutate(g.goal.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Goal suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="border-border bg-card/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              Suggested Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setTitle(suggestion.title);
                    setTarget(String(suggestion.target_value));
                    setUnit(suggestion.unit);
                    setShowSuggestions(false);
                  }}
                >
                  <p className="font-medium text-sm">{suggestion.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{suggestion.reasoning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal action alerts */}
      {goalActions.length > 0 && (
        <div className="space-y-3">
          {goalActions.map((action) => (
            <Card
              key={action.id}
              className={`border-border bg-card/40 ${
                action.type === 'celebrate' ? 'border-emerald-500/20 bg-emerald-500/[0.05]' :
                action.type === 'warn' ? 'border-destructive/20 bg-destructive/[0.05]' :
                action.type === 'encourage' ? 'border-cyan-500/20 bg-cyan-500/[0.05]' :
                'border-blue-500/20 bg-blue-500/[0.05]'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      action.type === 'celebrate' ? 'bg-emerald-500/10' :
                      action.type === 'warn' ? 'bg-destructive/10' :
                      action.type === 'encourage' ? 'bg-cyan-500/10' :
                      'bg-blue-500/10'
                    }`}
                  >
                    <span className="text-lg">
                      {action.type === 'celebrate' ? '🎉' :
                       action.type === 'warn' ? '⚠️' :
                       action.type === 'encourage' ? '💪' :
                       '💡'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium">{action.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                    <Badge
                      variant="outline"
                      className={`mt-2 text-[10px] px-1.5 py-0.5 ${
                        action.type === 'celebrate' ? 'border-emerald-500/30 text-emerald-400' :
                        action.type === 'warn' ? 'border-destructive/30 text-destructive' :
                        action.type === 'encourage' ? 'border-cyan-500/30 text-cyan-400' :
                        'border-blue-500/30 text-blue-400'
                      }`}
                    >
                      Priority {action.priority}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create goal form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Create a goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_120px_120px_auto] sm:items-end">
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
            <Button type="submit" disabled={createGoal.isPending || !title.trim()}>Create</Button>
          </form>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs"
            >
              <Lightbulb className="h-3.5 w-3.5 mr-1" />
              {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
            </Button>
          </div>
          {createGoal.error && <p className="mt-3 text-sm text-destructive">{createGoal.error.message}</p>}
        </CardContent>
      </Card>

      {/* Empty state */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading goals...</p>
      ) : error ? (
        <p className="text-sm text-destructive">Could not load goals: {(error as Error).message}</p>
      ) : goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Target className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No goals yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create a goal to start measuring progress.</p>
          {hasData && (
            <Button size="sm" variant="outline" className="mt-4" onClick={() => setShowSuggestions(true)}>
              <Lightbulb className="h-3.5 w-3.5 mr-2" />
              Get Suggestions
            </Button>
          )}
        </div>
      ) : null}

      {/* Loading state for goals */}
      {isLoading && goals.length === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-2 w-24 bg-muted/50 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-2 w-48 bg-muted rounded mb-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Goal card component
function GoalCard({ goalProgress, onDelete }: { goalProgress: GoalProgress; onDelete: () => void }) {
  const updateGoal = useUpdateGoal();
  const progress = Math.min(100, Math.round(goalProgress.progressPercentage));
  const isCompleted = goalProgress.status === "completed";

  return (
    <Card 
      className={`transition-colors ${
        isCompleted ? 'border-emerald-500/20 bg-emerald-500/[0.05]' :
        goalProgress.status === 'behind' ? 'border-orange-500/20 bg-orange-500/[0.05]' :
        'border-border'
      }`}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{goalProgress.goal.title}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {goalProgress.currentValue}
            {goalProgress.targetValue ? ` / ${goalProgress.targetValue}` : ""}
            {goalProgress.unit ? ` ${goalProgress.unit}` : ""}
          </p>
          {goalProgress.daysRemaining !== undefined && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {goalProgress.daysRemaining} days remaining
            </p>
          )}
        </div>
        <button 
          title="Delete goal" 
          onClick={onDelete} 
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        {goalProgress.targetValue ? (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className={`font-medium ${
                isCompleted ? 'text-emerald-400' :
                goalProgress.status === 'behind' ? 'text-orange-400' :
                'text-primary'
              }`}>
                {progress}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div 
                className={`h-full rounded-full transition-all ${
                  isCompleted ? 'bg-emerald-400' :
                  goalProgress.status === 'behind' ? 'bg-orange-400' :
                  'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Trend indicator */}
            {goalProgress.trend !== 'insufficient-data' && (
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Trend: {goalProgress.trend}</span>
                <span>Status: {goalProgress.status}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="mb-4 text-xs text-muted-foreground">Set a target to measure progress.</p>
        )}
        
        {/* Action buttons / status */}
        <div className="flex flex-wrap gap-2">
          {goalProgress.recommendations.length > 0 && (
            <span className="text-xs bg-muted/50 px-2 py-1 rounded text-muted-foreground">
              {goalProgress.recommendations[0]}
            </span>
          )}
          
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Completed
            </span>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => updateGoal.mutate({ id: goalProgress.goal.id, status: "completed" })}
            >
              Mark complete
            </Button>
          )}
        </div>
        
        {/* Related metrics */}
        {goalProgress.relatedMetrics.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground mb-2">Related Metrics:</p>
            <div className="flex flex-wrap gap-2">
              {goalProgress.relatedMetrics.map((m, i) => (
                <span key={i} className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                  {m.label}: {typeof m.value === 'number' ? m.value : m.value}
                  {m.change !== undefined && ` (${m.change > 0 ? '+' : ''}${m.change})`}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
