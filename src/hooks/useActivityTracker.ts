'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Activity tracker hook — logs user activity to the server
 * Used on every page to track app usage for parent dashboard
 */
export function useActivityTracker() {
  const pathname = usePathname();
  const lastPageRef = useRef<string | null>(null);
  const sessionStartRef = useRef<number>(Date.now());

  const getUserId = useCallback((): string | null => {
    try {
      const user = localStorage.getItem('bub_user');
      if (user) return JSON.parse(user).id || null;
    } catch { /* ignore */ }
    return null;
  }, []);

  const getUserRole = useCallback((): string | null => {
    try {
      const user = localStorage.getItem('bub_user');
      if (user) return JSON.parse(user).role || null;
    } catch { /* ignore */ }
    return null;
  }, []);

  const logEvent = useCallback(async (eventType: string, eventData?: Record<string, unknown>) => {
    const userId = getUserId();
    const role = getUserRole();

    // Only track child activity (not parent)
    if (!userId || role !== 'child') return;

    try {
      await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, eventType, eventData }),
      });
    } catch {
      // Silently fail — don't break the app
    }
  }, [getUserId, getUserRole]);

  // Log app open (once per session)
  useEffect(() => {
    const role = getUserRole();
    if (role !== 'child') return;

    const sessionLogged = sessionStorage.getItem('bub_session_logged');
    if (!sessionLogged) {
      logEvent('app_open');
      sessionStorage.setItem('bub_session_logged', 'true');
      sessionStartRef.current = Date.now();
    }
  }, [logEvent, getUserRole]);

  // Log page visits
  useEffect(() => {
    if (pathname === lastPageRef.current) return;

    const role = getUserRole();
    if (role !== 'child') return;

    // Log time spent on previous page
    if (lastPageRef.current) {
      const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
      if (duration > 2) { // Only log if spent more than 2 seconds
        logEvent('page_visit', {
          page: lastPageRef.current,
          duration_sec: duration,
        });
      }
    }

    lastPageRef.current = pathname;
    sessionStartRef.current = Date.now();
  }, [pathname, logEvent, getUserRole]);

  // Log app close / background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const role = getUserRole();
        if (role !== 'child') return;

        const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
        logEvent('app_background', {
          page: pathname,
          duration_sec: duration,
          total_session_sec: Math.round((Date.now() - (parseInt(sessionStorage.getItem('bub_session_start') || '0') || Date.now())) / 1000),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pathname, logEvent, getUserRole]);

  return { logEvent };
}
