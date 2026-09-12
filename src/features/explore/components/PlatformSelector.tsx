import { getPublicPlatform, type PublicPlatform } from '@/lib/public-data';
import { Code2, Github, Hash, Swords, Trophy } from 'lucide-react';

interface PlatformSelectorProps {
  value: PublicPlatform;
  onChange: (platform: PublicPlatform) => void;
}

const PLATFORMS: Array<{ id: PublicPlatform; short: string; icon: typeof Github }> = [
  { id: 'github', short: 'GH', icon: Github },
  { id: 'codeforces', short: 'CF', icon: Trophy },
  { id: 'leetcode', short: 'LC', icon: Code2 },
  { id: 'codewars', short: 'CW', icon: Swords },
  { id: 'stackoverflow', short: 'SO', icon: Hash },
];

export function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
  const activeDefinition = getPublicPlatform(value);

  return (
    <div className="md:col-span-3">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Explore platform</label>
          <p className="mt-1 text-sm text-foreground/80">{activeDefinition.description}</p>
        </div>
        <span className="hidden rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground sm:block">Public API · no connection required</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {PLATFORMS.map(({ id, short, icon: Icon }) => {
          const definition = getPublicPlatform(id);
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] ${active ? 'border-primary/40 bg-primary/10 shadow-[0_12px_40px_-24px_hsl(var(--primary)/0.8)]' : 'border-border bg-background/50 hover:border-primary/20 hover:bg-card'}`}
              aria-pressed={active}
            >
              {active && <span className="absolute inset-x-0 top-0 h-px bg-primary" />}
              <div className="flex items-center gap-2.5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[10px] font-bold transition ${active ? 'border-primary/30 bg-primary text-primary-foreground' : 'border-border bg-muted text-muted-foreground group-hover:text-foreground'}`}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{definition.name}</span><span className="block text-[10px] text-muted-foreground">{short} · Public</span></span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
