/**
 * APIVue authentication context.
 *
 * Wraps Supabase Auth and exposes a small, stable surface:
 *   user, loading, signIn, signUp, signOut, resetPassword, signInWithGoogle
 *
 * The public API of this module must remain stable — many components
 * consume `useAuth()` and rely on these exact signatures.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

/* ============================================================
 * Types
 * ============================================================ */

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /**
   * Starts the Google OAuth flow.
   *
   * Returns:
   *   - `false` when the browser is being redirected to Google
   *     (the page will unload, so any returned value is moot).
   *   - `true` if the session was already established (rare).
   */
  signInWithGoogle: (redirectPath?: string) => Promise<boolean>;
}

/* ============================================================
 * Context
 * ============================================================ */

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

/* ============================================================
 * Helpers
 * ============================================================ */

function mapUser(u: SupabaseUser): AuthUser {
  return {
    id: u.id,
    email: u.email ?? '',
    name:
      u.user_metadata?.full_name ||
      u.user_metadata?.name ||
      u.email?.split('@')[0],
  };
}

/**
 * Ensures a redirect path is a relative path (not a protocol-relative URL).
 * Prevents open-redirect issues when the path comes from user input
 * (e.g. a `?next=` query parameter).
 */
function safeRedirectPath(
  path: string | undefined,
  fallback = '/dashboard',
): string {
  return path && /^\/(?!\/)/.test(path) ? path : fallback;
}

/* ============================================================
 * Provider
 * ============================================================ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(session?.user ? mapUser(session.user) : null);
      } finally {
        // Always clear the loading flag, even if the session read failed.
        if (mounted) setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ? mapUser(session.user) : null);
    });

    void syncSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        // After email confirmation, send the user to the login page.
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // NOTE: This currently redirects to /forgot-password, the closest
      // existing route. Once a dedicated "set new password" page is added,
      // change this to that route.
      redirectTo: `${window.location.origin}/forgot-password`,
    });
    if (error) throw error;
  };

  const signInWithGoogle = async (redirectPath?: string): Promise<boolean> => {
    const target = safeRedirectPath(redirectPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${target}`,
      },
    });

    if (error) throw error;

    // Supabase redirects the browser by default; if we're still running,
    // no session was established on this pass.
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}