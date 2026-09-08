interface ConnectionStatusProps {
  connected: boolean;
  username?: string;
  handle?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  loading?: boolean;
}

export function ConnectionStatus({
  connected,
  username,
  handle,
  onConnect,
  onDisconnect,
  loading = false,
}: ConnectionStatusProps) {
  if (connected) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4">
        <div>
          <p className="text-xs text-white/35">
            Connected account
          </p>

          <p className="mt-1 text-sm font-medium text-white">
            @{username ?? handle}
          </p>
        </div>

        <button
          type="button"
          onClick={onDisconnect}
          disabled={loading}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/60 transition hover:border-red-400/20 hover:bg-red-400/5 hover:text-red-300 disabled:opacity-50"
        >
          {loading
            ? 'Disconnecting...'
            : 'Disconnect'}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onConnect}
      disabled={loading}
      className="w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? 'Connecting...' : 'Connect'}
    </button>
  );
}