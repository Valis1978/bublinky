'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { stickerFile, STICKER_RARITY_COLORS, type StickerDef } from '@/lib/sticker-catalog';

interface StickerGridProps {
  stickers: StickerDef[];
  collected: string[];
}

/** 3-column grid of sticker cards — collected show art, uncollected show a locked hint. */
export function StickerGrid({ stickers, collected }: StickerGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stickers.map(sticker => (
        <StickerCard key={sticker.id} sticker={sticker} owned={collected.includes(sticker.id)} />
      ))}
    </div>
  );
}

function StickerCard({ sticker, owned }: { sticker: StickerDef; owned: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!owned) {
    return (
      <div
        className="rounded-2xl p-2.5 flex flex-col items-center gap-1 text-center"
        style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border)' }}
      >
        <div
          className="w-full flex items-center justify-center text-3xl font-bold rounded-xl"
          style={{ aspectRatio: '1', background: 'var(--bg-card)', color: 'var(--text-muted)' }}
        >
          ?
        </div>
        <p className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>???</p>
        <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>{sticker.hint}</p>
      </div>
    );
  }

  const rarityColor = STICKER_RARITY_COLORS[sticker.rarity];

  return (
    <motion.div
      whileTap={{ rotate: [0, -8, 8, -4, 0], scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-2.5 flex flex-col items-center gap-1 text-center"
      style={{ background: 'var(--bg-card)', border: `2px solid ${rarityColor}`, boxShadow: 'var(--shadow)' }}
    >
      <div className="w-full flex items-center justify-center" style={{ aspectRatio: '1' }}>
        {imgFailed ? (
          <span className="text-3xl">🎁</span>
        ) : (
          <img
            src={stickerFile(sticker.id)}
            className="w-full aspect-square object-contain"
            style={{ aspectRatio: '1' }}
            alt={sticker.name}
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
      <p className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{sticker.name}</p>
    </motion.div>
  );
}
