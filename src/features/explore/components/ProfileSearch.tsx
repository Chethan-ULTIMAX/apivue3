import type { PublicPlatform } from '@/lib/public-data';

interface ProfileSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  platform: PublicPlatform;
}

export function ProfileSearch({
  value,
  onChange,
  onSubmit,
  loading,
  platform,
}: ProfileSearchProps) {
  const placeholder =
    platform === 'github'
      ? 'Enter GitHub username'
      : 'Enter Codeforces handle';

  return (
    <div>
      <label
        htmlFor="profile-username"
        className="mb-2 block text-sm font-medium text-white/70"
      >
        Username / Handle
      </label>

      <input
        id="profile-username"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !loading) {
            onSubmit();
          }
        }}
        placeholder={placeholder}
        disabled={loading}
        autoComplete="off"
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-400/50 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <p className="mt-2 text-xs text-white/40">
        Public data only. No account connection required.
      </p>
    </div>
  );
}