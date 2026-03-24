'use client';

import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useGpsTracker } from '@/hooks/useGpsTracker';

export function ActivityTracker() {
  // Activity tracking reads user from localStorage internally
  useActivityTracker();

  // GPS tracking — reads user from localStorage, only tracks child
  useGpsTracker(null, undefined);

  return null;
}
