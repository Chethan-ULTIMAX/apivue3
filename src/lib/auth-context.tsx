/**
 * APIVue authentication context.
 *
 * Supabase owns the session. This provider deliberately waits for the
 * initial session lookup before protected routes can redirect, preventing
 * the common "logged in -> immediately sent to login" race.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: (redirectPath?: string) => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

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

export function safeRedirectPath(
  path: string | undefined,
  fallback = '/dashboard',
): string {
  return path && /^\/(?!\/)/.test(path) ? path : fallback;
}

/** Build an absolute URL that includes Vite's deployment base path. */
export function appUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  return new URL(`${normalizedBase}${normalizedPath}`, window.location.origin).toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = async () => {
    setError(null);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      setUser(session?.user ? mapUser(session.user) : null);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : 'Unable to read your session.');
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (!mounted) return;
        if (sessionError) throw sessionError;
        setUser(session?.user ? mapUser(session.user) : null);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setUser(null);
        setError(
          err instanceof Error ? err.message : 'Unable to restore your session.',
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ? mapUser(session.user) : null);
      setError(null);
      setLoading(false);
    });

    void initialize();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: appUrl('/login'),
      },
    });
    if (signUpError) throw signUpError;
  };

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
  };

  const resetPassword = async (email: string) => {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: appUrl('/reset-password'),
    });
    if (resetError) throw resetError;
  };

  const signInWithGoogle = async (redirectPath?: string): Promise<boolean> => {
    const target = safeRedirectPath(redirectPath);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: appUrl(target),
      },
    });
    if (oauthError) throw oauthError;
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        signInWithGoogle,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
