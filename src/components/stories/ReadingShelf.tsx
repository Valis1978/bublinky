'use client';

// "Polička" — books Viki met inside stories and wanted to keep.
// A shelf of memories: no counters, no percentages, no streaks, no rewards.
// Tapping a book just says where she is with it, and finished ones get a
// warm line from her pet.

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { ReadingLogEntry, ReadingStatus } from '@/types/story';
import { hapticTap, hapticSuccess } from '@/lib/haptics';
import { petDoneLine, readList, spineTint } from './shared';

const STATUS_META: Record<ReadingStatus, { emoji: string; label: string; next: ReadingStatus }> = {
  wishlist: { emoji: '📖', label: 'chci si přečíst', next: 'reading' },
  reading: { emoji: '🔖', label: 'čtu', next: 'done' },
  done: { emoji: '🌟', label: 'dočteno', next: 'wishlist' },
};

/** Books per shelf row. */
const PER_ROW = 2;

interface ReadingShelfProps {
  userId: string | null;
  /** bump to refetch */
  refreshKey: number;
}

export function ReadingShelf({ userId, refreshKey }: ReadingShelfProps) {
  const [entries, setEntries] = useState<ReadingLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetch(`/api/reading-log?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then((payload: unknown) => {
        if (alive) setEntries(readList<ReadingLogEntry>(payload, 'entries', 'books'));
      })
      .catch(() => { /* offline — empty shelf is fine */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId, refreshKey]);

  const cycleStatus = async (entry: ReadingLogEntry) => {
    const next = STATUS_META[entry.status]?.next ?? 'wishlist';
    void (next === 'done' ? hapticSuccess() : hapticTap());
    const previous = entry.status;
    setEntries(list => list.map(e => (e.id === entry.id ? { ...e, status: next } : e)));
    try {
      const res = await fetch('/api/reading-log', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id, status: next }),
      });
      if (!res.ok) throw new Error('patch failed');
    } catch {
      setEntries(list => list.map(e => (e.id === entry.id ? { ...e, status: previous } : e)));
    }
  };

  // Without a user there is nothing to wait for — show the empty shelf.
  if (loading && userId) {
    return (
      <div className="space-y-3">
        <div className="h-36 rounded-3xl animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
        <div className="h-36 rounded-3xl animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-3xl p-6 text-center space-y-2" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
          <div className="text-[34px]">📚</div>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Polička zatím čeká na první knížku.
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Když do příběhu přijde návštěva z nějaké knížky, můžeš si ji sem odložit.
          </p>
        </div>
        <ShelfPlank />
      </div>
    );
  }

  const rows: ReadingLogEntry[][] = [];
  for (let i = 0; i < entries.length; i += PER_ROW) rows.push(entries.slice(i, i + PER_ROW));

  return (
    <div className="space-y-6 pb-6">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex}>
          <div className="grid gap-3 items-end" style={{ gridTemplateColumns: `repeat(${PER_ROW}, minmax(0, 1fr))` }}>
            {row.map((entry, i) => (
              <BookSpine
                key={entry.id}
                entry={entry}
                tall={(rowIndex + i) % 2 === 0}
                onTap={() => void cycleStatus(entry)}
              />
            ))}
          </div>
          <ShelfPlank />
        </div>
      ))}

      <p className="text-center text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Ťukni na knížku a přepni, jak na tom s ní jsi 📖 → 🔖 → 🌟
      </p>
    </div>
  );
}

function BookSpine({ entry, tall, onTap }: { entry: ReadingLogEntry; tall: boolean; onTap: () => void }) {
  const status = STATUS_META[entry.status] ?? STATUS_META.wishlist;
  const tint = spineTint(entry.id + entry.bookTitle);
  const isDone = entry.status === 'done';

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onTap}
      aria-label={`${entry.bookTitle} — ${status.label}, ťuknutím změníš`}
      className="w-full flex flex-col gap-1 text-left overflow-hidden"
      style={{
        minHeight: tall ? 156 : 138,
        touchAction: 'manipulation',
        padding: '10px 12px 12px 16px',
        borderRadius: '6px 14px 4px 4px',
        background: tint.face,
        borderLeft: `7px solid ${tint.edge}`,
        boxShadow: 'var(--shadow)',
      }}
    >
      <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
        <span className="text-[15px] leading-none" aria-hidden>{status.emoji}</span>
        {status.label}
      </span>

      <span className="block text-[13px] font-bold leading-snug mt-0.5" style={{ color: 'var(--text-primary)' }}>
        {entry.bookTitle}
      </span>

      {entry.author && (
        <span className="block text-[11px] leading-snug" style={{ color: 'var(--text-primary)', opacity: 0.65 }}>
          {entry.author}
        </span>
      )}

      {isDone && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="block text-[11px] italic leading-snug mt-auto pt-2"
          style={{ color: 'var(--text-primary)', opacity: 0.8 }}
        >
          🐾 {petDoneLine(entry.id)}
        </motion.span>
      )}
    </motion.button>
  );
}

/** Wooden plank under a row — SVG artwork, the one place raw hex belongs. */
function ShelfPlank() {
  return (
    <svg
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      className="w-full block"
      style={{ height: 13, borderRadius: 3, boxShadow: 'var(--shadow)' }}
      aria-hidden
    >
      <rect x="0" y="0" width="100" height="2.4" fill="#D6A66E" />
      <rect x="0" y="2.4" width="100" height="5" fill="#B37F4C" />
      <rect x="0" y="7.4" width="100" height="2.6" fill="#8A5C33" />
      <rect x="12" y="3" width="26" height="0.7" fill="#9C6C3E" opacity="0.7" />
      <rect x="58" y="4.6" width="18" height="0.6" fill="#9C6C3E" opacity="0.6" />
    </svg>
  );
}
