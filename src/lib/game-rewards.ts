// Coin rewards for minigames — earned into the pet's wallet.
// Anti-farm: only the first REWARD_CAP rounds per game per day pay out.

import { loadPet, savePet, calculateMood } from './pet-engine';

const CAP_KEY = 'bub_game_rewards';
const REWARD_CAP = 3;

interface RewardState {
  day: string; // YYYY-MM-DD local
  counts: Record<string, number>;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadState(): RewardState {
  const empty = { day: todayKey(), counts: {} };
  if (typeof window === 'undefined') return empty;
  try {
    const raw = localStorage.getItem(CAP_KEY);
    if (!raw) return empty;
    const st = JSON.parse(raw) as RewardState;
    return st.day === todayKey() ? st : empty;
  } catch {
    return empty;
  }
}

export interface GameReward {
  coins: number;
  /** false when the daily cap for this game is spent (still fun, no coins) */
  rewarded: boolean;
  /** rounds left today for this game */
  roundsLeft: number;
}

/**
 * Award coins for a finished round. `score01` is the game's own 0..1 rating of
 * the round (0 = poor, 1 = great); coins = 3..15 scaled by it.
 * Also nudges the pet: playing together = happiness.
 */
export function awardGameCoins(gameId: string, score01: number): GameReward {
  const st = loadState();
  const used = st.counts[gameId] ?? 0;
  if (used >= REWARD_CAP) {
    return { coins: 0, rewarded: false, roundsLeft: 0 };
  }

  const clamped = Math.min(1, Math.max(0, score01));
  const coins = Math.round(3 + clamped * 12);

  st.counts[gameId] = used + 1;
  try { localStorage.setItem(CAP_KEY, JSON.stringify(st)); } catch { /* full */ }

  const pet = loadPet();
  if (pet) {
    const updated = { ...pet, coins: pet.coins + coins };
    updated.happiness = Math.min(100, updated.happiness + 3);
    updated.xp += 2;
    updated.mood = calculateMood(updated);
    updated.lastUpdate = new Date().toISOString();
    savePet(updated);
  }

  return { coins, rewarded: true, roundsLeft: REWARD_CAP - st.counts[gameId] };
}

/** Rounds still paying out today for a game (for UI badges). */
export function rewardRoundsLeft(gameId: string): number {
  const st = loadState();
  return Math.max(0, REWARD_CAP - (st.counts[gameId] ?? 0));
}
