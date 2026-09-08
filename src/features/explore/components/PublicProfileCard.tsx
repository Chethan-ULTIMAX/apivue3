import type { PublicDataResult } from '@/lib/public-data';

interface PublicProfileCardProps {
  data: PublicDataResult;
}

export function PublicProfileCard({
  data,
}: PublicProfileCardProps) {
  const { profile } = data;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={`${profile.username} avatar`}
            className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl font-semibold text-white/60">
            {profile.username.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold text-white">
              {profile.displayName || profile.username}
            </h2>

            <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-xs text-violet-300">
              {data.platform === 'github'
                ? 'GitHub'
                : 'Codeforces'}
            </span>
          </div>

          <p className="mt-1 text-sm text-white/40">
            @{profile.username}
          </p>

          {profile.bio && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
              {profile.bio}
            </p>
          )}

          {profile.location && (
            <p className="mt-2 text-xs text-white/40">
              {profile.location}
            </p>
          )}
        </div>

        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.07] hover:text-white"
        >
          View profile
        </a>
      </div>
    </div>
  );
}