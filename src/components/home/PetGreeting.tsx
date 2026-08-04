'use client';

// PetGreeting — Domeček hero card: tap-through pet avatar + the daily bubble.
// The bubble ALWAYS opens with the joke of the day (real, human-written jokes
// from jokes-dataset) and adds today's second line (mise / faktík / slovíčko).
// Pure presentational component — the page owns loading pet/entry data.

import Link from 'next/link';
import { MiniPet } from '@/components/pet/avatar/PetAvatar';
import { calculateMood, type PetState, type PetSpecies } from '@/lib/pet-engine';
import { DAILY_KIND_LABEL, type DailyEntry } from '@/lib/daily-content';
import { jokeOfTheDay } from '@/lib/jokes-dataset';
import { hapticTap } from '@/lib/haptics';

interface PetGreetingProps {
  pet: PetState | null;
  entry: DailyEntry;
}

export function PetGreeting({ pet, entry }: PetGreetingProps) {
  const joke = jokeOfTheDay();

  return (
    <div
      className="rounded-3xl p-4 flex items-center gap-3"
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
    >
      <Link
        href="/pet"
        onClick={() => void hapticTap()}
        aria-label={pet ? `Jdi za ${pet.name}` : 'Vyber si mazlíčka'}
        className="flex-shrink-0 flex flex-col items-center gap-1 w-24"
      >
        {pet ? (
          <MiniPet
            species={pet.species as PetSpecies}
            stage={pet.stage}
            mood={calculateMood(pet)}
            outfit={pet.activeOutfit}
            evolutionPath={pet.evolutionPath}
            size={96}
          />
        ) : (
          <>
            <span className="text-6xl leading-none">🥚</span>
            <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: 'var(--accent)' }}>
              Vyber si mazlíčka!
            </span>
          </>
        )}
      </Link>

      <div className="flex-1 min-w-0 space-y-2">
        {joke && (
          <div
            className="rounded-2xl rounded-bl-sm px-3 py-2.5"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <span
              className="inline-block mb-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              Vtípek dne 😄
            </span>
            <p className="text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
              {joke.text}
            </p>
          </div>
        )}

        <div
          className="rounded-2xl px-3 py-2"
          style={{ background: joke ? 'transparent' : 'var(--bg-secondary)', border: joke ? '1px dashed var(--border)' : 'none' }}
        >
          <span
            className="inline-block mb-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {DAILY_KIND_LABEL[entry.kind]}
          </span>
          <p className="text-[13px] leading-snug" style={{ color: 'var(--text-primary)' }}>
            {entry.text}
          </p>
        </div>
      </div>
    </div>
  );
}
