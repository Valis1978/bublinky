'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserRole } from '@/types/database';

interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  theme: string;
  avatar_url: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read user from localStorage (set after login)
    const stored = localStorage.getItem('bub_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('bub_user');
      }
    }
    setLoading(false);
  }, []);

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
