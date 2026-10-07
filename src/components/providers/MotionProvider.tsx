'use client';

import { MotionConfig } from 'framer-motion';

// Honour the iOS "Reduce Motion" setting for every framer-motion animation.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
