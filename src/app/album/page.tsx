'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { BottomNav } from '@/components/ui/BottomNav';
import { StickerGrid } from '@/components/stickers/StickerGrid';
import { runStickerCheck } from '@/lib/sticker-awards';
import { loadPet, type PetState } from '@/lib/pet-engine';
import { STICKER_LIST, STICKERS, stickerFile, type StickerRarity } from '@/lib/sticker-catalog';

const RARITY_SECTIONS: { rarity: StickerRarity; label: string }[] = [
  { rarity: 'legendary', label: 'Legendární ✨' },
  { rarity: 'rare', label: 'Vzácné 💜' },
  { rarity: 'common', label: 'Obyčejné' },
];

// Fixed confetti burst — a handful of dots, no randomness needed for a one-shot celebration.
const CONFETTI: { left: string; color: string }[] = [
  { left: '12%', color: 'var(--accent)' },
  { left: '25%', color: 'var(--mint)' },
  { left: '38%', color: 'var(--lavender)' },
  { left: '50%', color: 'var(--coral)' },
  { left: '62%', color: 'var(--accent)' },
  { left: '75%', color: 'var(--mint)' },
  { left: '88%', color: 'var(--lavender)' },
  { left: '20%', color: 'var(--coral)' },
];

/** Sticker art with a 🎁 fallback for ids whose artwork isn't in /public/stickers yet. */
function CelebrationImage({ id, name }: { id: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="w-32 h-32 flex items-center justify-center">
      {failed ? (
        <span className="text-6xl">🎁</span>
      ) : (
        <img
          src={stickerFile(id)}
          className="w-full h-full object-contain"
          alt={name}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export default function AlbumPage() {
  // Start null (matches server render) — pet data is client-only (localStorage)
  // and must be read after mount to avoid a hydration mismatch.
  const [pet, setPet] = useState<PetState | null>(null);
  const [queue, setQueue] = useState<string[]>([]);

  // Check for freshly-earned stickers once, on mount.
  useEffect(() => {
    const result = runStickerCheck();
    if (result) {
      setPet(result.pet);
      setQueue(result.newIds);
    } else {
      setPet(loadPet());
    }
  }, []);

  const collected = pet?.stickers ?? [];
  const total = STICKER_LIST.length;
  const percent = total > 0 ? (collected.length / total) * 100 : 0;

  const currentId = queue[0];
  const currentSticker = currentId ? STICKERS[currentId] : null;

  const dismissCelebration = () => setQueue(q => q.slice(1));

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto pb-nav safe-top">
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-4 py-3 space-y-2.5"
          style={{
            background: 'var(--bg-nav)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1" style={{ color: 'var(--text-muted)' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold flex-1" style={{ color: 'var(--text-primary)' }}>
              🌈 Samolepky
            </h1>
            <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
              {collected.length} / {total}
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--accent-gradient)' }}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Sections by rarity */}
        <div className="p-4 space-y-6">
          {RARITY_SECTIONS.map(section => {
            const stickers = STICKER_LIST.filter(s => s.rarity === section.rarity);
            if (stickers.length === 0) return null;
            return (
              <div key={section.rarity} className="space-y-2.5">
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {section.label}
                </h2>
                <StickerGrid stickers={stickers} collected={collected} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Celebration modal — one new sticker at a time */}
      <AnimatePresence mode="wait">
        {currentSticker && (
          <motion.div
            key={currentSticker.id}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 overflow-hidden"
            style={{ background: 'rgba(31,31,31,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissCelebration}
          >
            {CONFETTI.map((dot, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full"
                style={{ left: dot.left, top: '35%', width: 10, height: 10, background: dot.color }}
                initial={{ y: 0, opacity: 1, scale: 0 }}
                animate={{ y: [0, -70, 100], opacity: [1, 1, 0], scale: [0, 1, 1] }}
                transition={{ duration: 1.1, delay: i * 0.06, ease: 'easeOut' }}
              />
            ))}

            <motion.div
              initial={{ scale: 0.5, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="rounded-3xl p-6 flex flex-col items-center gap-2 max-w-xs w-full text-center"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}
            >
              <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>✨ Nová samolepka! ✨</p>
              <CelebrationImage id={currentSticker.id} name={currentSticker.name} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {currentSticker.name}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ťukni pro zavření</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
