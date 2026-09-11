import { useState } from "react";
import { Check, Plus, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateGoal, useDeleteGoal, useGoals, useUpdateGoal } from "@/hooks/use-goals";

export function GoalsView() {
  const { data: goals = [], isLoading, error } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");

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

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Goals</h1>
        <p className="text-sm text-muted-foreground">Track objectives using your real progress data.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" /> Create a goal</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_120px_120px_auto] sm:items-end">
            <div className="space-y-1"><Label htmlFor="goal-title">Goal</Label><Input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Solve 50 problems" /></div>
            <div className="space-y-1"><Label htmlFor="goal-target">Target</Label><Input id="goal-target" type="number" min="0" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="50" /></div>
            <div className="space-y-1"><Label htmlFor="goal-unit">Unit</Label><Input id="goal-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="problems" /></div>
            <Button type="submit" disabled={createGoal.isPending || !title.trim()}>Create</Button>
          </form>
          {createGoal.error && <p className="mt-3 text-sm text-destructive">{createGoal.error.message}</p>}
        </CardContent>
      </Card>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading goals...</p> : error ? <p className="text-sm text-destructive">Could not load goals: {(error as Error).message}</p> : goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center"><Target className="mx-auto h-10 w-10 text-muted-foreground/40" /><p className="mt-3 text-sm font-medium">No goals yet</p><p className="mt-1 text-sm text-muted-foreground">Create a goal to start measuring progress.</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => {
            const progress = goal.target_value && goal.target_value > 0 ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0;
            return <Card key={goal.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0"><div><CardTitle className="text-base">{goal.title}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{goal.current_value}{goal.target_value ? ` / ${goal.target_value}` : ""}{goal.unit ? ` ${goal.unit}` : ""}</p></div><button title="Delete goal" onClick={() => deleteGoal.mutate(goal.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></CardHeader>
              <CardContent>
                {goal.target_value ? <div className="mb-4"><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-right text-xs text-muted-foreground">{progress}%</p></div> : <p className="mb-4 text-xs text-muted-foreground">Set a target to measure progress.</p>}
                {goal.status === "completed" ? <span className="inline-flex items-center gap-1 text-xs text-success"><Check className="h-3.5 w-3.5" /> Completed</span> : <Button size="sm" variant="outline" onClick={() => updateGoal.mutate({ id: goal.id, status: "completed" })}>Mark complete</Button>}
              </CardContent>
            </Card>;
          })}
        </div>
      )}
    </div>
  );
}
