'use client';

import { useState, useCallback, useEffect } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Delete } from 'lucide-react';
import Link from 'next/link';

// Czech 5-letter words (no diacritics for simplicity, displayed with them)
const WORDS = [
  'KOCKA', 'MLEKO', 'STROM', 'VETER', 'DOMEK', 'LEHKO', 'KNIHA', 'LAMPA',
  'HVEZD', 'RYBAR', 'MOREK', 'PLZEN', 'VLAKY', 'OKURK', 'SLOVO', 'MESIC',
  'POLEV', 'DESTE', 'LYZAR', 'KOSTE', 'MESTO', 'CHMEL', 'BREZA', 'SRDCE',
  'MLHAV', 'POTOK', 'STAVB', 'KONEC', 'POCIT', 'ZNAKY', 'HRNEK', 'KAMEN',
  'HLINA', 'SVETL', 'VTIPE', 'RAKOS', 'JAHOD', 'MRKEV', 'PEPIK', 'VODKA',
];

const KEYBOARD_ROWS = [
  'QWERTZUIOP'.split(''),
  'ASDFGHJKL'.split(''),
  ['ENTER', ...'YXCVBNM'.split(''), 'DEL'],
];

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

function getLetterStates(guess: string, answer: string): LetterState[] {
  const states: LetterState[] = Array(WORD_LENGTH).fill('absent');
  const answerChars = answer.split('');
  const remaining = [...answerChars];

  // First pass: correct positions
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      states[i] = 'correct';
      remaining[remaining.indexOf(guess[i])] = '';
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (states[i] === 'correct') continue;
    const idx = remaining.indexOf(guess[i]);
    if (idx >= 0) {
      states[i] = 'present';
      remaining[idx] = '';
    }
  }

  return states;
}

const stateColors: Record<LetterState, string> = {
  correct: '#22C55E',
  present: '#FBBF24',
  absent: '#6B7280',
  empty: 'transparent',
};

export default function WordlePage() {
  const [answer] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const letterStates = new Map<string, LetterState>();
  for (const guess of guesses) {
    const states = getLetterStates(guess, answer);
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = guess[i];
      const current = letterStates.get(letter);
      if (states[i] === 'correct' || (!current && states[i] !== 'empty')) {
        letterStates.set(letter, states[i]);
      } else if (states[i] === 'present' && current !== 'correct') {
        letterStates.set(letter, 'present');
      }
    }
  }

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver) return;

      if (key === 'ENTER') {
        if (current.length !== WORD_LENGTH) return;
        const newGuesses = [...guesses, current];
        setGuesses(newGuesses);
        setCurrent('');

        if (current === answer) {
          setWon(true);
          setGameOver(true);
        } else if (newGuesses.length >= MAX_GUESSES) {
          setGameOver(true);
        }
        return;
      }

      if (key === 'DEL') {
        setCurrent((prev) => prev.slice(0, -1));
        return;
      }

      if (current.length < WORD_LENGTH) {
        setCurrent((prev) => prev + key);
      }
    },
    [current, guesses, answer, gameOver]
  );

  // Physical keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleKey('ENTER');
      else if (e.key === 'Backspace') handleKey('DEL');
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  const reset = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col p-4 pb-24 safe-top">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/games" className="p-2 -ml-2" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Slovo dne
          </h1>
        </div>

        {/* Grid */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 mb-4">
          {Array.from({ length: MAX_GUESSES }).map((_, rowIdx) => {
            const guess = guesses[rowIdx];
            const isCurrent = rowIdx === guesses.length && !gameOver;
            const word = guess || (isCurrent ? current.padEnd(WORD_LENGTH) : '     ');
            const states: LetterState[] = guess ? getLetterStates(guess, answer) : Array(WORD_LENGTH).fill('empty');

            return (
              <div key={rowIdx} className="flex gap-1.5">
                {word.split('').map((letter, colIdx) => (
                  <motion.div
                    key={colIdx}
                    animate={guess ? { rotateX: [0, 90, 0] } : {}}
                    transition={{ delay: colIdx * 0.1, duration: 0.4 }}
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold border-2 transition-all"
                    style={{
                      background: guess ? stateColors[states[colIdx]] : 'var(--bg-card)',
                      borderColor: isCurrent && letter.trim()
                        ? 'var(--accent)'
                        : guess
                          ? stateColors[states[colIdx]]
                          : 'var(--border)',
                      color: guess ? 'white' : 'var(--text-primary)',
                    }}
                  >
                    {letter.trim()}
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Game over */}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-4 space-y-2"
          >
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {won ? `🎉 Super! Za ${guesses.length} pokusů!` : `Slovo bylo: ${answer}`}
            </p>
            <button onClick={reset} className="accent-button px-5 py-2 text-sm inline-flex items-center gap-2">
              <RotateCcw size={14} />
              Nové slovo
            </button>
          </motion.div>
        )}

        {/* Keyboard */}
        <div className="flex flex-col items-center gap-1.5">
          {KEYBOARD_ROWS.map((row, i) => (
            <div key={i} className="flex gap-1">
              {row.map((key) => {
                const state = letterStates.get(key);
                const isSpecial = key === 'ENTER' || key === 'DEL';

                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleKey(key)}
                    className="rounded-lg flex items-center justify-center font-semibold transition-all"
                    style={{
                      width: isSpecial ? 52 : 32,
                      height: 44,
                      fontSize: isSpecial ? 11 : 14,
                      background: state ? stateColors[state] : 'var(--bg-input)',
                      color: state ? 'white' : 'var(--text-primary)',
                    }}
                  >
                    {key === 'DEL' ? <Delete size={16} /> : key}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
