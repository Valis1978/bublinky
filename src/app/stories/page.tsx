'use client';

// Příběhy — three rooms in one page:
//   1) Nový příběh  · setup wizard → interactive reader
//   2) Moje příběhy · stories Viki kept
//   3) Polička      · books she met and wants to remember
//
// Research guardrails: reading is never scored here. No streaks, no counters,
// no countdowns, no rewards — the only feedback is warmth.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { BottomNav } from '@/components/ui/BottomNav';
import { loadPet, type PetSpecies, type PetStage } from '@/lib/pet-engine';
import { rollCameo } from '@/lib/story-cameos';
import type { SavedStory, StorySetup as StorySetupData } from '@/types/story';
import { StorySetup } from '@/components/stories/StorySetup';
import { StoryReader, type StoryRun } from '@/components/stories/StoryReader';
import { StoryShelf } from '@/components/stories/StoryShelf';
import { ReadingShelf } from '@/components/stories/ReadingShelf';
import { readList } from '@/components/stories/shared';
import { hapticTap } from '@/lib/haptics';

const TABS = [
  { id: 'new', label: 'Nový příběh', emoji: '✨' },
  { id: 'mine', label: 'Moje příběhy', emoji: '📚' },
  { id: 'shelf', label: 'Polička', emoji: '🌟' },
] as const;

type Tab = (typeof TABS)[number]['id'];

const PLANNED_STEPS = 6;
const SPECIES_IDS: PetSpecies[] = ['cat', 'dog', 'bunny', 'dragon', 'unicorn', 'fox'];

interface Identity {
  userId: string | null;
  heroName: string;
  petName: string;
  petSpecies: PetSpecies;
  petStage: PetStage;
}

const DEFAULT_IDENTITY: Identity = {
  userId: null,
  heroName: 'Viki',
  petName: 'Bublík',
  petSpecies: 'cat',
  petStage: 'child',
};

function toSpecies(value: string | undefined): PetSpecies {
  return SPECIES_IDS.includes(value as PetSpecies) ? (value as PetSpecies) : 'cat';
}

/** Reads name + id from `bub_user`, pet from local pet state. Client only. */
function readIdentity(): Identity {
  const identity: Identity = { ...DEFAULT_IDENTITY };
  try {
    const raw = localStorage.getItem('bub_user');
    const parsed = raw ? (JSON.parse(raw) as { id?: unknown; name?: unknown }) : null;
    if (parsed && typeof parsed.id === 'string') identity.userId = parsed.id;
    if (parsed && typeof parsed.name === 'string' && parsed.name.trim()) {
      identity.heroName = parsed.name.trim();
    }
  } catch { /* corrupted localStorage — defaults are fine */ }

  const pet = loadPet();
  if (pet) {
    if (pet.name.trim()) identity.petName = pet.name.trim();
    identity.petSpecies = toSpecies(pet.species);
    // An egg cannot go adventuring — show the hatched look inside stories.
    identity.petStage = pet.stage === 'egg' ? 'child' : pet.stage;
  }
  return identity;
}

// ── Identity as an external store ────────────────────────────────────────────
// localStorage is outside React: reading it during render would break hydration,
// reading it in an effect would cascade renders. useSyncExternalStore does both
// right — the server/first paint gets the defaults, the client swaps in the
// real names right after mount and whenever the tab regains focus.

let identityCache: Identity | null = null;

function sameIdentity(a: Identity, b: Identity): boolean {
  return a.userId === b.userId && a.heroName === b.heroName
    && a.petName === b.petName && a.petSpecies === b.petSpecies && a.petStage === b.petStage;
}

function identitySnapshot(): Identity {
  if (!identityCache) identityCache = readIdentity();
  return identityCache;
}

function serverIdentitySnapshot(): Identity {
  return DEFAULT_IDENTITY;
}

function subscribeIdentity(onChange: () => void): () => void {
  const refresh = () => {
    const next = readIdentity();
    if (!identityCache || !sameIdentity(identityCache, next)) {
      identityCache = next;
      onChange();
    }
  };
  refresh(); // a client-side navigation may bring a fresher localStorage
  window.addEventListener('focus', refresh);
  window.addEventListener('storage', refresh);
  return () => {
    window.removeEventListener('focus', refresh);
    window.removeEventListener('storage', refresh);
  };
}

export default function StoriesPage() {
  const [tab, setTab] = useState<Tab>('new');
  const identity = useSyncExternalStore(subscribeIdentity, identitySnapshot, serverIdentitySnapshot);
  const [recentCameoIds, setRecentCameoIds] = useState<string[]>([]);
  const [run, setRun] = useState<StoryRun | null>(null);
  const [storiesVersion, setStoriesVersion] = useState(0);
  const [shelfVersion, setShelfVersion] = useState(0);
  /** bumps only when a story was saved — refreshes the cameo history */
  const [savedCount, setSavedCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Cameo history — so the same guest does not show up twice in a row.
  useEffect(() => {
    const { userId } = identity;
    if (!userId) return;
    let alive = true;
    fetch(`/api/stories?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then((payload: unknown) => {
        if (!alive) return;
        const list = readList<SavedStory>(payload, 'stories');
        const recent = [...list]
          .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
          .slice(0, 3)
          .map(s => s.cameoId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0);
        setRecentCameoIds(recent);
      })
      .catch(() => { /* offline — roll from the full pool */ });
    return () => { alive = false; };
  }, [identity, savedCount]);

  const switchTab = (next: Tab) => {
    void hapticTap();
    setTab(next);
    if (next === 'mine') setStoriesVersion(v => v + 1);
    if (next === 'shelf') setShelfVersion(v => v + 1);
    scrollToTop();
  };

  const handleStart = useCallback((setup: StorySetupData) => {
    const cameo = rollCameo(recentCameoIds);
    setRun({
      setup,
      cameoId: cameo?.id ?? null,
      // The guest walks in once the story is already rolling.
      cameoStep: Math.random() < 0.5 ? 1 : 2,
      plannedSteps: PLANNED_STEPS,
    });
    scrollToTop();
  }, [recentCameoIds, scrollToTop]);

  const closeRun = useCallback(() => { setRun(null); scrollToTop(); }, [scrollToTop]);

  const startAnother = useCallback(() => {
    setRun(null);
    setTab('new');
    scrollToTop();
  }, [scrollToTop]);

  return (
    <div className="flex flex-col h-dvh">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-nav safe-top">
        {/* Header */}
        <header className="flex items-center gap-1 -ml-2">
          <Link
            href="/home"
            aria-label="Zpátky domů"
            className="flex items-center justify-center"
            style={{ width: 60, height: 60, color: 'var(--text-muted)', touchAction: 'manipulation' }}
          >
            <ArrowLeft size={20} />
          </Link>
          <BookOpen size={19} style={{ color: 'var(--accent)' }} />
          <h1 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Příběhy</h1>
        </header>

        {/* Pill tabs — hidden while a story is running */}
        {!run && (
          <div
            className="grid grid-cols-3 gap-1 rounded-3xl p-1 mb-4"
            style={{ background: 'var(--bg-secondary)' }}
          >
            {TABS.map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => switchTab(t.id)}
                  aria-pressed={active}
                  className="relative flex flex-col items-center justify-center gap-0.5 rounded-3xl"
                  style={{ minHeight: 60, touchAction: 'manipulation', background: 'transparent', border: 'none' }}
                >
                  {active && (
                    <motion.span
                      layoutId="stories-tab-pill"
                      className="absolute inset-0 rounded-3xl"
                      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative text-[17px] leading-none" aria-hidden>{t.emoji}</span>
                  <span
                    className="relative text-[11px] font-bold"
                    style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        {run ? (
          <StoryReader
            run={run}
            userId={identity.userId}
            petSpecies={identity.petSpecies}
            petStage={identity.petStage}
            onNewStory={startAnother}
            onClose={closeRun}
            onSaved={() => { setStoriesVersion(v => v + 1); setSavedCount(c => c + 1); }}
            scrollToTop={scrollToTop}
          />
        ) : tab === 'new' ? (
          <StorySetup
            heroName={identity.heroName}
            petName={identity.petName}
            petSpecies={identity.petSpecies}
            petStage={identity.petStage}
            onStart={handleStart}
          />
        ) : tab === 'mine' ? (
          <StoryShelf userId={identity.userId} refreshKey={storiesVersion} scrollToTop={scrollToTop} />
        ) : (
          <ReadingShelf userId={identity.userId} refreshKey={shelfVersion} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
