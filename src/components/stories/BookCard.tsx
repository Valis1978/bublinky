'use client';

// Factual book card — lives OUTSIDE the fiction, after the story ends.
// It states where the guest character comes from and offers the shelf. No
// "you should read this", no rewards, no pressure — just the facts and a door.

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { CameoDef } from '@/lib/story-cameos';
import { hapticTap, hapticSuccess } from '@/lib/haptics';

type AddState = 'idle' | 'saving' | 'added' | 'error';

interface BookCardProps {
  cameo: CameoDef;
  userId: string | null;
}

export function BookCard({ cameo, userId }: BookCardProps) {
  const [state, setState] = useState<AddState>('idle');

  const addToShelf = async () => {
    if (!userId || state === 'saving' || state === 'added') return;
    setState('saving');
    void hapticTap();
    try {
      const res = await fetch('/api/reading-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          bookTitle: cameo.book,
          author: cameo.author,
          cameoId: cameo.id,
          status: 'wishlist',
        }),
      });
      if (!res.ok) throw new Error('save failed');
      setState('added');
      void hapticSuccess();
    } catch {
      setState('error');
    }
  };

  return (
    <div
      className="rounded-3xl p-4 space-y-3"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-[32px] leading-none flex-shrink-0" aria-hidden>{cameo.emoji}</span>
        <div className="min-w-0">
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {cameo.name} je z knížky
          </p>
          <p className="text-[15px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
            {cameo.book}
          </p>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {cameo.author}
          </p>
        </div>
      </div>

      {userId && state !== 'added' && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => void addToShelf()}
          disabled={state === 'saving'}
          className="w-full rounded-2xl text-[15px] font-bold disabled:opacity-60"
          style={{
            minHeight: 60,
            touchAction: 'manipulation',
            background: 'var(--accent-soft)',
            color: 'var(--text-primary)',
            border: '2px solid var(--accent)',
          }}
        >
          {state === 'saving' ? 'Ukládám…' : 'Přidat na moji poličku 📚'}
        </motion.button>
      )}

      {state === 'added' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full rounded-2xl flex items-center justify-center text-[15px] font-bold"
          style={{
            minHeight: 60,
            background: 'color-mix(in srgb, var(--mint) 30%, var(--bg-card))',
            color: 'var(--text-primary)',
          }}
        >
          ✓ Je na poličce
        </motion.div>
      )}

      {state === 'error' && (
        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Teď to nešlo uložit, zkus to za chvilku 💛
        </p>
      )}
    </div>
  );
}
