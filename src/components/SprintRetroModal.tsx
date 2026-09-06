import { useState } from "react";
import { SprintRetro } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ThumbsUp, ThumbsDown, ListChecks } from "lucide-react";

interface Props {
  sprintId: string;
  sprintName: string;
  open: boolean;
  onClose: () => void;
}

export function SprintRetroModal({ sprintId, sprintName, open, onClose }: Props) {
  const saveRetro = useStore((s) => s.saveRetro);
  const [wentWell, setWentWell] = useState("");
  const [didntGoWell, setDidntGoWell] = useState("");
  const [actionItems, setActionItems] = useState("");

  const handleSave = () => {
    const retro: SprintRetro = {
      sprintId,
      wentWell: wentWell.trim(),
      didntGoWell: didntGoWell.trim(),
      actionItems: actionItems.trim(),
      createdAt: new Date().toISOString(),
    };
    saveRetro(retro);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>Sprint Retrospective — {sprintName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <ThumbsUp className="h-3.5 w-3.5 text-success" /> What went well?
            </Label>
            <Textarea value={wentWell} onChange={(e) => setWentWell(e.target.value)}
              placeholder="Team collaboration, good velocity..." className="bg-muted border-border min-h-[80px] resize-none text-sm" />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <ThumbsDown className="h-3.5 w-3.5 text-destructive" /> What didn't go well?
            </Label>
            <Textarea value={didntGoWell} onChange={(e) => setDidntGoWell(e.target.value)}
              placeholder="Scope creep, unclear requirements..." className="bg-muted border-border min-h-[80px] resize-none text-sm" />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <ListChecks className="h-3.5 w-3.5 text-info" /> Action items
            </Label>
            <Textarea value={actionItems} onChange={(e) => setActionItems(e.target.value)}
              placeholder="Better estimation, daily standups..." className="bg-muted border-border min-h-[80px] resize-none text-sm" />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>Skip</Button>
          <Button onClick={handleSave}>Save Retrospective</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
