'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'viki' | 'tata';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function detectInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'viki';
  try {
    const stored = localStorage.getItem('bub_user');
    if (!stored) return 'viki';
    const user = JSON.parse(stored);
    return user.role === 'parent' ? 'tata' : 'viki';
  } catch {
    return 'viki';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => detectInitialTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
