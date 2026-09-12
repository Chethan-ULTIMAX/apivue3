import type { ConnectedAccount } from '@/lib/integrations/types';

interface ConnectedAccountCardProps {
  provider: string;
  account: ConnectedAccount;
}

export function ConnectedAccountCard({
  provider,
  account,
}: ConnectedAccountCardProps) {
  if (!account.connected) return null;

  const name =
    account.displayName ||
    account.username ||
    account.handle ||
    'Connected account';

  const identifier = account.username || account.handle || '';

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-center gap-4">
        {account.avatarUrl ? (
          <img
            src={account.avatarUrl}
            alt=""
            className="h-12 w-12 rounded-xl border border-border object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted text-lg font-semibold text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {provider}
          </p>

          <p className="mt-1 truncate font-medium text-foreground">
            {name}
          </p>

          {identifier && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              @{identifier}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}