import { useState } from "react";
import { useStore } from "@/lib/store";
import { Epic } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  open: boolean;
  onClose: () => void;
}

const COLORS = [
  { value: "epic-auth", label: "Purple", swatchClass: "bg-epic-auth" },
  { value: "epic-dashboard", label: "Blue", swatchClass: "bg-epic-dashboard" },
  { value: "epic-api", label: "Green", swatchClass: "bg-epic-api" },
  { value: "primary", label: "Primary", swatchClass: "bg-primary" },
  { value: "warning", label: "Orange", swatchClass: "bg-warning" },
  { value: "destructive", label: "Red", swatchClass: "bg-destructive" },
];

const QUARTERS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027", "Q2 2027"];

export function CreateEpicModal({ open, onClose }: Props) {
  const addEpic = useStore((s) => s.addEpic);
  const [name, setName] = useState("");
  const [color, setColor] = useState("epic-auth");
  const [targetQuarter, setTargetQuarter] = useState("Q2 2026");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const epic: Epic = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color,
      targetQuarter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    addEpic(epic);
    setName("");
    setColor("epic-auth");
    setTargetQuarter("Q2 2026");
    setStartDate("");
    setEndDate("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] max-w-[80vw] sm:max-w-md max-h-[80vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>Create epic</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Epic name" className="bg-muted border-border mt-1" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="bg-muted border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 shrink-0 rounded-full ${c.swatchClass}`} />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Target quarter</Label>
              <Select value={targetQuarter} onValueChange={setTargetQuarter}>
                <SelectTrigger className="bg-muted border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUARTERS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()}>Create epic</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
