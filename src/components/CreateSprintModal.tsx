import { useState } from "react";
import { useStore } from "@/lib/store";
import { Sprint } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateSprintModal({ open, onClose }: Props) {
  const createSprint = useStore((s) => s.createSprint);
  const sprints = useStore((s) => s.sprints);

  const nextNum = sprints.length + 1;
  const today = new Date();
  const defaultStart = new Date(today);
  // Start after the last sprint ends, if any
  const lastSprint = sprints[sprints.length - 1];
  if (lastSprint) {
    const lastEnd = new Date(lastSprint.endDate);
    if (lastEnd > today) {
      defaultStart.setTime(lastEnd.getTime());
      defaultStart.setDate(defaultStart.getDate() + 1);
    }
  }
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setDate(defaultEnd.getDate() + 13);

  const [name, setName] = useState(`Sprint ${nextNum}`);
  const [startDate, setStartDate] = useState(defaultStart.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().split("T")[0]);
  const [goal, setGoal] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    const sprint: Sprint = {
      id: crypto.randomUUID(),
      name: name.trim(),
      startDate,
      endDate,
      isActive: false,
      goal: goal.trim() || undefined,
    };
    createSprint(sprint);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] max-w-[80vw] sm:max-w-md max-h-[80vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>Create sprint</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs">Sprint name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint name" className="bg-muted border-border mt-1" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-muted border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs">End date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-muted border-border mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Sprint goal (optional)</Label>
            <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What do you want to achieve?" className="bg-muted border-border mt-1 min-h-[60px] resize-none" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || !startDate || !endDate}>Create sprint</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
