import { getPublicPlatform, type PublicDataResult } from '@/lib/public-data';

interface PublicProfileCardProps {
  data: PublicDataResult;
}

function formatJoinedAt(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });
}

export function PublicProfileCard({ data }: PublicProfileCardProps) {
  const { profile, platform } = data;
  const definition = getPublicPlatform(platform);
  const joined = formatJoinedAt(profile.joinedAt);

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={`${profile.username} avatar`}
            className="h-16 w-16 rounded-2xl border border-border object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted text-xl font-semibold text-muted-foreground">
            {profile.username.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold text-foreground">
              {profile.displayName || profile.username}
            </h2>

            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {definition.name}
            </span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            @{profile.username}
            {joined && (
              <>
                <span className="mx-2 text-border">·</span>
                Joined {joined}
              </>
            )}
          </p>

          {profile.bio && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/80">
              {profile.bio}
            </p>
          )}

          {profile.location && (
            <p className="mt-2 text-xs text-muted-foreground">
              📍 {profile.location}
            </p>
          )}
        </div>

        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          View profile
        </a>
      </div>
    </div>
  );
}