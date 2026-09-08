import type { ConnectedAccount } from '@/lib/integrations/types';

interface ConnectedAccountCardProps {
  provider: string;
  account: ConnectedAccount;
}

export function ConnectedAccountCard({
  provider,
  account,
}: ConnectedAccountCardProps) {
  if (!account.connected) {
    return null;
  }

  const name =
    account.displayName ||
    account.username ||
    account.handle ||
    'Connected account';

  const identifier =
    account.username ||
    account.handle ||
    '';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center gap-4">
        {account.avatarUrl ? (
          <img
            src={account.avatarUrl}
            alt=""
            className="h-12 w-12 rounded-xl border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-lg font-semibold text-white/60">
            {name
              .charAt(0)
              .toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-white/30">
            {provider}
          </p>

          <p className="mt-1 truncate font-medium text-white">
            {name}
          </p>

          <p className="mt-0.5 text-xs text-white/40">
            @{identifier}
          </p>
        </div>
      </div>
    </div>
  );
}