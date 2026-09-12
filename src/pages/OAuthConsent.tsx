import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Legacy OAuth consent page.
 *
 * This route was used by a previous authentication provider and is no
 * longer part of the APIVue flow. It now redirects to /login so any
 * stale bookmark resolves cleanly.
 *
 * Safe to delete this file and its route in App.tsx.
 */
export function OAuthConsent() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Redirecting to sign in…
        </p>
      </div>
    </div>
  );
}