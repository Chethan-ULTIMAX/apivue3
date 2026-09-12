import {
  getPublicPlatform,
  publicPlatformRegistry,
  type PublicPlatform,
} from '@/lib/public-data';

interface PlatformSelectorProps {
  value: PublicPlatform;
  onChange: (platform: PublicPlatform) => void;
}

/**
 * Ordered list of platforms shown in the selector.
 * Keeping an explicit order avoids relying on object-key iteration
 * order and lets us control UX (e.g. GitHub first, niche platforms last).
 */
const PLATFORM_ORDER: PublicPlatform[] = [
  'github',
  'codeforces',
  'leetcode',
  'codewars',
  'stackoverflow',
];

export function PlatformSelector({
  value,
  onChange,
}: PlatformSelectorProps) {
  const activeDefinition = getPublicPlatform(value);

  return (
    <div>
      <label
        htmlFor="platform"
        className="mb-2 block text-sm font-medium text-foreground"
      >
        Platform
      </label>

      <select
        id="platform"
        value={value}
        onChange={(event) =>
          onChange(event.target.value as PublicPlatform)
        }
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/50"
      >
        {PLATFORM_ORDER.map((id) => {
          const definition = publicPlatformRegistry[id];
          return (
            <option key={id} value={id}>
              {definition.name}
            </option>
          );
        })}
      </select>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {activeDefinition.description}
      </p>
    </div>
  );
}