'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStats } from '@/hooks/useStats';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import Link from 'next/link';

const EMOJI_SETS = [
  ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐸', '🦋', '🐧', '🦄'],
  ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '🥝', '🍕', '🧁', '🍩', '🌮'],
  ['⭐', '🌙', '☀️', '🌈', '❄️', '🔥', '💎', '🎀', '🌸', '🦩', '🎭', '🎪'],
  ['🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '🎧', '🎵', '🎶', '🎼', '🪗', '🎷'],
];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createBoard(size: number = 10): Card[] {
  const setIndex = Math.floor(Math.random() * EMOJI_SETS.length);
  const emojis = EMOJI_SETS[setIndex].slice(0, size);
  const pairs = [...emojis, ...emojis];
  const shuffled = shuffleArray(pairs);
  return shuffled.map((emoji, i) => ({
    id: i,
    emoji,
    isFlipped: false,
    isMatched: false,
  }));
}

export default function MemoryPage() {
  const { winGame } = useStats();
  const [cards, setCards] = useState<Card[]>(() => createBoard());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const totalPairs = cards.length / 2;
  const isWon = matches === totalPairs;

  useEffect(() => {
    const saved = localStorage.getItem('bub_memory_best');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  const handleCardClick = useCallback(
    (index: number) => {
      if (isLocked || cards[index].isFlipped || cards[index].isMatched || flipped.length >= 2)
        return;

      const newFlipped = [...flipped, index];
      setCards((prev) =>
        prev.map((c, i) => (i === index ? { ...c, isFlipped: true } : c))
      );
      setFlipped(newFlipped);

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        setIsLocked(true);

        const [first, second] = newFlipped;
        if (cards[first].emoji === cards[second].emoji) {
          // Match!
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c, i) =>
                i === first || i === second ? { ...c, isMatched: true } : c
              )
            );
            setMatches((m) => {
              const newMatches = m + 1;
              if (newMatches === totalPairs) {
                winGame();
                const finalMoves = moves + 1;
                if (!bestScore || finalMoves < bestScore) {
                  setBestScore(finalMoves);
                  localStorage.setItem('bub_memory_best', String(finalMoves));
                }
              }
              return newMatches;
            });
            setFlipped([]);
            setIsLocked(false);
          }, 400);
        } else {
          // No match — flip back
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c, i) =>
                i === first || i === second ? { ...c, isFlipped: false } : c
              )
            );
            setFlipped([]);
            setIsLocked(false);
          }, 800);
        }
      }
    },
    [cards, flipped, isLocked, moves, matches, totalPairs, bestScore, winGame]
  );

  const reset = () => {
    setCards(createBoard());
    setFlipped([]);
    setMoves(0);
    setMatches(0);
    setIsLocked(false);
  };

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto p-4 pb-nav safe-top">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/games" className="p-2 -ml-2" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Pexeso
          </h1>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-4">
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{moves}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tahů</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--mint)' }}>
              {matches}/{totalPairs}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Párů</p>
          </div>
          {bestScore && (
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: 'var(--lavender)' }}>
                {bestScore}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Rekord</p>
            </div>
          )}
        </div>

        {/* Board */}
        <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto">
          {cards.map((card) => (
            <motion.button
              key={card.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCardClick(card.id)}
              className="aspect-square rounded-xl flex items-center justify-center text-2xl transition-all"
              style={{
                background:
                  card.isMatched
                    ? 'var(--accent-soft)'
                    : card.isFlipped
                      ? 'var(--bg-card)'
                      : 'var(--accent-gradient)',
                boxShadow: card.isMatched ? 'none' : 'var(--shadow)',
                opacity: card.isMatched ? 0.5 : 1,
              }}
              animate={{
                rotateY: card.isFlipped || card.isMatched ? 0 : 180,
              }}
              transition={{ duration: 0.3 }}
            >
              {(card.isFlipped || card.isMatched) && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {card.emoji}
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Win state */}
        {isWon && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-6 space-y-3"
          >
            <div className="flex items-center justify-center gap-2">
              <Trophy size={20} style={{ color: 'var(--accent)' }} />
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Super! Za {moves} tahů!
              </p>
            </div>
            <button onClick={reset} className="accent-button px-6 py-2.5 text-sm inline-flex items-center gap-2">
              <RotateCcw size={16} />
              Znovu
            </button>
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
