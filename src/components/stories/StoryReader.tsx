'use client';

// Interactive story reader — one segment at a time, three big choices under it.
// Guardrails: no counters, no progress bar, no countdown, no rewards. The guest
// character never talks about books; the factual card shows up at the very end,
// outside the fiction (see BookCard).

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type {
  StorySegment,
  StorySetup as StorySetupData,
  StoryStepRequest,
  StoryStepResponse,
} from '@/types/story';
import { CAMEOS } from '@/lib/story-cameos';
import { MiniPet } from '@/components/pet/avatar/PetAvatar';
import type { PetSpecies, PetStage } from '@/lib/pet-engine';
import { hapticTap, hapticSuccess } from '@/lib/haptics';
import { BookCard } from './BookCard';
import { genreGradient, PALETTE_VARS, seededUnit, toParagraphs } from './shared';

/** Everything the reader needs to run one story from start to end. */
export interface StoryRun {
  setup: StorySetupData;
  /** cameo rolled by the client (null = no guest this time) */
  cameoId: string | null;
  /** segment index where the guest walks in (1 or 2) */
  cameoStep: number;
  plannedSteps: number;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface StoryReaderProps {
  run: StoryRun;
  userId: string | null;
  petSpecies: PetSpecies;
  petStage: PetStage;
  onNewStory: () => void;
  onClose: () => void;
  onSaved: () => void;
  scrollToTop?: () => void;
}

export function StoryReader({
  run, userId, petSpecies, petStage, onNewStory, onClose, onSaved, scrollToTop,
}: StoryReaderProps) {
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [title, setTitle] = useState<string | null>(null);
  const [moral, setMoral] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [confirmExit, setConfirmExit] = useState(false);

  // History of the attempt in flight — lets "Zkusit znovu" replay it.
  const pendingRef = useRef<StorySegment[]>([]);
  const startedRef = useRef(false);

  const { setup, cameoId, cameoStep, plannedSteps } = run;
  const petName = setup.petName;

  const requestSegment = useCallback(async (history: StorySegment[]) => {
    pendingRef.current = history;
    const step = history.length;
    setLoading(true);
    setFailed(false);
    try {
      const body: StoryStepRequest = {
        setup,
        history: history.map(s => ({ text: s.text, chosen: s.chosen, cameoId: s.cameoId })),
        step,
        plannedSteps,
        ...(cameoId && step === cameoStep ? { introduceCameoId: cameoId } : {}),
      };
      const res = await fetch('/api/story/interactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as StoryStepResponse;
      if (!res.ok || !data.success || !data.segment) throw new Error(data.error ?? 'no segment');
      setSegments([...history, data.segment]);
      if (data.title) setTitle(data.title);
      if (data.moral) setMoral(data.moral);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [setup, cameoId, cameoStep, plannedSteps]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void requestSegment([]);
  }, [requestSegment]);

  const current = segments[segments.length - 1];
  const isLast = !!current && (current.choices.length === 0 || segments.length >= plannedSteps);

  // Hand the finished story to the pet chat for a casual book talk (read once
  // by PetChatPanel via 'bub_last_story'; see its readPendingLastStory()).
  useEffect(() => {
    if (!isLast || segments.length === 0) return;
    try {
      const summary = segments[segments.length - 1].text.slice(0, 220);
      localStorage.setItem('bub_last_story', JSON.stringify({
        title: title ?? `Příběh o ${setup.heroName}`,
        summary,
        at: new Date().toISOString(),
      }));
    } catch { /* best effort */ }
  }, [isLast, segments, title, setup.heroName]);

  // The guest has entered once we are past the step we asked for them.
  const storyCameoId =
    segments.find(s => s.cameoId)?.cameoId ??
    (cameoId && segments.length > cameoStep ? cameoId : null);
  const cameo = storyCameoId ? CAMEOS[storyCameoId] : undefined;

  const choose = (choiceId: string) => {
    if (!current || loading) return;
    void hapticTap();
    const withChoice = segments.map((s, i) =>
      i === segments.length - 1 ? { ...s, chosen: choiceId } : s,
    );
    setSegments(withChoice);
    scrollToTop?.();
    void requestSegment(withChoice);
  };

  const saveStory = async () => {
    if (!userId || saveState === 'saving' || saveState === 'saved') return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: title ?? `Příběh o ${setup.heroName}`,
          genre: setup.genre,
          segments,
          cameoId: storyCameoId,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      setSaveState('saved');
      void hapticSuccess();
      onSaved();
    } catch {
      setSaveState('error');
    }
  };

  const handleClose = () => {
    void hapticTap();
    // Nothing to lose yet, or it is already safely stored → just leave.
    if (segments.length === 0 || saveState === 'saved' || (isLast && !userId)) {
      onClose();
      return;
    }
    setConfirmExit(true);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* ── Scene ───────────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'var(--accent-soft)',
          backgroundImage: genreGradient(setup.genre),
          boxShadow: 'var(--shadow-lg)',
          height: 168,
        }}
      >
        {isLast && <Confetti />}

        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <motion.div
            animate={loading ? { y: [0, -5, 0] } : { y: 0 }}
            transition={loading ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          >
            <MiniPet species={petSpecies} stage={petStage} mood={loading ? 'neutral' : 'happy'} size={72} />
          </motion.div>
        </div>

        {/* Guest character bubble */}
        <AnimatePresence>
          {cameo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="absolute bottom-4 right-4 flex flex-col items-center gap-1"
            >
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 56, height: 56,
                  background: 'var(--bg-card)',
                  boxShadow: 'var(--shadow)',
                  border: '2px solid var(--border)',
                }}
              >
                <span className="text-[26px] leading-none" aria-hidden>{cameo.emoji}</span>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}
              >
                {cameo.name}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Zavřít příběh"
          className="absolute top-0 right-0 flex items-start justify-end p-3"
          style={{ width: 60, height: 60, touchAction: 'manipulation', background: 'transparent', border: 'none' }}
        >
          <span
            className="rounded-full flex items-center justify-center"
            style={{ width: 34, height: 34, background: 'var(--bg-card)', color: 'var(--text-muted)' }}
          >
            <X size={17} />
          </span>
        </button>
      </div>

      {/* ── Leaving confirmation ────────────────────────────────── */}
      <AnimatePresence>
        {confirmExit && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl p-4 space-y-3"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {isLast
                ? 'Tenhle příběh ještě nemáš uložený — až odejdeš, zmizí.'
                : 'Příběh ještě neskončil. Chceš ho nechat být?'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmExit(false)}
                className="flex-1 rounded-2xl text-[15px] font-bold"
                style={{ minHeight: 60, touchAction: 'manipulation', background: 'var(--accent-soft)', color: 'var(--text-primary)' }}
              >
                {isLast ? 'Zpátky k němu' : 'Čteme dál'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl text-[15px] font-bold"
                style={{ minHeight: 60, touchAction: 'manipulation', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
              >
                Nechat být
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Story text ──────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={segments.length}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="rounded-3xl p-5 space-y-3"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
          >
            {isLast && (
              <h2 className="text-2xl font-black leading-tight pb-1" style={{ color: 'var(--text-primary)' }}>
                {title ?? `Příběh o ${setup.heroName}`}
              </h2>
            )}
            {toParagraphs(current.text).map((paragraph, i) => (
              <p key={i} className="text-[17px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {paragraph}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Thinking ────────────────────────────────────────────── */}
      {loading && !failed && (
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="rounded-full"
                style={{ width: 9, height: 9, background: 'var(--accent)' }}
                animate={{ y: [0, -7, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
              />
            ))}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {petName} vymýšlí, co dál…
          </p>
        </div>
      )}

      {/* ── Something broke ─────────────────────────────────────── */}
      {failed && (
        <div className="rounded-3xl p-5 space-y-3 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {petName} se zakoktal a ztratil nit. Nic se neděje 💛
          </p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => void requestSegment(pendingRef.current)}
            className="w-full rounded-2xl text-white text-[15px] font-bold"
            style={{ minHeight: 60, touchAction: 'manipulation', background: 'var(--accent)' }}
          >
            Zkusit znovu
          </motion.button>
        </div>
      )}

      {/* ── Choices ─────────────────────────────────────────────── */}
      {!loading && !failed && current && !isLast && (
        <div className="space-y-3">
          {current.choices.map((choice, i) => (
            <motion.button
              key={choice.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.25 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => choose(choice.id)}
              className="w-full flex items-center gap-3 rounded-3xl px-4 py-3 text-left"
              style={{
                minHeight: 60,
                touchAction: 'manipulation',
                background: 'var(--bg-card)',
                border: '2px solid var(--border)',
                boxShadow: 'var(--shadow)',
              }}
            >
              <span className="text-[22px] flex-shrink-0" aria-hidden>{CHOICE_EMOJI[i % CHOICE_EMOJI.length]}</span>
              <span className="text-[15px] font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                {choice.label}
              </span>
            </motion.button>
          ))}
        </div>
      )}

      {/* ── Ending ──────────────────────────────────────────────── */}
      {!loading && !failed && isLast && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {moral && (
            <div className="rounded-3xl p-4 flex items-start gap-3" style={{ background: 'var(--accent-soft)' }}>
              <span className="text-[22px] leading-none" aria-hidden>💭</span>
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {moral}
              </p>
            </div>
          )}

          {cameo && <BookCard cameo={cameo} userId={userId} />}

          {userId && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => void saveStory()}
              disabled={saveState === 'saving' || saveState === 'saved'}
              className="w-full rounded-3xl text-[15px] font-bold"
              style={{
                minHeight: 60,
                touchAction: 'manipulation',
                background: saveState === 'saved'
                  ? 'color-mix(in srgb, var(--mint) 30%, var(--bg-card))'
                  : 'var(--bg-card)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow)',
              }}
            >
              {saveState === 'saved' ? '✓ Uloženo mezi tvoje příběhy'
                : saveState === 'saving' ? 'Ukládám…'
                : 'Uložit do mých příběhů 💾'}
            </motion.button>
          )}

          {saveState === 'error' && (
            <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Teď to nešlo uložit, zkus to za chvilku 💛
            </p>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => { void hapticTap(); onNewStory(); }}
            className="w-full rounded-3xl text-white text-[17px] font-bold"
            style={{ minHeight: 64, touchAction: 'manipulation', background: 'var(--accent-gradient)', boxShadow: 'var(--shadow-lg)' }}
          >
            Nový příběh ✨
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

const CHOICE_EMOJI = ['🌿', '🌀', '⭐️', '🍀'];

/** Scattered but deterministic — same confetti on every render, no jitter. */
const CONFETTI = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: seededUnit(i, 1) * 100,
  size: 6 + seededUnit(i, 2) * 7,
  delay: seededUnit(i, 3) * 0.6,
  duration: 1.7 + seededUnit(i, 4) * 1.1,
  spin: (seededUnit(i, 5) * 2 - 1) * 260,
  color: PALETTE_VARS[i % PALETTE_VARS.length],
}));

/** Pure transform/opacity confetti — cheap enough for 60 fps on a phone. */
function Confetti() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {CONFETTI.map(p => (
        <motion.span
          key={p.id}
          className="absolute rounded-[2px]"
          style={{ left: `${p.left}%`, top: -14, width: p.size, height: p.size * 1.4, background: p.color }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{ y: 200, opacity: [0, 1, 1, 0], rotate: p.spin }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatDelay: 1.4, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
