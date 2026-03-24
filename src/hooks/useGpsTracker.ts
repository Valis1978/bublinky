'use client';

import { useEffect, useRef, useCallback } from 'react';

const GPS_INTERVAL = 5 * 60 * 1000; // Every 5 minutes

function getUser(): { id: string; role: string } | null {
  try {
    const raw = localStorage.getItem('bub_user');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function useGpsTracker(_userId?: string | null, _role?: string) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getUserData = useCallback(() => getUser(), []);

  useEffect(() => {
    const user = getUserData();
    if (!user || user.role !== 'child') return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const userId = user.id;

    const sendPosition = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
      fetch('/api/activity/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          latitude,
          longitude,
          accuracy,
          altitude,
          speed,
          heading,
        }),
      }).catch(() => {
        // Silent fail
      });
    };

    const requestPosition = () => {
      navigator.geolocation.getCurrentPosition(sendPosition, () => {}, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    };

    // Send immediately on app open
    requestPosition();

    // Then every 5 minutes
    intervalRef.current = setInterval(requestPosition, GPS_INTERVAL);

    // Also send on visibility change (app comes back to foreground)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestPosition();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [getUserData]);
}
