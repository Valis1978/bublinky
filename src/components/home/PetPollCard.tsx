'use client';

// PetPollCard — Domeček daily poll ("anketka"): one playful either/or question from
// the pet. Answering stores the pick as a pet memory server-side (see pet-polls.ts);
// purely curiosity-driven — no streaks, no counters, no reminders.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MiniPet } from '@/components/pet/avatar/PetAvatar';
import { calculateMood, type PetState, type PetSpecies } from '@/lib/pet-engine';
import { getTodaysPoll, markPollAnswered, type PetPoll } from '@/lib/pet-polls';
import { hapticTap } from '@/lib/haptics';

interface PetPollCardProps {
  pet: PetState;
}

interface AnsweredState {
  text: string;
  reaction: string;
}

/** Local (no-API) reaction templates — picked at random once the answer lands. */
const REACTIONS: Array<(answer: string) => string> = [
  answer => `${answer}? Tak to já taky! 😄`,
  answer => `Oooo, ${answer}! To si pamatuju! 🐾`,
];

function readUserId(): string | null {
  try {
    const raw = localStorage.getItem('bub_user');
    const id = raw ? JSON.parse(raw)?.id : null;
    return typeof id === 'string' && id ? id : null;
  } catch {
    return null;
  }
}

/** Best-effort sync to the server — same fire-and-forget shape used across the pet cards. */
function submitPollAnswer(payload: { userId: string; pollId: string; question: string; answer: string }): void {
  fetch('/api/pet/poll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export function PetPollCard({ pet }: PetPollCardProps) {
  const [poll] = useState<PetPoll | null>(() => getTodaysPoll());
  const [answered, setAnswered] = useState<AnsweredState | null>(null);

  if (!poll) return null;

  const handleAnswer = (option: 'a' | 'b') => {
    if (answered) return;
    const text = poll[option];
    const reaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)](text);

    const userId = readUserId();
    if (userId) {
      submitPollAnswer({ userId, pollId: poll.id, question: poll.question, answer: text });
    }
    markPollAnswered(poll.id);
    setAnswered({ text, reaction });
    void hapticTap();
  };

  const avatar = (
    <MiniPet
      species={pet.species as PetSpecies}
      stage={pet.stage}
      mood={calculateMood(pet)}
      outfit={pet.activeOutfit}
      evolutionPath={pet.evolutionPath}
      size={48}
    />
  );

  return (
    <div className="rounded-3xl p-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
      {answered ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {avatar}
            <div
              className="flex-1 min-w-0 rounded-2xl rounded-bl-sm px-3 py-2.5"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <p className="text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
                {answered.reaction}
              </p>
            </div>
          </div>
          <p className="text-xs pl-[60px]" style={{ color: 'var(--text-muted)' }}>
            {poll.question} <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{answered.text}</span> ✓
          </p>
        </motion.div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3">
            {avatar}
            <p className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {poll.question}
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAnswer('a')}
              className="flex-1 min-h-14 px-3 rounded-2xl text-sm font-semibold"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              {poll.a}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAnswer('b')}
              className="flex-1 min-h-14 px-3 rounded-2xl text-sm font-semibold"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              {poll.b}
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}
