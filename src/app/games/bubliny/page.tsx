'use client';

// „Bublinkovaná" — bubble-pop minigame page.
// The timed round pays out through the shared game-reward contract; the calm
// mode is deliberately reward-free (evening wind-down, no score, no clock).

import { useCallback, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Play, RotateCcw } from 'lucide-react';
import { BottomNav } from '@/components/ui/BottomNav';
import { MiniPet } from '@/components/pet/avatar/PetAvatar';
import { BubblePop, ROUND_SECONDS, SCORE_TARGET, type BubbleMode } from '@/components/games/BubblePop';
import { awardGameCoins, rewardRoundsLeft, type GameReward } from '@/lib/game-rewards';
import { calculateMood, loadPet, type PetSpecies, type PetState } from '@/lib/pet-engine';
import { hapticTap } from '@/lib/haptics';

const GAME_ID = 'bubliny';
const BEST_KEY = 'bub_bubliny_best';

type Phase = 'start' | 'playing' | 'done';

/* ---------------------------------------------------------------------------
 * Client-only data (pet, best score, remaining paid rounds) lives in
 * localStorage. Reading it through useSyncExternalStore keeps the first render
 * identical to the server one and avoids a cascading setState inside an effect.
 * ------------------------------------------------------------------------- */

interface Snapshot {
  pet: PetState | null;
  best: number;
  roundsLeft: number;
}

const EMPTY_SNAPSHOT: Snapshot = { pet: null, best: 0, roundsLeft: 0 };
const listeners = new Set<() => void>();
let snapshot: Snapshot = EMPTY_SNAPSHOT;

function readBest(): number {
  try {
    const parsed = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function refreshSnapshot(): void {
  snapshot = { pet: loadPet(), best: readBest(), roundsLeft: rewardRoundsLeft(GAME_ID) };
  for (const listener of listeners) listener();
}

function subscribeSnapshot(listener: () => void): () => void {
  listeners.add(listener);
  // storage may have moved on since the last visit (pet fed elsewhere, new day)
  refreshSnapshot();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Snapshot {
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return EMPTY_SNAPSHOT;
}

/** Czech plural for "kolo" (round). */
function roundsLabel(n: number): string {
  if (n === 1) return '1 kolo';
  if (n >= 2 && n <= 4) return `${n} kola`;
  return `${n} kol`;
}

export default function BubblyPage() {
  const { pet, best, roundsLeft } = useSyncExternalStore(subscribeSnapshot, getSnapshot, getServerSnapshot);

  const [phase, setPhase] = useState<Phase>('start');
  const [mode, setMode] = useState<BubbleMode>('timed');
  const [roundId, setRoundId] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [isRecord, setIsRecord] = useState(false);
  const [reward, setReward] = useState<GameReward | null>(null);

  const startRound = useCallback((next: BubbleMode) => {
    void hapticTap();
    setMode(next);
    setRoundId((n) => n + 1);
    setReward(null);
    setIsRecord(false);
    setPhase('playing');
  }, []);

  const handleFinish = useCallback((score: number) => {
    const previousBest = readBest();
    if (score > previousBest) {
      try {
        localStorage.setItem(BEST_KEY, String(score));
      } catch {
        /* storage full — the round still counts */
      }
    }
    const earned = awardGameCoins(GAME_ID, Math.min(1, score / SCORE_TARGET));
    setLastScore(score);
    setIsRecord(score > previousBest);
    setReward(earned);
    setPhase('done');
    // coins, best score and remaining paid rounds all just changed
    refreshSnapshot();
  }, []);

  const backToStart = useCallback(() => {
    void hapticTap();
    setPhase('start');
  }, []);

  const petMood = pet ? calculateMood(pet) : 'happy';

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col min-h-0 px-4 pb-nav safe-top">
        <div className="flex items-center gap-3 mb-3 flex-shrink-0">
          <Link href="/games" className="p-2 -ml-2" style={{ color: 'var(--text-muted)' }} aria-label="Zpátky na hry">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Bublinkovaná
          </h1>
          {best > 0 && (
            <span className="ml-auto text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
              Nej: {best}
            </span>
          )}
        </div>

        {phase === 'playing' && (
          <div className="flex-1 min-h-0 flex flex-col gap-3 pb-3">
            <div className="flex-1 min-h-0">
              <BubblePop key={`${mode}-${roundId}`} mode={mode} pet={pet} onFinish={handleFinish} />
            </div>
            {mode === 'calm' && (
              <button
                onClick={backToStart}
                className="w-full rounded-2xl font-semibold text-sm flex items-center justify-center flex-shrink-0"
                style={{
                  minHeight: 60,
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                Už mi stačí 🫧
              </button>
            )}
          </div>
        )}

        {phase === 'start' && (
          <div className="flex-1 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-5 flex flex-col items-center text-center gap-2"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
            >
              {pet ? (
                <MiniPet
                  species={pet.species as PetSpecies}
                  stage={pet.stage}
                  mood={petMood}
                  outfit={pet.activeOutfit}
                  evolutionPath={pet.evolutionPath}
                  size={96}
                />
              ) : (
                <span className="text-6xl leading-none">🫧</span>
              )}
              <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Bublinky stoupají vzhůru!
              </p>
              <p className="text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
                Ťukni na ně a prasknou. Hvězdičkové jsou za pět, zlatá kometka za deset a obří mýdlová se rozdělí na tři
                malé.
              </p>
            </motion.div>

            <div className="mt-4 flex flex-col gap-3">
              <button
                onClick={() => startRound('timed')}
                className="accent-button w-full flex items-center justify-center gap-2 text-base"
                style={{ minHeight: 60 }}
              >
                <Play size={18} />
                Kolo na {ROUND_SECONDS} sekund
              </button>
              <button
                onClick={() => startRound('calm')}
                className="w-full rounded-full font-semibold flex items-center justify-center gap-2 text-base"
                style={{
                  minHeight: 60,
                  background: 'var(--bg-card)',
                  color: 'var(--lavender)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <Moon size={18} />
                Klídek režim
              </button>
              <p className="text-xs text-center leading-snug" style={{ color: 'var(--text-muted)' }}>
                Klídek je jenom na bublinkování — žádný čas, žádné body. Třeba večer. 🫧
              </p>
            </div>

            <p className="mt-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              {roundsLeft > 0
                ? `Dnes ještě ${roundsLabel(roundsLeft)} s mincemi 🪙`
                : 'Dnešní mince už máš — hrajeme pro radost!'}
            </p>
          </div>
        )}

        {phase === 'done' && (
          <div className="flex-1 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="rounded-3xl p-5 flex flex-col items-center text-center gap-2"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
            >
              {pet ? (
                <MiniPet
                  species={pet.species as PetSpecies}
                  stage={pet.stage}
                  mood="ecstatic"
                  outfit={pet.activeOutfit}
                  evolutionPath={pet.evolutionPath}
                  size={96}
                />
              ) : (
                <span className="text-6xl leading-none">🫧</span>
              )}
              <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                To byla jízda! 🫧
              </p>

              <p className="text-4xl font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
                {lastScore}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isRecord ? 'Nový rekord! 🎉' : `Tvoje nej je ${best}`}
              </p>

              <div className="mt-2 w-full rounded-2xl px-4 py-3" style={{ background: 'var(--bg-secondary)' }}>
                {reward?.rewarded ? (
                  <>
                    <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      +{reward.coins} 🪙
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {reward.roundsLeft > 0
                        ? `Dnes ještě ${roundsLabel(reward.roundsLeft)} s mincemi`
                        : 'To byly dnešní mince — dál hrajeme pro radost!'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Dnešní mince už máš — hrajeme pro radost!
                  </p>
                )}
              </div>
            </motion.div>

            <div className="mt-4 flex flex-col gap-3">
              <button
                onClick={() => startRound('timed')}
                className="accent-button w-full flex items-center justify-center gap-2 text-base"
                style={{ minHeight: 60 }}
              >
                <RotateCcw size={18} />
                Ještě jednou
              </button>
              <button
                onClick={() => startRound('calm')}
                className="w-full rounded-full font-semibold flex items-center justify-center gap-2 text-base"
                style={{
                  minHeight: 60,
                  background: 'var(--bg-card)',
                  color: 'var(--lavender)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <Moon size={18} />
                Klídek režim
              </button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
