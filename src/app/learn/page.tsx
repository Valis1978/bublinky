'use client';

import { BottomNav } from '@/components/ui/BottomNav';
import { GraduationCap } from 'lucide-react';

export default function LearnPage() {
  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
        <div
          className="w-16 h-16 rounded-3xl flex items-center justify-center"
          style={{ background: 'var(--accent-soft)' }}
        >
          <GraduationCap size={32} style={{ color: 'var(--accent)' }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Učení
        </h2>
        <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          Brzy! Čeština, matika a další předměty.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
