/**
 * APIVue theme context.
 *
 * Persists the user's theme choice in localStorage under `apivue-theme`.
 * Falls back to the OS preference (`prefers-color-scheme`) when no
 * choice has been made yet.
 *
 * Also performs a one-time migration of the legacy `sprint-board-theme`
 * key so existing users keep their chosen theme.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'apivue-theme';
const LEGACY_STORAGE_KEY = 'sprint-board-theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/* ============================================================
 * Helpers
 * ============================================================ */

function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;

  // One-time migration from the legacy key.
  const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy === 'light' || legacy === 'dark') {
    window.localStorage.setItem(STORAGE_KEY, legacy);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return legacy;
  }

  return null;
}

function readSystemPreference(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getInitialTheme(): Theme {
  return readStoredTheme() ?? readSystemPreference();
}

/* ============================================================
 * Provider
 * ============================================================ */

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
    root.style.colorScheme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/* ============================================================
 * Hook
 * ============================================================ */

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}