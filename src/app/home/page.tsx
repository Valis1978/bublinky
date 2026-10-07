'use client';

// Domeček — the app's entry point. Greeting, pet snapshot + today's content,
// a peek at today's routines, and quick links into the rest of the app.
//
// All localStorage reads happen inside the mount effect so the server-rendered
// (and pre-hydration client) output is always the skeleton below — no mismatch.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { BottomNav } from '@/components/ui/BottomNav';
import { PetGreeting } from '@/components/home/PetGreeting';
import { DailyGiftCard } from '@/components/home/DailyGiftCard';
import { PetPollCard } from '@/components/home/PetPollCard';
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

// Sections rise in one after another; quick-link tiles pop in as a group.
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};
const pop: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 18 } },
};

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

function readUserRole(): 'child' | 'parent' {
  try {
    const raw = localStorage.getItem('bub_user');
    return raw && JSON.parse(raw)?.role === 'parent' ? 'parent' : 'child';
  } catch {
    return 'child';
  }
}

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const [pet, setPet] = useState<PetState | null>(null);
  const [name, setName] = useState('Viki');
  const [role, setRole] = useState<'child' | 'parent'>('child');
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [routines, setRoutines] = useState<RoutineStep[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [greeting, setGreeting] = useState(() => greetingFor('morning'));

  useEffect(() => {
    const timeOfDay = getCurrentTimeOfDay();
    setPet(loadPet());
    setName(readUserName());
    setRole(readUserRole());
    setEntry(getDailyEntry());
    setRoutines(getRoutinesByTime(timeOfDay).slice(0, 3));
    setCompleted(getCompletedRoutines());
    setGreeting(greetingFor(timeOfDay));
    setReady(true);
  }, []);

  const isParent = role === 'parent';

  if (!ready || !entry) {
    return <Skeleton />;
  }

  return (
    <div className="flex flex-col h-dvh">
      <motion.div
        className="flex-1 overflow-y-auto px-4 pb-nav safe-top"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.h1 variants={rise} className="text-2xl font-bold mt-3 mb-4" style={{ color: 'var(--text-primary)' }}>
          {greeting.text}, {name}!{' '}
          <motion.span
            className="inline-block origin-bottom"
            animate={{ rotate: [0, 18, -10, 14, 0] }}
            transition={{ duration: 1.2, delay: 0.4, ease: 'easeInOut' }}
          >
            {greeting.emoji}
          </motion.span>
        </motion.h1>

        {/* The pet rituals (greeting, gift, poll) belong to Viki — the parent
            sees a plain launcher instead. */}
        {!isParent && (
          <motion.div variants={rise}>
            <PetGreeting pet={pet} entry={entry} />
          </motion.div>
        )}

        {!isParent && pet && (
          <motion.div variants={rise} className="mt-3">
            <DailyGiftCard pet={pet} onClaimed={setPet} />
            <PetPollCard pet={pet} />
          </motion.div>
        )}

        <motion.section variants={rise} className="mt-4" hidden={isParent}>
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
        </motion.section>

        <motion.section variants={rise} className="mt-4 mb-4">
          <h2 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Rychlé odkazy
          </h2>
          <motion.div className="grid grid-cols-3 gap-3" variants={stagger}>
            {(isParent
              ? [{ href: '/dashboard', emoji: '📊', label: 'Dashboard' }, ...QUICK_LINKS.filter(l => l.href !== '/pet')]
              : QUICK_LINKS
            ).map(link => (
              <motion.div key={link.href} variants={pop} whileTap={{ scale: 0.92 }}>
                <Link
                  href={link.href}
                  onClick={() => void hapticTap()}
                  className="flex flex-col items-center justify-center gap-1 py-4 rounded-2xl"
                  style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
                >
                  <span className="text-3xl">{link.emoji}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{link.label}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      </motion.div>
      <BottomNav />
    </div>
  );
}
