import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const identifier = username ?? handle;

  if (connected) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Connected account
          </p>
          {identifier && (
            <p className="mt-1 text-sm font-medium text-foreground">
              @{identifier}
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDisconnect}
          disabled={loading}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {loading ? 'Disconnecting…' : 'Disconnect'}
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={onConnect}
      disabled={loading}
      className="w-full"
    >
      {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
      {loading ? 'Connecting…' : 'Connect'}
    </Button>
  );
}