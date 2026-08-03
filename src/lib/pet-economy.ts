// Economy V2 — shop, inventory, outfit, room, daily gift, stickers.
// Pure functions in the pet-engine style: PetState in → { pet, ... } out.

import type { PetState } from './pet-engine';
import { calculateMood } from './pet-engine';
import { ITEMS, type ItemDef } from './item-catalog';
import { STICKERS, getUncollected } from './sticker-catalog';

export interface EconomyResult {
  pet: PetState;
  ok: boolean;
  message: string;
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

// ————————————————————————————— shop —————————————————————————————

export function buyItem(pet: PetState, itemId: string): EconomyResult {
  const item = ITEMS[itemId];
  if (!item || !item.price) return { pet, ok: false, message: 'Tohle se koupit nedá 🤔' };
  if (pet.coins < item.price) {
    return { pet, ok: false, message: `Chybí ti ${item.price - pet.coins} mincí 🪙` };
  }
  // Non-stackable categories: one is enough
  const stackable = item.type === 'food';
  const owned = pet.inventory[itemId] ?? 0;
  if (!stackable && owned > 0) return { pet, ok: false, message: 'Tohle už máš v batohu!' };

  const updated: PetState = {
    ...pet,
    coins: pet.coins - item.price,
    inventory: { ...pet.inventory, [itemId]: owned + 1 },
  };
  return { pet: updated, ok: true, message: `${item.emoji} ${item.name} je tvoje!` };
}

// ————————————————————————— using items ——————————————————————————

/** Feed food / play with a toy from the inventory (no cooldown — it cost coins). */
export function useItem(pet: PetState, itemId: string): EconomyResult {
  const item = ITEMS[itemId];
  const owned = pet.inventory[itemId] ?? 0;
  if (!item || owned <= 0) return { pet, ok: false, message: 'Tohle v batohu nemáš' };

  if (item.type === 'food') {
    if (pet.isSleeping) return { pet, ok: false, message: 'Pššš... spí! 💤' };
    const updated: PetState = { ...pet, skills: { ...pet.skills }, inventory: { ...pet.inventory } };
    updated.inventory[itemId] = owned - 1;
    if (updated.inventory[itemId] <= 0) delete updated.inventory[itemId];
    for (const e of item.effects ?? []) {
      if (e.stat === 'hunger') updated.hunger = clamp(updated.hunger + e.amount);
      if (e.stat === 'happiness') updated.happiness = clamp(updated.happiness + e.amount);
      if (e.stat === 'energy') updated.energy = clamp(updated.energy + e.amount);
      if (e.stat === 'cleanliness') updated.cleanliness = clamp(updated.cleanliness + e.amount);
    }
    if (item.skillBranch) {
      updated.skills[item.skillBranch] = clamp(updated.skills[item.skillBranch] + 1);
    }
    updated.xp += 3;
    updated.lastFed = new Date().toISOString();
    updated.mood = calculateMood(updated);
    updated.lastUpdate = updated.lastFed;
    return { pet: updated, ok: true, message: `Mňam, ${item.name.toLowerCase()}! ${item.emoji}` };
  }

  if (item.type === 'toy') {
    if (pet.isSleeping) return { pet, ok: false, message: 'Pššš... spí! 💤' };
    const updated: PetState = { ...pet, skills: { ...pet.skills } };
    updated.happiness = clamp(updated.happiness + 15);
    updated.energy = clamp(updated.energy - 8);
    if (item.skillBranch) {
      updated.skills[item.skillBranch] = clamp(updated.skills[item.skillBranch] + 2);
    }
    updated.xp += 6;
    updated.lastPlayed = new Date().toISOString();
    updated.mood = calculateMood(updated);
    updated.lastUpdate = updated.lastPlayed;
    return { pet: updated, ok: true, message: `${item.emoji} To byla zábava!` };
  }

  return { pet, ok: false, message: 'Tohle se používá jinak 😊' };
}

// ————————————————————————— outfit ———————————————————————————————

export function equipAccessory(pet: PetState, itemId: string): EconomyResult {
  const item = ITEMS[itemId];
  if (!item || item.type !== 'accessory' || !item.slot) {
    return { pet, ok: false, message: 'Tohle se nosit nedá' };
  }
  if ((pet.inventory[itemId] ?? 0) <= 0) return { pet, ok: false, message: 'Nejdřív to kup v obchůdku!' };

  const outfit = { ...pet.activeOutfit };
  if (outfit[item.slot] === itemId) {
    delete outfit[item.slot]; // tap again = take off
    return { pet: { ...pet, activeOutfit: outfit }, ok: true, message: `${item.emoji} sundáno` };
  }
  outfit[item.slot] = itemId;
  return { pet: { ...pet, activeOutfit: outfit }, ok: true, message: `${item.emoji} ${item.name} nasazeno!` };
}

export function unequipSlot(pet: PetState, slot: string): PetState {
  const outfit = { ...pet.activeOutfit };
  delete outfit[slot];
  return { ...pet, activeOutfit: outfit };
}

// ————————————————————————— room ————————————————————————————————

export function placeDecoration(pet: PetState, slotId: string, itemId: string | null): EconomyResult {
  if (itemId) {
    const item = ITEMS[itemId];
    if (!item || item.type !== 'decoration') return { pet, ok: false, message: 'Tohle do pokojíčku nepatří' };
    if ((pet.inventory[itemId] ?? 0) <= 0) return { pet, ok: false, message: 'Nejdřív to kup v obchůdku!' };
  }
  const placed = { ...pet.room.placed };
  // one item can sit in only one slot — remove from elsewhere first
  if (itemId) {
    for (const key of Object.keys(placed)) {
      if (placed[key] === itemId) placed[key] = null;
    }
  }
  placed[slotId] = itemId;
  return {
    pet: { ...pet, room: { ...pet.room, placed } },
    ok: true,
    message: itemId ? 'Krásně to tam sedí! ✨' : 'Uklizeno',
  };
}

// ————————————————————————— daily gift ———————————————————————————

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function canClaimGift(pet: PetState): boolean {
  if (!pet.lastGiftClaim) return true;
  const last = new Date(pet.lastGiftClaim);
  if (isNaN(last.getTime())) return true;
  return !isSameLocalDay(last, new Date());
}

export interface GiftReward {
  coins: number;
  stickerId: string | null;
  streak: number;
}

export function claimDailyGift(pet: PetState): { pet: PetState; reward: GiftReward | null } {
  if (!canClaimGift(pet)) return { pet, reward: null };

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last = pet.lastGiftClaim ? new Date(pet.lastGiftClaim) : null;
  const streak = last && isSameLocalDay(last, yesterday) ? pet.giftStreak + 1 : 1;

  const coins = 10 + Math.floor(Math.random() * 16); // 10–25

  // Sticker: from the 'gift' pool; guaranteed every 5th streak day, otherwise 20% chance
  let stickerId: string | null = null;
  const pool = getUncollected(pet.stickers, 'gift');
  if (pool.length > 0 && (streak % 5 === 0 || Math.random() < 0.2)) {
    stickerId = pool[Math.floor(Math.random() * pool.length)].id;
  }

  const updated: PetState = {
    ...pet,
    coins: pet.coins + coins,
    stickers: stickerId ? [...pet.stickers, stickerId] : pet.stickers,
    lastGiftClaim: now.toISOString(),
    giftStreak: streak,
    lastUpdate: now.toISOString(),
  };
  return { pet: updated, reward: { coins, stickerId, streak } };
}

// ————————————————————————— stickers ————————————————————————————

export function awardSticker(pet: PetState, stickerId: string): { pet: PetState; isNew: boolean } {
  if (!STICKERS[stickerId] || pet.stickers.includes(stickerId)) return { pet, isNew: false };
  return { pet: { ...pet, stickers: [...pet.stickers, stickerId] }, isNew: true };
}

/** Items of a type currently in the backpack. */
export function getOwnedByType(pet: PetState, type: ItemDef['type']): { item: ItemDef; count: number }[] {
  return Object.entries(pet.inventory)
    .map(([id, count]) => ({ item: ITEMS[id], count }))
    .filter((e): e is { item: ItemDef; count: number } => Boolean(e.item) && e.count > 0 && e.item.type === type);
}
