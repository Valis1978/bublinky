// Sticker milestone engine — pure logic + localStorage counters for the album.
// Tracks quiz/game completions (not stored on PetState) and checks all sticker
// milestones (counters + pet stats) to award newly-earned stickers.

import { loadPet, savePet, type PetState } from './pet-engine';
import { awardSticker } from './pet-economy';

const COUNTER_KEY = 'bub_counters';

export interface Counters {
  quizzes: number;
  games: number;
}

const DEFAULT_COUNTERS: Counters = { quizzes: 0, games: 0 };

export function getCounters(): Counters {
  if (typeof window === 'undefined') return { ...DEFAULT_COUNTERS };
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (!raw) return { ...DEFAULT_COUNTERS };
    const parsed = JSON.parse(raw) as Partial<Counters>;
    return { quizzes: parsed.quizzes ?? 0, games: parsed.games ?? 0 };
  } catch {
    return { ...DEFAULT_COUNTERS };
  }
}

function saveCounters(counters: Counters): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COUNTER_KEY, JSON.stringify(counters));
}

/** Increment a counter (quiz completed / game played) and persist it. SSR-safe no-op on the server. */
export function bumpCounter(kind: 'quizzes' | 'games'): Counters {
  const counters = getCounters();
  const updated: Counters = { ...counters, [kind]: counters[kind] + 1 };
  saveCounters(updated);
  return updated;
}

/**
 * Pure check of every sticker milestone against the current pet + counters.
 * Returns sticker ids that meet their threshold and are not yet in pet.stickers.
 */
export function checkMilestones(pet: PetState, counters: Counters): string[] {
  const candidates: [id: string, met: boolean][] = [
    ['st_knizka', counters.quizzes >= 3],
    ['st_mozek', counters.quizzes >= 10],
    ['st_puzzle', counters.games >= 5],
    ['st_medaile', counters.games >= 20],
    ['st_lizatko', pet.foodBravery >= 5],
    ['st_dort', pet.foodBravery >= 15],
    ['st_ohnostroj', pet.giftStreak >= 7],
    ['st_koruna', pet.giftStreak >= 30],
    // the secret one — earned by chatting a lot with the pet (charisma grows per chat)
    ['st_bublina', pet.skills.charisma >= 25],
  ];

  return candidates.filter(([id, met]) => met && !pet.stickers.includes(id)).map(([id]) => id);
}

/**
 * Loads the current pet, checks milestones against the persisted counters,
 * awards + persists any newly-earned stickers. Returns null when there is no
 * saved pet yet, or nothing new to award.
 */
export function runStickerCheck(): { pet: PetState; newIds: string[] } | null {
  const pet = loadPet();
  if (!pet) return null;

  const counters = getCounters();
  const newIds = checkMilestones(pet, counters);
  if (newIds.length === 0) return null;

  let updated = pet;
  for (const id of newIds) {
    updated = awardSticker(updated, id).pet;
  }
  savePet(updated);

  return { pet: updated, newIds };
}
