import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { UATTestCaseStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberAvatar } from "@/components/TicketBadges";
import { CheckCircle2, XCircle, AlertTriangle, Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

const STATUS_CONFIG: Record<UATTestCaseStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
  passed: { icon: CheckCircle2, color: "text-success", label: "Passed" },
  failed: { icon: XCircle, color: "text-destructive", label: "Failed" },
  blocked: { icon: AlertTriangle, color: "text-warning", label: "Blocked" },
};

export function UATTestPlanPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { uatPlans, updateTestCase, updateUATTestPlan, signOffUATPlan, members, tickets } = useStore();
  const permissions = usePermissions();

  const plan = uatPlans.find((p) => p.id === planId);

  if (!plan) {
    return (
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <p className="text-sm">Test plan not found</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => navigate("/dashboard/uat")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to UAT
        </Button>
      </div>
    );
  }

  const total = plan.testCases.length;
  const passed = plan.testCases.filter((tc) => tc.status === "passed").length;
  const failed = plan.testCases.filter((tc) => tc.status === "failed").length;
  const blocked = plan.testCases.filter((tc) => tc.status === "blocked").length;
  const pending = plan.testCases.filter((tc) => tc.status === "pending").length;
  const progress = total > 0 ? ((total - pending) / total) * 100 : 0;
  const canSignOff = pending === 0 && total > 0 && plan.status !== "signed_off" && permissions.can("sign_off_uat");

  const handleStatusChange = (caseId: string, newStatus: UATTestCaseStatus) => {
    if (!permissions.can("update_test_case")) return;
    updateTestCase(plan.id, caseId, {
      status: newStatus,
      executedAt: newStatus !== "pending" ? new Date().toISOString() : null,
    });
    const updatedCases = plan.testCases.map((tc) => tc.id === caseId ? { ...tc, status: newStatus } : tc);
    const allDone = updatedCases.every((tc) => tc.status !== "pending");
    const hasFailed = updatedCases.some((tc) => tc.status === "failed");
    if (allDone && !hasFailed && plan.status !== "signed_off") {
      updateUATTestPlan(plan.id, { status: "completed" });
    } else if (plan.status === "draft") {
      updateUATTestPlan(plan.id, { status: "in_progress" });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2" onClick={() => navigate("/dashboard/uat")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to UAT
      </Button>

      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">UAT testing</p>
        <h1 className="text-xl font-semibold mt-1">{plan.name}</h1>
        {plan.description && <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>}
      </div>

      {/* Progress summary */}
      <div className="border border-border rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{Math.round(progress)}% complete</span>
          <span className="text-muted-foreground">{total - pending}/{total} tested</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex gap-4 text-xs">
          <span className="text-success">{passed} passed</span>
          <span className="text-destructive">{failed} failed</span>
          <span className="text-warning">{blocked} blocked</span>
          <span className="text-muted-foreground">{pending} pending</span>
        </div>
      </div>

      {/* Sign-off */}
      {canSignOff && (
        <Button size="sm" className="w-full" onClick={() => signOffUATPlan(plan.id, members[0]?.id || "")}>
          <ShieldCheck className="h-4 w-4 mr-1" /> Sign off test plan
        </Button>
      )}

      {plan.status === "signed_off" && (
        <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-md p-3">
          <ShieldCheck className="h-4 w-4" />
          <span>Signed off {plan.signedOffBy ? `by ${members.find((m) => m.id === plan.signedOffBy)?.name || "Unknown"}` : ""}</span>
        </div>
      )}

      {/* Test cases */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Test cases</h2>
        {plan.testCases.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">No test cases in this plan</p>
        )}
        {plan.testCases.map((tc) => {
          const cfg = STATUS_CONFIG[tc.status];
          const Icon = cfg.icon;
          const linkedTicket = tc.linkedTicketId ? tickets.find((t) => t.id === tc.linkedTicketId) : null;
          const tester = tc.testerId ? members.find((m) => m.id === tc.testerId) : null;

          return (
            <div key={tc.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{tc.title}</p>
                  {tc.description && <p className="text-xs text-muted-foreground mt-1">{tc.description}</p>}
                  {tc.expectedResult && (
                    <p className="text-xs mt-1.5">
                      <span className="text-muted-foreground">Expected: </span>
                      {tc.expectedResult}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {linkedTicket && (
                      <Badge variant="outline" className="text-[10px]">{linkedTicket.ticketId}</Badge>
                    )}
                    {tester && <MemberAvatar name={tester.name} avatar={tester.avatar} size="sm" />}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={tc.status}
                  onValueChange={(v) => handleStatusChange(tc.id, v as UATTestCaseStatus)}
                    disabled={!permissions.can("update_test_case")}
                >
                  <SelectTrigger className="h-8 text-xs w-36">
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
                onChange={(e) => updateTestCase(plan.id, tc.id, { notes: e.target.value })}
                placeholder="Tester notes..."
                rows={2}
                className="text-xs"
                disabled={!permissions.can("update_test_case")}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
