'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'viki' | 'tata';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'viki',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('viki');

  useEffect(() => {
    const stored = localStorage.getItem('bub_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        const t = user.role === 'parent' ? 'tata' : 'viki';
        setTheme(t);
        document.documentElement.setAttribute('data-theme', t);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
