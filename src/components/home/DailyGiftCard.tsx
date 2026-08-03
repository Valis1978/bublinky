'use client';

// DailyGiftCard — the daily gift box: claim, persist, sync, reveal.
// Owns its own claim side-effects (savePet + best-effort server sync); reports the
// resulting pet back up so the page's state stays in sync with the rest of the UI.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { canClaimGift, claimDailyGift, type GiftReward } from '@/lib/pet-economy';
import { savePet, type PetState } from '@/lib/pet-engine';
import { STICKERS, stickerFile } from '@/lib/sticker-catalog';
import { hapticSuccess } from '@/lib/haptics';

interface DailyGiftCardProps {
  pet: PetState;
  onClaimed: (pet: PetState) => void;
}

/** Sticker artwork with a 🎁 fallback for ids whose SVG isn't in /public/stickers yet. */
function StickerReveal({ id }: { id: string }) {
  const [failed, setFailed] = useState(false);
  const sticker = STICKERS[id];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-14 h-14 flex items-center justify-center">
        {failed ? (
          <span className="text-4xl">🎁</span>
        ) : (
          <img
            src={stickerFile(id)}
            alt={sticker?.name ?? 'samolepka'}
            className="w-full h-full object-contain"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      {sticker && (
        <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {sticker.name}
        </span>
      )}
    </div>
  );
}

/** Best-effort sync to the server — same fire-and-forget shape used across the pet pages. */
function syncPetToServer(pet: PetState): void {
  try {
    const raw = localStorage.getItem('bub_user');
    const userId = raw ? JSON.parse(raw)?.id : null;
    if (!userId) return;
    fetch('/api/pet', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, pet }),
    }).catch(() => {});
  } catch {
    /* corrupted bub_user — skip sync, local state already saved */
  }
}

export function DailyGiftCard({ pet, onClaimed }: DailyGiftCardProps) {
  const [reward, setReward] = useState<GiftReward | null>(null);
  const claimable = canClaimGift(pet);

  const handleClaim = () => {
    if (!claimable) return;
    const result = claimDailyGift(pet);
    if (!result.reward) return;

    savePet(result.pet);
    onClaimed(result.pet);
    syncPetToServer(result.pet);
    setReward(result.reward);
    void hapticSuccess();
  };

  // Just claimed this session — reveal animation
  if (reward) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 16, stiffness: 260 }}
        className="rounded-3xl p-4 text-center"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}
      >
        <p className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Dáreček otevřen! 🎉
        </p>
        <div className="flex items-center justify-center gap-4">
          <div>
            <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>+{reward.coins} 🪙</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>mincí</p>
          </div>
          {reward.stickerId && <StickerReveal id={reward.stickerId} />}
        </div>
        <p className="text-xs mt-2 font-bold" style={{ color: 'var(--accent)' }}>
          🔥 {reward.streak}. den v řadě
        </p>
      </motion.div>
    );
  }

  // Already claimed earlier today
  if (!claimable) {
    return (
      <div
        className="rounded-3xl p-3 flex items-center justify-between gap-2"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Dáreček máš! Zítra tu bude nový 🎁
        </p>
        {pet.giftStreak > 0 && (
          <span className="text-xs font-bold flex-shrink-0" style={{ color: '#F59E0B' }}>
            🔥 {pet.giftStreak}. den
          </span>
        )}
      </div>
    );
  }

  // Unclaimed — closed box, tappable
  return (
    <motion.button
      onClick={handleClaim}
      whileTap={{ scale: 0.97 }}
      className="w-full rounded-3xl p-4 flex items-center gap-3 text-left"
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
    >
      <motion.span
        className="text-4xl flex-shrink-0"
        animate={{ rotate: [0, -8, 8, -8, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
      >
        🎁
      </motion.span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
        Dneska tu na tebe čeká dáreček!
      </span>
    </motion.button>
  );
}
