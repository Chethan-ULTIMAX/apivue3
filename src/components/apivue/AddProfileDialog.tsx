import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSyncProfile } from '@/hooks/use-profiles';
import { integrations } from '@/lib/integrations/registry';
import type { IntegrationId } from '@/lib/integrations/types';
import { toast } from '@/hooks/use-toast';

interface AddProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlatform?: IntegrationId;
}

export function AddProfileDialog({
  open,
  onOpenChange,
  defaultPlatform,
}: AddProfileDialogProps) {
  const [platform, setPlatform] = useState<IntegrationId>(
    defaultPlatform ?? integrations[0].id,
  );
  const [handle, setHandle] = useState('');
  const sync = useSyncProfile();

  const active =
    integrations.find((i) => i.id === platform) ?? integrations[0];

  /* ---------- Sync external changes to `open` / `defaultPlatform` ---------- */

  useEffect(() => {
    if (!open) {
      // Reset form when the dialog closes so the next open starts clean.
      setHandle('');
      setPlatform(defaultPlatform ?? integrations[0].id);
    } else if (defaultPlatform) {
      setPlatform(defaultPlatform);
    }
  }, [open, defaultPlatform]);

  /* ---------- Submit ---------- */

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = handle.trim();
    if (!trimmed) return;

    try {
      await sync.mutateAsync({ platform, handle: trimmed });
      toast({
        title: 'Profile connected',
        description: `${trimmed} on ${active.name} is now being tracked.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Could not fetch that profile',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Connect a profile</DialogTitle>
          <DialogDescription className="text-xs">
            Enter a public handle. APIVue reads only publicly available data
            through each platform&apos;s API.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {/* Platform picker */}
          <div className="space-y-2">
            <Label className="text-xs">Platform</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {integrations.map((i) => {
                const Icon = i.icon;
                const selected = i.id === platform;
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setPlatform(i.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-all hover:-translate-y-0.5 ${
                      selected
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: i.accent }}
                    />
                    <span className="truncate">{i.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Handle input */}
          <div className="space-y-2">
            <Label htmlFor="handle" className="text-xs">
              {active.handleLabel}
            </Label>
            <Input
              id="handle"
              value={handle}
              placeholder={active.handlePlaceholder}
              onChange={(e) => setHandle(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={sync.isPending}
            />
            <p className="text-[11px] text-muted-foreground">
              {active.handleHint}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={sync.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={sync.isPending || !handle.trim()}
            >
              {sync.isPending && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              {sync.isPending ? 'Fetching…' : 'Fetch & track'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}