'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import type { PetState } from '@/lib/pet-engine';
import { getShopItems, RARITY_COLORS, type ItemDef } from '@/lib/item-catalog';
import { buyItem } from '@/lib/pet-economy';

interface ShopPanelProps {
  pet: PetState;
  onUpdate: (result: { pet: PetState; message: string }) => void;
}

type ShopCategory = Extract<ItemDef['type'], 'food' | 'toy' | 'accessory' | 'decoration'>;

const CATEGORIES: { id: ShopCategory; label: string; emoji: string }[] = [
  { id: 'food', label: 'Jídlo', emoji: '🍎' },
  { id: 'toy', label: 'Hračky', emoji: '🧸' },
  { id: 'accessory', label: 'Oblečky', emoji: '🎀' },
  { id: 'decoration', label: 'Pokojíček', emoji: '🛋️' },
];

// Only food is stackable — everything else can be owned just once.
function isSoldOut(pet: PetState, item: ItemDef): boolean {
  if (item.type === 'food') return false;
  return (pet.inventory[item.id] ?? 0) > 0;
}

function cardAnimation(itemId: string, shakeId: string | null, successId: string | null) {
  if (shakeId === itemId) return { x: [0, -6, 6, -6, 6, 0], scale: 1 };
  if (successId === itemId) return { scale: [1, 1.15, 1], x: 0 };
  return { x: 0, scale: 1 };
}

/** Small home-grown confetti burst — framer-motion only, no extra libs. */
function ConfettiBurst() {
  const particles = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);
  const colors = ['var(--accent)', 'var(--mint)', 'var(--lavender)', '#F59E0B'];
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {particles.map((angle, i) => (
        <motion.span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{ background: colors[i % colors.length] }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos(angle) * 34, y: Math.sin(angle) * 34, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

export function ShopPanel({ pet, onUpdate }: ShopPanelProps) {
  const [category, setCategory] = useState<ShopCategory>('food');
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const items = getShopItems().filter(i => i.type === category);

  const handleBuy = (item: ItemDef) => {
    if (isSoldOut(pet, item)) return;
    const result = buyItem(pet, item.id);
    if (result.ok) {
      setSuccessId(item.id);
      setTimeout(() => setSuccessId(null), 600);
    } else {
      setShakeId(item.id);
      setTimeout(() => setShakeId(null), 500);
    }
    onUpdate(result);
  };

  return (
    <div className="h-full overflow-y-auto p-4 pb-8">
      {/* Balance */}
      <div className="flex justify-center mb-3">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)', color: '#F59E0B' }}
        >
          <Coins size={16} />
          {pet.coins}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => {
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors"
              style={{
                background: active ? 'var(--accent)' : 'var(--bg-card)',
                color: active ? '#FFFFFF' : 'var(--text-muted)',
                boxShadow: 'var(--shadow)',
              }}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {items.map(item => {
          const soldOut = isSoldOut(pet, item);
          const rarityColor = RARITY_COLORS[item.rarity];
          return (
            <motion.button
              key={item.id}
              disabled={soldOut}
              onClick={() => handleBuy(item)}
              whileTap={soldOut ? {} : { scale: 0.94 }}
              animate={cardAnimation(item.id, shakeId, successId)}
              transition={{ duration: shakeId === item.id ? 0.4 : 0.5 }}
              className="relative flex flex-col items-center gap-1 p-3 rounded-2xl disabled:opacity-70"
              style={{
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow)',
                border: `2px solid ${soldOut ? 'var(--border)' : rarityColor}`,
              }}
            >
              {successId === item.id && <ConfettiBurst />}

              {soldOut && (
                <span
                  className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  Máš
                </span>
              )}

              <span className="text-3xl">{item.emoji}</span>
              <span className="text-xs font-medium text-center leading-tight" style={{ color: 'var(--text-primary)' }}>
                {item.name}
              </span>

              {!soldOut && (
                <span
                  className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
                  style={{ background: 'var(--bg-secondary)', color: '#F59E0B' }}
                >
                  <Coins size={10} /> {item.price}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {items.length === 0 && (
        <p className="text-center text-xs mt-8" style={{ color: 'var(--text-muted)' }}>
          Tady zatím nic není 🤷
        </p>
      )}

      <p className="text-center text-[11px] mt-6" style={{ color: 'var(--text-muted)' }}>
        Mince získáš za úkoly, hry a péči o mazlíčka 🪙
      </p>
    </div>
  );
}
