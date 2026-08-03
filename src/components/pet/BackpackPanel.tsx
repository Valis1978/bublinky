'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { PetState } from '@/lib/pet-engine';
import type { AccessorySlot, ItemDef } from '@/lib/item-catalog';
import { getOwnedByType, useItem, equipAccessory, placeDecoration } from '@/lib/pet-economy';

interface BackpackPanelProps {
  pet: PetState;
  onUpdate: (result: { pet: PetState; message: string }) => void;
}

type Owned = { item: ItemDef; count: number };
type WornOwned = { item: ItemDef & { slot: AccessorySlot }; count: number };
type PlaceableOwned = { item: ItemDef & { roomSlot: NonNullable<ItemDef['roomSlot']> }; count: number };

function Section({ title, emoji, children }: { title: string; emoji: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>
        {emoji} {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function ActionRow({
  item, count, highlighted, actionLabel, onAction,
}: {
  item: ItemDef;
  count?: number;
  highlighted?: boolean;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow)',
        border: `2px solid ${highlighted ? 'var(--accent)' : 'transparent'}`,
      }}
    >
      <span className="text-2xl flex-shrink-0">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
          {highlighted && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex-shrink-0">
              <Check size={12} style={{ color: 'var(--accent)' }} />
            </motion.span>
          )}
        </div>
        {typeof count === 'number' && (
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>×{count}</p>
        )}
      </div>
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={onAction}
        className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
        style={{
          background: highlighted ? 'var(--bg-secondary)' : 'var(--accent)',
          color: highlighted ? 'var(--text-primary)' : '#FFFFFF',
        }}
      >
        {actionLabel}
      </motion.button>
    </div>
  );
}

/** Souvenirs / badges — collectibles with no action, just admire them. */
function DisplayGrid({ items }: { items: Owned[] }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map(({ item }) => (
        <div
          key={item.id}
          className="flex flex-col items-center gap-1 p-2 rounded-xl text-center"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
        >
          <span className="text-2xl">{item.emoji}</span>
          <span className="text-[11px] font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BackpackPanel({ pet, onUpdate }: BackpackPanelProps) {
  const food = getOwnedByType(pet, 'food');
  const toys = getOwnedByType(pet, 'toy');
  const accessories = getOwnedByType(pet, 'accessory').filter(
    (e): e is WornOwned => Boolean(e.item.slot)
  );
  const decorations = getOwnedByType(pet, 'decoration').filter(
    (e): e is PlaceableOwned => Boolean(e.item.roomSlot)
  );
  const souvenirs = getOwnedByType(pet, 'souvenir');
  const badges = getOwnedByType(pet, 'badge');

  const totalOwned = food.length + toys.length + accessories.length + decorations.length + souvenirs.length + badges.length;

  if (totalOwned === 0) {
    return (
      <div className="h-full overflow-y-auto p-4 pb-8 flex flex-col items-center justify-center text-center gap-2">
        <span className="text-5xl">🎒</span>
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Batoh je zatím prázdný
        </p>
        <p className="text-xs max-w-[220px]" style={{ color: 'var(--text-muted)' }}>
          Mrkni do Obchůdku a vyber mazlíčkovi něco hezkého!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 pb-8">
      {food.length > 0 && (
        <Section title="Jídlo" emoji="🍎">
          {food.map(({ item, count }) => (
            <ActionRow
              key={item.id}
              item={item}
              count={count}
              actionLabel="Nakrmit"
              onAction={() => onUpdate(useItem(pet, item.id))}
            />
          ))}
        </Section>
      )}

      {toys.length > 0 && (
        <Section title="Hračky" emoji="🧸">
          {toys.map(({ item }) => (
            <ActionRow
              key={item.id}
              item={item}
              actionLabel="Hrát si"
              onAction={() => onUpdate(useItem(pet, item.id))}
            />
          ))}
        </Section>
      )}

      {accessories.length > 0 && (
        <Section title="Oblečky" emoji="🎀">
          {accessories.map(({ item }) => {
            const equipped = pet.activeOutfit[item.slot] === item.id;
            return (
              <ActionRow
                key={item.id}
                item={item}
                highlighted={equipped}
                actionLabel={equipped ? 'Sundat' : 'Nasadit'}
                onAction={() => onUpdate(equipAccessory(pet, item.id))}
              />
            );
          })}
        </Section>
      )}

      {decorations.length > 0 && (
        <Section title="Pokojíček" emoji="🛋️">
          {decorations.map(({ item }) => {
            const placed = pet.room.placed[item.roomSlot] === item.id;
            return (
              <ActionRow
                key={item.id}
                item={item}
                highlighted={placed}
                actionLabel={placed ? 'Uklidit' : 'Umístit'}
                onAction={() => onUpdate(placeDecoration(pet, item.roomSlot, placed ? null : item.id))}
              />
            );
          })}
        </Section>
      )}

      {souvenirs.length > 0 && (
        <Section title="Suvenýry" emoji="🗺️">
          <DisplayGrid items={souvenirs} />
        </Section>
      )}

      {badges.length > 0 && (
        <Section title="Odznaky" emoji="🏅">
          <DisplayGrid items={badges} />
        </Section>
      )}
    </div>
  );
}
