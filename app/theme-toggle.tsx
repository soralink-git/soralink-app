'use client';
import { ThemeProvider, useTheme } from 'next-themes';
import { useEffect, useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';

export function AppearanceProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="soralink-theme"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
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
