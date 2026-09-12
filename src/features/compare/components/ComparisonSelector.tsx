import { useState } from 'react';
import { Check, ChevronDown, Users, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ProfileAvatar } from '@/components/apivue/ProfileBits';
import type { TrackedProfile } from '@/lib/integrations/registry';

interface ComparisonSelectorProps {
  profiles: TrackedProfile[];
  selected: string[];
  onSelect: (ids: string[]) => void;
  maxSelect?: number;
}

export function ComparisonSelector({
  profiles,
  selected,
  onSelect,
  maxSelect = 3,
}: ComparisonSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedProfiles = profiles.filter((p) => selected.includes(p.id));
  const availableProfiles = profiles.filter((p) => !selected.includes(p.id));
  const atMax = selected.length >= maxSelect;

  const handleSelect = (id: string) => {
    if (selected.includes(id)) {
      onSelect(selected.filter((x) => x !== id));
      return;
    }
    if (atMax) return;
    onSelect([...selected, id]);
  };

  const handleRemove = (id: string) => {
    onSelect(selected.filter((x) => x !== id));
  };

  return (
    <div className="space-y-2">
      {selectedProfiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProfiles.map((profile) => (
            <div
              key={profile.id}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
            >
              <ProfileAvatar profile={profile} size="sm" />
              <span className="text-sm font-medium">
                {profile.display_name || profile.handle}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => handleRemove(profile.id)}
                aria-label={`Remove ${profile.handle}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={atMax}
            className="w-full justify-between border-dashed"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {atMax
                ? `Maximum of ${maxSelect} reached`
                : selected.length === 0
                  ? 'Select profiles to compare'
                  : `Add more (${selected.length}/${maxSelect})`}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search profiles…" />
            <CommandList>
              <CommandEmpty>No profiles found.</CommandEmpty>
              <CommandGroup>
                {availableProfiles.map((profile) => (
                  <CommandItem
                    key={profile.id}
                    value={`${profile.handle} ${profile.display_name ?? ''}`}
                    onSelect={() => {
                      handleSelect(profile.id);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selected.includes(profile.id)
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                    />
                    <ProfileAvatar profile={profile} size="sm" />
                    <div className="ml-2 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {profile.display_name || profile.handle}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{profile.handle}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}