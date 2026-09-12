import {
  getPublicPlatform,
  type PublicPlatform,
} from '@/lib/public-data';

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
  const definition = getPublicPlatform(platform);

  return (
    <div>
      <label
        htmlFor="profile-username"
        className="mb-2 block text-sm font-medium text-foreground"
      >
        Username / handle
      </label>

      <input
        id="profile-username"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !loading) {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder={definition.placeholder}
        disabled={loading}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <p className="mt-2 text-xs text-muted-foreground">
        Public data only. No account connection required.
      </p>
    </div>
  );
}