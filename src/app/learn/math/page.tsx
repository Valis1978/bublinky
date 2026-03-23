'use client';

import { useState, useCallback } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Check, X, Trophy } from 'lucide-react';
import Link from 'next/link';
import { generateProblem, type MathProblem, type MathOperation, type MathDifficulty } from '@/lib/questions/math-generator';

type Screen = 'menu' | 'quiz' | 'result';

const operations: Array<{ id: MathOperation | 'word' | 'mix'; label: string; emoji: string }> = [
  { id: 'mix', label: 'Mix všeho', emoji: '🎲' },
  { id: 'add', label: 'Sčítání', emoji: '➕' },
  { id: 'subtract', label: 'Odčítání', emoji: '➖' },
  { id: 'multiply', label: 'Násobení', emoji: '✖️' },
  { id: 'divide', label: 'Dělení', emoji: '➗' },
  { id: 'word', label: 'Slovní úlohy', emoji: '📝' },
];

const difficulties: Array<{ level: MathDifficulty; label: string; desc: string }> = [
  { level: 1, label: 'Lehké', desc: 'Malá čísla' },
  { level: 2, label: 'Střední', desc: 'Větší čísla' },
  { level: 3, label: 'Těžké', desc: 'Pro profíky' },
];

export default function MathPage() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedOp, setSelectedOp] = useState<string>('mix');
  const [difficulty, setDifficulty] = useState<MathDifficulty>(1);
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [questionNum, setQuestionNum] = useState(0);
  const [score, setScore] = useState(0);
  const [totalQuestions] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const nextProblem = useCallback(() => {
    const op = selectedOp === 'mix' ? undefined : selectedOp as MathOperation | 'word';
    setProblem(generateProblem({ operation: op, difficulty }));
    setSelectedAnswer(null);
    setIsCorrect(null);
  }, [selectedOp, difficulty]);

  const startQuiz = useCallback(() => {
    setQuestionNum(0);
    setScore(0);
    setScreen('quiz');
    const op = selectedOp === 'mix' ? undefined : selectedOp as MathOperation | 'word';
    setProblem(generateProblem({ operation: op, difficulty }));
    setSelectedAnswer(null);
    setIsCorrect(null);
  }, [selectedOp, difficulty]);

  const handleAnswer = useCallback(
    (answer: number) => {
      if (selectedAnswer !== null || !problem) return;
      setSelectedAnswer(answer);
      const correct = answer === problem.answer;
      setIsCorrect(correct);
      if (correct) setScore((s) => s + 1);

      // Auto-advance after delay
      setTimeout(() => {
        if (questionNum + 1 >= totalQuestions) {
          setScreen('result');
        } else {
          setQuestionNum((n) => n + 1);
          const op = selectedOp === 'mix' ? undefined : selectedOp as MathOperation | 'word';
          setProblem(generateProblem({ operation: op, difficulty }));
          setSelectedAnswer(null);
          setIsCorrect(null);
        }
      }, correct ? 600 : 1500);
    },
    [selectedAnswer, problem, questionNum, totalQuestions, selectedOp, difficulty]
  );

  // Menu
  if (screen === 'menu') {
    return (
      <div className="flex flex-col h-dvh">
        <div className="flex-1 overflow-y-auto p-4 pb-24 safe-top">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/learn" className="p-2 -ml-2" style={{ color: 'var(--text-muted)' }}>
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Matematika
            </h1>
          </div>

          {/* Operation picker */}
          <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
            Typ příkladů
          </p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {operations.map((op) => (
              <button
                key={op.id}
                onClick={() => setSelectedOp(op.id)}
                className="glass-card p-3 text-left transition-all"
                style={{
                  border: selectedOp === op.id ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                <span className="text-lg">{op.emoji}</span>
                <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                  {op.label}
                </p>
              </button>
            ))}
          </div>

          {/* Difficulty */}
          <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
            Obtížnost
          </p>
          <div className="flex gap-2 mb-6">
            {difficulties.map((d) => (
              <button
                key={d.level}
                onClick={() => setDifficulty(d.level)}
                className="flex-1 py-3 rounded-xl text-center transition-all"
                style={{
                  background: difficulty === d.level ? 'var(--accent)' : 'var(--bg-input)',
                  color: difficulty === d.level ? 'white' : 'var(--text-secondary)',
                }}
              >
                <p className="text-sm font-bold">{d.label}</p>
                <p className="text-[10px]">{d.desc}</p>
              </button>
            ))}
          </div>

          {/* Start */}
          <button onClick={startQuiz} className="accent-button w-full py-3 text-sm">
            Začít! (10 příkladů)
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Result
  if (screen === 'result') {
    const percentage = Math.round((score / totalQuestions) * 100);
    return (
      <div className="flex flex-col h-dvh">
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="mb-4"
          >
            <Trophy size={64} style={{ color: percentage >= 80 ? '#FBBF24' : 'var(--text-muted)' }} />
          </motion.div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {percentage >= 90 ? 'Výborně!' : percentage >= 70 ? 'Dobrá práce!' : percentage >= 50 ? 'Jde to!' : 'Zkus to znovu!'}
          </h2>
          <p className="text-3xl font-bold mb-1" style={{ color: 'var(--accent)' }}>
            {score} / {totalQuestions}
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {percentage}% správně
          </p>

          <div className="flex gap-3">
            <button onClick={startQuiz} className="accent-button px-6 py-2.5 text-sm">
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

  // Quiz
  if (!problem) return null;

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 flex flex-col p-4 pb-24 safe-top">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setScreen('menu')} style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {questionNum + 1} / {totalQuestions}
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
            {score} ✓
          </span>
        </div>

        {/* Progress */}
        <div className="h-1.5 rounded-full mb-8" style={{ background: 'var(--bg-input)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--accent)' }}
            animate={{ width: `${((questionNum + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="glass-card p-6 w-full mb-8">
            <p
              className="text-center font-medium leading-relaxed"
              style={{
                color: 'var(--text-primary)',
                fontSize: problem.question.length > 40 ? '16px' : '24px',
              }}
            >
              {problem.question}
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {problem.options.map((option, i) => {
              let bg = 'var(--bg-card)';
              let color = 'var(--text-primary)';
              let icon = null;

              if (selectedAnswer !== null) {
                if (option === problem.answer) {
                  bg = '#22C55E';
                  color = 'white';
                  icon = <Check size={16} />;
                } else if (option === selectedAnswer && !isCorrect) {
                  bg = '#EF4444';
                  color = 'white';
                  icon = <X size={16} />;
                }
              }

              return (
                <motion.button
                  key={i}
                  whileTap={selectedAnswer === null ? { scale: 0.95 } : {}}
                  onClick={() => handleAnswer(option)}
                  disabled={selectedAnswer !== null}
                  className="py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-2 transition-all"
                  style={{ background: bg, color, boxShadow: 'var(--shadow)' }}
                >
                  {icon}
                  {option}
                </motion.button>
              );
            })}
          </div>

          {/* Hint */}
          {problem.hint && selectedAnswer === null && (
            <p className="text-xs mt-4 text-center" style={{ color: 'var(--text-muted)' }}>
              💡 {problem.hint}
            </p>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
