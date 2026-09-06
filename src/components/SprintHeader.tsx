import { useState } from "react";
import { Sprint, Ticket } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Calendar, Target, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SprintRetroModal } from "./SprintRetroModal";

export function SprintHeader({ sprint, tickets }: { sprint: Sprint; tickets: Ticket[] }) {
  const completeSprint = useStore((s) => s.completeSprint);
  const permissions = usePermissions();
  const [showRetro, setShowRetro] = useState(false);
  const [completedSprintInfo, setCompletedSprintInfo] = useState<{ id: string; name: string } | null>(null);

  const totalPoints = tickets.reduce((sum, t) => sum + t.storyPoints, 0);
  const completedPoints = tickets.filter((t) => t.status === "done").reduce((sum, t) => sum + t.storyPoints, 0);
  const daysRemaining = Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - Date.now()) / 86400000));
  const progress = totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0;
  const incompleteCount = tickets.filter((t) => t.status !== "done").length;

  const handleComplete = () => {
    setCompletedSprintInfo({ id: sprint.id, name: sprint.name });
    completeSprint(sprint.id);
    setShowRetro(true);
  };

  return (
    <>
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">{sprint.name}</h1>
            {sprint.goal && <p className="text-sm text-muted-foreground mt-0.5 truncate">{sprint.goal}</p>}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">
                {new Date(sprint.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                {new Date(sprint.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">{completedPoints}</span>
              <span className="text-muted-foreground">/ {totalPoints} pts</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-warning shrink-0" />
              <span className="font-medium">{daysRemaining}</span>
              <span className="text-muted-foreground">days left</span>
            </div>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
            </div>
            {permissions.can("complete_sprint") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" /> Complete sprint
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Complete {sprint.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {incompleteCount > 0 ? `${incompleteCount} incomplete ticket${incompleteCount > 1 ? "s" : ""} will be moved back to the backlog.` : "All tickets are completed! Great work."}{" "}
                      {completedPoints} of {totalPoints} story points completed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleComplete}>Complete sprint</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {completedSprintInfo && (
        <SprintRetroModal
          sprintId={completedSprintInfo.id}
          sprintName={completedSprintInfo.name}
          open={showRetro}
          onClose={() => { setShowRetro(false); setCompletedSprintInfo(null); }}
        />
      )}
    </>
  );
}
