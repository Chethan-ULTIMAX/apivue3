import { useState } from "react";
import { useStore } from "@/lib/store";
import { UATTestCase, UATTestPlan } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Wand2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUATTestPlanModal({ open, onOpenChange }: Props) {
  const { sprints, epics, tickets, members, addUATTestPlan } = useStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sprintId, setSprintId] = useState<string>("none");
  const [epicId, setEpicId] = useState<string>("none");
  const [testCases, setTestCases] = useState<Partial<UATTestCase>[]>([]);

  const reset = () => {
    setName("");
    setDescription("");
    setSprintId("none");
    setEpicId("none");
    setTestCases([]);
  };

  const autoPopulate = () => {
    const sid = sprintId !== "none" ? sprintId : null;
    const eid = epicId !== "none" ? epicId : null;
    const relevant = tickets.filter((t) => {
      if (sid && t.sprintId !== sid) return false;
      if (eid && t.epicId !== eid) return false;
      return true;
    });
    const cases: Partial<UATTestCase>[] = relevant.map((t) => ({
      title: `Verify: ${t.title}`,
      description: t.description,
      expectedResult: "",
      testerId: null,
      linkedTicketId: t.id,
    }));
    setTestCases(cases);
  };

  const addCase = () => {
    setTestCases([...testCases, { title: "", description: "", expectedResult: "", testerId: null, linkedTicketId: null }]);
  };

  const updateCase = (idx: number, updates: Partial<UATTestCase>) => {
    setTestCases(testCases.map((tc, i) => (i === idx ? { ...tc, ...updates } : tc)));
  };

  const removeCase = (idx: number) => {
    setTestCases(testCases.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!name.trim() || testCases.length === 0) return;
    const now = new Date().toISOString();
    const plan: UATTestPlan = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      sprintId: sprintId !== "none" ? sprintId : null,
      epicId: epicId !== "none" ? epicId : null,
      testCases: testCases.map((tc) => ({
        id: crypto.randomUUID(),
        title: tc.title || "Untitled case",
        description: tc.description || "",
        expectedResult: tc.expectedResult || "",
        status: "pending" as const,
        testerId: tc.testerId || null,
        notes: "",
        executedAt: null,
        linkedTicketId: tc.linkedTicketId || null,
      })),
      status: "draft",
      createdAt: now,
      updatedAt: now,
      signedOffBy: null,
      signedOffAt: null,
    };
    addUATTestPlan(plan);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create test plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sprint 3 UAT" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is being tested..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sprint</Label>
              <Select value={sprintId} onValueChange={setSprintId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {sprints.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Epic</Label>
              <Select value={epicId} onValueChange={setEpicId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {epics.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Test cases</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={autoPopulate}>
                  <Wand2 className="h-3.5 w-3.5 mr-1" /> Auto-populate from tickets
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addCase}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add case
                </Button>
              </div>
            </div>
            {testCases.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">No test cases yet. Add manually or auto-populate from tickets.</p>
            )}
            {testCases.map((tc, idx) => (
              <div key={idx} className="border border-border rounded-md p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={tc.title || ""}
                    onChange={(e) => updateCase(idx, { title: e.target.value })}
                    placeholder="Test case title"
                    className="flex-1 h-8 text-xs"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeCase(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Textarea
                  value={tc.description || ""}
                  onChange={(e) => updateCase(idx, { description: e.target.value })}
                  placeholder="Steps to test..."
                  rows={1}
                  className="text-xs"
                />
                <Input
                  value={tc.expectedResult || ""}
                  onChange={(e) => updateCase(idx, { expectedResult: e.target.value })}
                  placeholder="Expected result"
                  className="h-8 text-xs"
                />
                <Select value={tc.testerId || "none"} onValueChange={(v) => updateCase(idx, { testerId: v === "none" ? null : v })}>
                  <SelectTrigger className="h-8 text-xs w-48">
                    <SelectValue placeholder="Assign tester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || testCases.length === 0}>Create plan</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
