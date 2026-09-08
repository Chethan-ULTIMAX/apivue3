import type { PublicPlatform } from '@/lib/public-data';

interface PlatformSelectorProps {
  value: PublicPlatform;
  onChange: (platform: PublicPlatform) => void;
}

const platforms: {
  id: PublicPlatform;
  name: string;
  description: string;
}[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Repositories, followers and public activity',
  },
  {
    id: 'codeforces',
    name: 'Codeforces',
    description: 'Rating, contests and submissions',
  },
];

export function PlatformSelector({
  value,
  onChange,
}: PlatformSelectorProps) {
  return (
    <div>
      <label
        htmlFor="platform"
        className="mb-2 block text-sm font-medium text-white/70"
      >
        Platform
      </label>

      <select
        id="platform"
        value={value}
        onChange={(event) =>
          onChange(event.target.value as PublicPlatform)
        }
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/50"
      >
        {platforms.map((platform) => (
          <option
            key={platform.id}
            value={platform.id}
            className="bg-zinc-950"
          >
            {platform.name}
          </option>
        ))}
      </select>

      <p className="mt-2 text-xs leading-relaxed text-white/40">
        {
          platforms.find((platform) => platform.id === value)
            ?.description
        }
      </p>
    </div>
  );
}