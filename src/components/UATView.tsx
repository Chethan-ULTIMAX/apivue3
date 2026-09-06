import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { UATTestPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardCheck, Trash2 } from "lucide-react";
import { CreateUATTestPlanModal } from "./CreateUATTestPlanModal";
import { UATTestPlanDetail } from "./UATTestPlanDetail";
import { usePermissions } from "@/hooks/use-permissions";

const STATUS_BADGE: Record<UATTestPlan["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-info/15 text-info",
  completed: "bg-success/15 text-success",
  signed_off: "bg-primary/15 text-primary",
};

export function UATView() {
  const navigate = useNavigate();
  const { uatPlans, sprints, epics, deleteUATTestPlan } = useStore();
  const permissions = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [filterSprint, setFilterSprint] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = uatPlans.filter((p) => {
    if (filterSprint !== "all" && p.sprintId !== filterSprint) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  const getCounts = (plan: UATTestPlan) => {
    const total = plan.testCases.length;
    const passed = plan.testCases.filter((tc) => tc.status === "passed").length;
    const failed = plan.testCases.filter((tc) => tc.status === "failed").length;
    const blocked = plan.testCases.filter((tc) => tc.status === "blocked").length;
    const pending = plan.testCases.filter((tc) => tc.status === "pending").length;
    const progress = total > 0 ? ((total - pending) / total) * 100 : 0;
    return { total, passed, failed, blocked, pending, progress };
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">UAT testing</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage test plans and track verification progress</p>
        </div>
        {permissions.can("create_uat_plan") && <Button onClick={() => setCreateOpen(true)} size="sm" className="w-full sm:w-auto min-h-11 sm:min-h-0">
          <Plus className="h-4 w-4 mr-1" /> New test plan
        </Button>}
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Select value={filterSprint} onValueChange={setFilterSprint}>
          <SelectTrigger className="flex-1 sm:flex-none sm:w-40 h-9 sm:h-8 text-xs min-w-[140px]">
            <SelectValue placeholder="Sprint" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sprints</SelectItem>
            {sprints.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="flex-1 sm:flex-none sm:w-40 h-9 sm:h-8 text-xs min-w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="signed_off">Signed off</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">No test plans yet</p>
          <p className="text-xs mt-1">Create a test plan to start tracking UAT</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((plan) => {
            const counts = getCounts(plan);
            const sprint = sprints.find((s) => s.id === plan.sprintId);
            const epic = epics.find((e) => e.id === plan.epicId);
            return (
              <div
                key={plan.id}
                className="border border-border rounded-lg p-4 hover:bg-accent/30 cursor-pointer transition-colors"
                onClick={() => navigate(`/dashboard/uat/${plan.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium truncate">{plan.name}</h3>
                      <Badge variant="outline" className={STATUS_BADGE[plan.status]}>
                        {plan.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground truncate">{plan.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {sprint && <span>{sprint.name}</span>}
                      {epic && <span>{epic.name}</span>}
                      <span>{counts.total} cases</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right text-xs space-y-0.5 min-w-[100px]">
                      <div className="flex gap-2 justify-end">
                        <span className="text-success">{counts.passed} passed</span>
                        <span className="text-destructive">{counts.failed} failed</span>
                        <span className="text-muted-foreground">{counts.pending} pending</span>
                      </div>
                      <Progress value={counts.progress} className="h-1.5" />
                    </div>
                    {permissions.can("delete_uat_plan") && <Button
                      variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                      onClick={(e) => { e.stopPropagation(); deleteUATTestPlan(plan.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateUATTestPlanModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
