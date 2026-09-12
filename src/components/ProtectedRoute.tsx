import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export function ProtectedRoute() {
  const { user, loading, error, refreshSession } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Checking your session…</p>
        </div>
      </div>
    );
  }

  // A failed session lookup is different from a confirmed signed-out state.
  // Never turn a transient Supabase/network error into a confusing login redirect.
  if (!user && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-6 w-6 text-destructive" />
          <h1 className="text-lg font-semibold">We couldn't restore your session</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Check your connection and try again. You will only be sent to login
            when APIVue can confirm that you are signed out.
          </p>
          <Button
            className="mt-5"
            onClick={() => void refreshSession().catch(() => undefined)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(next)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
