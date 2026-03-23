'use client';

import { useState, useCallback } from 'react';
import { useStats } from '@/hooks/useStats';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface QuizItem {
  emojis: string;
  answer: string;
  options: string[];
  category: string;
}

const QUIZZES: QuizItem[] = [
  // Pohádky & filmy
  { emojis: '👸❄️⛄', answer: 'Ledové království', options: ['Ledové království', 'Sněhurka', 'Popelka', 'Malá mořská víla'], category: 'Film' },
  { emojis: '🦁👑🌍', answer: 'Lví král', options: ['Lví král', 'Madagaskar', 'Tarzan', 'Kniha džunglí'], category: 'Film' },
  { emojis: '🧜‍♀️🌊🐠', answer: 'Malá mořská víla', options: ['Malá mořská víla', 'Hledá se Nemo', 'Moana', 'Ponyo'], category: 'Film' },
  { emojis: '🤥👃🪵', answer: 'Pinocchio', options: ['Pinocchio', 'Shrek', 'Petr Pan', 'Toy Story'], category: 'Film' },
  { emojis: '🐉🗡️👧', answer: 'Jak vycvičit draka', options: ['Jak vycvičit draka', 'Shrek', 'Mulan', 'Statečné srdce'], category: 'Film' },
  { emojis: '🧙‍♂️💍🌋', answer: 'Pán prstenů', options: ['Pán prstenů', 'Harry Potter', 'Hobbit', 'Narnie'], category: 'Film' },
  { emojis: '⚡🧙‍♂️🦉', answer: 'Harry Potter', options: ['Harry Potter', 'Čarodějův učeň', 'Pán prstenů', 'Merlin'], category: 'Film' },
  { emojis: '🕷️🦸‍♂️🏙️', answer: 'Spider-Man', options: ['Spider-Man', 'Batman', 'Superman', 'Iron Man'], category: 'Film' },
  { emojis: '👨‍🚀🚀🌕', answer: 'Apollo 13', options: ['Apollo 13', 'Star Wars', 'Gravitace', 'Interstellar'], category: 'Film' },
  { emojis: '🐭👨‍🍳🇫🇷', answer: 'Ratatouille', options: ['Ratatouille', 'Garfield', 'Stuart Little', 'Alvin a Chipmunkové'], category: 'Film' },
  // Zvířata
  { emojis: '🖤🐈⬛🌙', answer: 'Kočka', options: ['Kočka', 'Netopýr', 'Panter', 'Havran'], category: 'Zvíře' },
  { emojis: '🍯🐝🧸', answer: 'Medvěd', options: ['Medvěd', 'Včela', 'Ježek', 'Liška'], category: 'Zvíře' },
  { emojis: '🥕👁️🐰', answer: 'Králík', options: ['Králík', 'Křeček', 'Morče', 'Myš'], category: 'Zvíře' },
  // Jídlo
  { emojis: '🍕🧀🔥', answer: 'Pizza', options: ['Pizza', 'Toast', 'Lasagne', 'Quesadilla'], category: 'Jídlo' },
  { emojis: '🥟🥢🇨🇿', answer: 'Knedlíky', options: ['Knedlíky', 'Sushi', 'Ravioli', 'Pierogi'], category: 'Jídlo' },
  { emojis: '🍰🍓🎂', answer: 'Dort', options: ['Dort', 'Palačinka', 'Zmrzlina', 'Puding'], category: 'Jídlo' },
  // Místa
  { emojis: '🏰🌉🇨🇿', answer: 'Praha', options: ['Praha', 'Brno', 'Vídeň', 'Budapešť'], category: 'Místo' },
  { emojis: '🗼🥐🇫🇷', answer: 'Paříž', options: ['Paříž', 'Londýn', 'Řím', 'Madrid'], category: 'Místo' },
  { emojis: '🏔️⛷️🧀', answer: 'Švýcarsko', options: ['Švýcarsko', 'Rakousko', 'Norsko', 'Francie'], category: 'Místo' },
  // Sport
  { emojis: '⚽🥅🏟️', answer: 'Fotbal', options: ['Fotbal', 'Hokej', 'Basketbal', 'Tenis'], category: 'Sport' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function EmojiQuizPage() {
  const { winGame } = useStats();
  const [questions] = useState(() => shuffle(QUIZZES).slice(0, 10));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const current = questions[currentIdx];
  const isFinished = showResult;
  const isLastQuestion = currentIdx >= questions.length;

  const handleAnswer = useCallback(
    (answer: string) => {
      if (selected) return;
      setSelected(answer);
      if (answer === current.answer) {
        setScore((s) => s + 1);
      }
      setTimeout(() => {
        if (currentIdx + 1 >= questions.length) {
          const finalScore = answer === current.answer ? score + 1 : score;
          const pct = Math.round((finalScore / questions.length) * 100);
          if (pct >= 80) winGame();
          setShowResult(true);
        } else {
          setCurrentIdx((i) => i + 1);
          setSelected(null);
        }
      }, 1200);
    },
    [selected, current, currentIdx, questions.length, score, winGame]
  );

  const restart = () => {
    window.location.reload();
  };

  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col h-dvh">
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-nav">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-4">
            {pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}
          </motion.div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {pct >= 80 ? 'Super!' : pct >= 50 ? 'Dobrý!' : 'Zkus znovu!'}
          </h2>
          <p className="text-3xl font-bold mb-6" style={{ color: 'var(--accent)' }}>
            {score} / {questions.length}
          </p>
          <div className="flex gap-3">
            <button onClick={restart} className="accent-button px-6 py-2.5 text-sm inline-flex items-center gap-2">
              <RotateCcw size={14} />
              Znovu
            </button>
            <Link href="/games" className="px-6 py-2.5 text-sm font-medium rounded-full"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}>
              Zpět
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col p-4 pb-nav safe-top">
        <div className="flex items-center justify-between mb-4">
          <Link href="/games" className="p-2 -ml-2" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {currentIdx + 1} / {questions.length}
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
            {score} ✓
          </span>
        </div>

        {/* Progress */}
        <div className="h-1.5 rounded-full mb-6" style={{ background: 'var(--bg-input)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--accent)' }}
            animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Category */}
          <span
            className="text-[10px] font-semibold px-3 py-1 rounded-full mb-4"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {current.category}
          </span>

          {/* Emoji question */}
          <motion.div
            key={currentIdx}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl mb-2 tracking-wider"
          >
            {current.emojis}
          </motion.div>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Co to je?
          </p>

          {/* Options */}
          <div className="space-y-2 w-full max-w-sm">
            {current.options.map((option) => {
              let bg = 'var(--bg-card)';
              let color = 'var(--text-primary)';
              if (selected) {
                if (option === current.answer) { bg = '#22C55E'; color = 'white'; }
                else if (option === selected) { bg = '#EF4444'; color = 'white'; }
              }
              return (
                <motion.button
                  key={option}
                  whileTap={!selected ? { scale: 0.98 } : {}}
                  onClick={() => handleAnswer(option)}
                  disabled={!!selected}
                  className="w-full py-3.5 px-4 rounded-2xl text-left text-sm font-medium transition-all"
                  style={{ background: bg, color, boxShadow: 'var(--shadow)' }}
                >
                  {option}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
