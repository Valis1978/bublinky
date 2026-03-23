'use client';

import { useState, useCallback } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, Lightbulb, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getExercises, FAMILIES, type IYExercise } from '@/lib/questions/czech';
import { useStats } from '@/hooks/useStats';

type Screen = 'menu' | 'quiz' | 'result';

export default function CzechPage() {
  const { completeSession } = useStats();
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [exercises, setExercises] = useState<IYExercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Array<{ correct: boolean; exercise: IYExercise }>>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<'correct' | 'wrong' | null>(null);

  const startQuiz = useCallback((family?: string) => {
    const exs = getExercises({
      family: family || undefined,
      limit: 10,
    });
    setExercises(exs);
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedFamily(family || null);
    setShowExplanation(false);
    setLastAnswer(null);
    setScreen('quiz');
  }, []);

  const handleAnswer = useCallback(
    (answer: string) => {
      const exercise = exercises[currentIdx];
      const blank = exercise.blanks[0]; // First blank for now
      const isCorrect = answer === blank.correct;

      setLastAnswer(isCorrect ? 'correct' : 'wrong');
      setShowExplanation(true);
      setAnswers((prev) => [...prev, { correct: isCorrect, exercise }]);
    },
    [exercises, currentIdx]
  );

  const nextQuestion = useCallback(() => {
    setShowExplanation(false);
    setLastAnswer(null);
    if (currentIdx + 1 >= exercises.length) {
      const correct = answers.filter((a) => a.correct).length + (lastAnswer === 'correct' ? 1 : 0);
      completeSession(correct, exercises.length);
      setScreen('result');
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  }, [currentIdx, exercises.length]);

  const current = exercises[currentIdx];

  // Menu screen
  if (screen === 'menu') {
    return (
      <div className="flex flex-col h-dvh">
        <div className="flex-1 overflow-y-auto p-4 pb-nav safe-top">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/learn" className="p-2 -ml-2" style={{ color: 'var(--text-muted)' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Čeština
            </h1>
          </div>

          {/* All families button */}
          <button
            onClick={() => startQuiz()}
            className="w-full glass-card p-4 mb-4 flex items-center justify-between transition-transform active:scale-[0.98]"
          >
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
                Všechna vyjmenovaná slova
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Mix ze všech rodin — 10 cvičení
              </p>
            </div>
            <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Family picker */}
          <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
            Podle rodiny
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FAMILIES.map((f) => (
              <button
                key={f}
                onClick={() => startQuiz(f)}
                className="glass-card p-4 text-left transition-transform active:scale-[0.98]"
              >
                <p className="text-2xl font-bold mb-1" style={{ color: 'var(--accent)' }}>
                  {f}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Slova po {f}
                </p>
              </button>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Result screen
  if (screen === 'result') {
    const correct = answers.filter((a) => a.correct).length;
    const total = answers.length;
    const percentage = Math.round((correct / total) * 100);

    return (
      <div className="flex flex-col h-dvh">
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-nav">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="text-6xl mb-4"
          >
            {percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪'}
          </motion.div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {percentage >= 80 ? 'Super!' : percentage >= 50 ? 'Dobrá práce!' : 'Zkus to znovu!'}
          </h2>

          <p className="text-lg mb-1" style={{ color: 'var(--accent)' }}>
            {correct} / {total} správně ({percentage}%)
          </p>
          {selectedFamily && (
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Rodina: {selectedFamily}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => startQuiz(selectedFamily || undefined)}
              className="accent-button px-6 py-2.5 text-sm"
            >
              Znovu
            </button>
            <button
              onClick={() => setScreen('menu')}
              className="px-6 py-2.5 text-sm font-medium rounded-full"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}
            >
              Menu
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Quiz screen
  if (!current) return null;

  // Render sentence with blanks highlighted
  const parts = current.sentence.split('_');

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col p-4 pb-nav safe-top">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setScreen('menu')} style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {currentIdx + 1} / {exercises.length}
          </span>
          {selectedFamily && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {selectedFamily}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full mb-8" style={{ background: 'var(--bg-input)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--accent)' }}
            animate={{ width: `${((currentIdx + 1) / exercises.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
            Doplň i/í nebo y/ý
          </p>

          <div className="glass-card p-6 mb-8 w-full">
            <p className="text-xl font-medium leading-relaxed text-center" style={{ color: 'var(--text-primary)' }}>
              {parts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < parts.length - 1 && (
                    <span
                      className="inline-block w-8 h-8 mx-1 rounded-lg border-2 border-dashed align-middle"
                      style={{
                        borderColor: lastAnswer
                          ? lastAnswer === 'correct'
                            ? '#22C55E'
                            : '#EF4444'
                          : 'var(--accent)',
                        background: lastAnswer
                          ? lastAnswer === 'correct'
                            ? '#22C55E20'
                            : '#EF444420'
                          : 'var(--accent-soft)',
                        lineHeight: '28px',
                        textAlign: 'center',
                        color: lastAnswer === 'correct' ? '#22C55E' : lastAnswer === 'wrong' ? '#EF4444' : 'transparent',
                        fontWeight: 700,
                      }}
                    >
                      {showExplanation ? current.blanks[Math.min(i, current.blanks.length - 1)]?.correct : '?'}
                    </span>
                  )}
                </span>
              ))}
            </p>
          </div>

          {/* Answer buttons */}
          {!showExplanation ? (
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {['i', 'y', 'í', 'ý'].map((letter) => (
                <motion.button
                  key={letter}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAnswer(letter)}
                  className="py-4 rounded-2xl text-2xl font-bold transition-all"
                  style={{
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  {letter}
                </motion.button>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm space-y-4"
            >
              {/* Feedback */}
              <div
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{
                  background: lastAnswer === 'correct' ? '#22C55E15' : '#EF444415',
                  border: `1px solid ${lastAnswer === 'correct' ? '#22C55E30' : '#EF444430'}`,
                }}
              >
                {lastAnswer === 'correct' ? (
                  <Check size={20} className="text-green-500 flex-shrink-0" />
                ) : (
                  <X size={20} className="text-red-500 flex-shrink-0" />
                )}
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {lastAnswer === 'correct' ? 'Správně!' : 'Špatně...'}
                </p>
              </div>

              {/* Explanation */}
              <div
                className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: 'var(--accent-soft)' }}
              >
                <Lightbulb size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {current.explanation}
                </p>
              </div>

              {/* Next button */}
              <button
                onClick={nextQuestion}
                className="accent-button w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                {currentIdx + 1 >= exercises.length ? 'Výsledky' : 'Další'}
                <ChevronRight size={16} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
