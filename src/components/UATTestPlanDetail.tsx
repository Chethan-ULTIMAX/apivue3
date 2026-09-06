import { useStore } from "@/lib/store";
import { UATTestCaseStatus } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberAvatar } from "@/components/TicketBadges";
import { CheckCircle2, XCircle, AlertTriangle, Clock, ShieldCheck } from "lucide-react";

interface Props {
  planId: string;
  onClose: () => void;
}

const STATUS_CONFIG: Record<UATTestCaseStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
  passed: { icon: CheckCircle2, color: "text-success", label: "Passed" },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
  blocked: { icon: AlertTriangle, color: "text-warning", label: "Blocked" },
};

export function UATTestPlanDetail({ planId, onClose }: Props) {
  const { uatPlans, updateTestCase, updateUATTestPlan, signOffUATPlan, members, tickets } = useStore();
  const plan = uatPlans.find((p) => p.id === planId);

  if (!plan) return null;

  const total = plan.testCases.length;
  const passed = plan.testCases.filter((tc) => tc.status === "passed").length;
  const failed = plan.testCases.filter((tc) => tc.status === "failed").length;
  const blocked = plan.testCases.filter((tc) => tc.status === "blocked").length;
  const pending = plan.testCases.filter((tc) => tc.status === "pending").length;
  const progress = total > 0 ? ((total - pending) / total) * 100 : 0;
  const canSignOff = pending === 0 && total > 0 && plan.status !== "signed_off";

  const handleStatusChange = (caseId: string, newStatus: UATTestCaseStatus) => {
    updateTestCase(planId, caseId, {
      status: newStatus,
      executedAt: newStatus !== "pending" ? new Date().toISOString() : null,
    });
    // Auto-update plan status
    const updatedCases = plan.testCases.map((tc) => tc.id === caseId ? { ...tc, status: newStatus } : tc);
    const allDone = updatedCases.every((tc) => tc.status !== "pending");
    const hasFailed = updatedCases.some((tc) => tc.status === "failed");
    if (allDone && !hasFailed && plan.status !== "signed_off") {
      updateUATTestPlan(planId, { status: "completed" });
    } else if (plan.status === "draft") {
      updateUATTestPlan(planId, { status: "in_progress" });
    }
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">{plan.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {plan.description && (
            <p className="text-xs text-muted-foreground">{plan.description}</p>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span>{Math.round(progress)}% complete</span>
              <span className="text-muted-foreground">{total - pending}/{total} tested</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex gap-3 text-xs">
              <span className="text-success">{passed} passed</span>
              <span className="text-destructive">{failed} failed</span>
              <span className="text-warning">{blocked} blocked</span>
              <span className="text-muted-foreground">{pending} pending</span>
            </div>
          </div>

          {canSignOff && (
            <Button size="sm" className="w-full" onClick={() => signOffUATPlan(planId, members[0]?.id || "")}>
              <ShieldCheck className="h-4 w-4 mr-1" /> Sign off test plan
            </Button>
          )}

          {plan.status === "signed_off" && (
            <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-md p-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Signed off {plan.signedOffBy ? `by ${members.find((m) => m.id === plan.signedOffBy)?.name || "Unknown"}` : ""}</span>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Test cases</h3>
            {plan.testCases.map((tc) => {
              const cfg = STATUS_CONFIG[tc.status];
              const Icon = cfg.icon;
              const linkedTicket = tc.linkedTicketId ? tickets.find((t) => t.id === tc.linkedTicketId) : null;
              const tester = tc.testerId ? members.find((m) => m.id === tc.testerId) : null;

              return (
                <div key={tc.id} className="border border-border rounded-md p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{tc.title}</p>
                      {tc.description && <p className="text-xs text-muted-foreground mt-0.5">{tc.description}</p>}
                      {tc.expectedResult && (
                        <p className="text-xs mt-1">
                          <span className="text-muted-foreground">Expected: </span>
                          {tc.expectedResult}
                        </p>
                      )}
                      {linkedTicket && (
                        <Badge variant="outline" className="mt-1 text-[10px]">{linkedTicket.ticketId}</Badge>
                      )}
                    </div>
                    {tester && <MemberAvatar name={tester.name} avatar={tester.avatar} size="sm" />}
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={tc.status}
                      onValueChange={(v) => handleStatusChange(tc.id, v as UATTestCaseStatus)}
                    >
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="passed">Passed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    {tc.executedAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(tc.executedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <Textarea
                    value={tc.notes}
                    onChange={(e) => updateTestCase(planId, tc.id, { notes: e.target.value })}
                    placeholder="Tester notes..."
                    rows={1}
                    className="text-xs"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
