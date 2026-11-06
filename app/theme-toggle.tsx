'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { DEFAULT_THEME, THEME_SCRIPT, THEME_STORAGE_KEY, type Theme } from './lib/theme';

const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable in private mode; the theme still applies.
    }
    const root = document.documentElement;
    root.setAttribute('data-theme', next);
    root.style.colorScheme = next;
  }, []);
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === 'light' || stored === 'dark') setThemeState(stored);
  }, []);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeToggle({ ar = false }: { ar?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = !mounted || theme !== 'light';
  const label = dark ? (ar ? 'الوضع الفاتح' : 'Mode clair') : ar ? 'الوضع الداكن' : 'Mode sombre';
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      title={label}
      disabled={!mounted}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
    >
      {dark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      <span className="theme-toggle-label">{label}</span>
    </button>
  );
}
