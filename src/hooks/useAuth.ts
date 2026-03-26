'use client';

import { useState, useCallback } from 'react';
import type { UserRole } from '@/types/database';

interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  theme: string;
  avatar_url: string | null;
}

function loadStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('bub_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem('bub_user');
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());
  const [loading] = useState(false);

  const login = useCallback(
    async (pin: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, role }),
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.data);
        localStorage.setItem('bub_user', JSON.stringify(data.data));
        return { success: true };
      }

      return { success: false, error: data.error };
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    localStorage.removeItem('bub_user');
    window.location.href = '/login';
  }, []);

  return { user, loading, login, logout };
}
