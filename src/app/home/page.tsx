'use client';

// Domeček — the app's entry point. Greeting, pet snapshot + today's content,
// a peek at today's routines, and quick links into the rest of the app.
//
// All localStorage reads happen inside the mount effect so the server-rendered
// (and pre-hydration client) output is always the skeleton below — no mismatch.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomNav } from '@/components/ui/BottomNav';
import { PetGreeting } from '@/components/home/PetGreeting';
import { DailyGiftCard } from '@/components/home/DailyGiftCard';
import { loadPet, type PetState } from '@/lib/pet-engine';
import { getDailyEntry, type DailyEntry } from '@/lib/daily-content';
import {
  getRoutinesByTime, getCurrentTimeOfDay, getCompletedRoutines, type RoutineStep,
} from '@/lib/routine-engine';
import { hapticTap } from '@/lib/haptics';

interface QuickLink {
  href: string;
  emoji: string;
  label: string;
}

const QUICK_LINKS: QuickLink[] = [
  { href: '/pet', emoji: '🐾', label: 'Mazlíček' },
  { href: '/games', emoji: '🎮', label: 'Hry' },
  { href: '/learn', emoji: '📚', label: 'Učení' },
  { href: '/album', emoji: '🌈', label: 'Samolepky' },
  { href: '/tasks', emoji: '📋', label: 'Úkoly' },
  { href: '/stories', emoji: '📖', label: 'Příběhy' },
];

function greetingFor(time: ReturnType<typeof getCurrentTimeOfDay>): { text: string; emoji: string } {
  if (time === 'morning') return { text: 'Dobré ráno', emoji: '☀️' };
  if (time === 'afternoon') return { text: 'Ahoj', emoji: '☀️' };
  return { text: 'Dobrý večer', emoji: '🌙' };
}

function readUserName(): string {
  try {
    const raw = localStorage.getItem('bub_user');
    const name = raw ? JSON.parse(raw)?.name : null;
    return typeof name === 'string' && name.trim() ? name : 'Viki';
  } catch {
    return 'Viki';
  }
}

function Skeleton() {
  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto px-4 pb-nav safe-top">
        <div className="h-8 w-52 rounded-full mt-3 mb-4 animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
        <div className="h-28 rounded-3xl mb-3 animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
        <div className="h-16 rounded-3xl mb-3 animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
        <div className="h-36 rounded-3xl mb-3 animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [pet, setPet] = useState<PetState | null>(null);
  const [name, setName] = useState('Viki');
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [routines, setRoutines] = useState<RoutineStep[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [greeting, setGreeting] = useState(() => greetingFor('morning'));

  useEffect(() => {
    const timeOfDay = getCurrentTimeOfDay();
    setPet(loadPet());
    setName(readUserName());
    setEntry(getDailyEntry());
    setRoutines(getRoutinesByTime(timeOfDay).slice(0, 3));
    setCompleted(getCompletedRoutines());
    setGreeting(greetingFor(timeOfDay));
    setReady(true);
  }, []);

  if (!ready || !entry) {
    return <Skeleton />;
  }

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto px-4 pb-nav safe-top">
        <h1 className="text-2xl font-bold mt-3 mb-4" style={{ color: 'var(--text-primary)' }}>
          {greeting.text}, {name}! {greeting.emoji}
        </h1>

        <PetGreeting pet={pet} entry={entry} />

        {pet && (
          <div className="mt-3">
            <DailyGiftCard pet={pet} onClaimed={setPet} />
          </div>
        )}

        <section className="mt-4">
          <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Dnešní parta úkolů
          </h2>
          <div className="rounded-3xl p-3" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
            <div className="space-y-2 mb-2">
              {routines.map(routine => {
                const done = completed.includes(routine.id);
                return (
                  <div key={routine.id} className="flex items-center gap-2">
                    <span className="text-lg flex-shrink-0">{done ? '✅' : routine.emoji}</span>
                    <span
                      className={`text-sm flex-1 min-w-0 truncate ${done ? 'line-through' : ''}`}
                      style={{ color: done ? 'var(--text-muted)' : 'var(--text-primary)' }}
                    >
                      {routine.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <Link
              href="/pet"
              onClick={() => void hapticTap()}
              className="text-sm font-bold"
              style={{ color: 'var(--accent)' }}
            >
              Splnit s parťákem →
            </Link>
          </div>
        </section>

        <section className="mt-4 mb-4">
          <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Rychlé odkazy
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => void hapticTap()}
                className="flex flex-col items-center justify-center gap-1 py-4 rounded-2xl"
                style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
              >
                <span className="text-3xl">{link.emoji}</span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{link.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
