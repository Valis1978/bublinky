'use client';

import { useState } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Trophy, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { ALL_GEO_CATEGORIES, type GeoQuestion } from '@/data/geography';
import { useStats } from '@/hooks/useStats';

type Screen = 'menu' | 'quiz' | 'result';

export default function GeographyPage() {
  const { completeSession } = useStats();
  const [screen, setScreen] = useState<Screen>('menu');
  const [category, setCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<GeoQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const startQuiz = (catId: string) => {
    const cat = ALL_GEO_CATEGORIES.find((c) => c.id === catId);
    if (!cat) return;
    const shuffled = [...cat.questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCategory(catId);
    setCurrentIdx(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setScreen('quiz');
  };

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === questions[currentIdx].correct) {
      setScore((s) => s + 1);
    }
  };

  const next = () => {
    if (currentIdx + 1 >= questions.length) {
      const finalScore = score + (selected === questions[currentIdx].correct ? 1 : 0);
      completeSession(finalScore, questions.length);
      setScreen('result');
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const catData = ALL_GEO_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 pb-20">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-emerald-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={screen === 'menu' ? '/learn' : '#'}
            onClick={(e) => {
              if (screen !== 'menu') {
                e.preventDefault();
                setScreen('menu');
              }
            }}
            className="p-2 -ml-2 rounded-xl hover:bg-emerald-50"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-600" />
          </Link>
          <h1 className="text-lg font-bold text-emerald-900">
            🗺️ Vlastivěda {catData ? `— ${catData.name}` : ''}
          </h1>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {screen === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-sm text-emerald-600 mb-4">Vyber si téma:</p>
              {ALL_GEO_CATEGORIES.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startQuiz(cat.id)}
                  className="w-full p-4 rounded-2xl bg-white border border-emerald-100 flex items-center gap-4 shadow-sm"
                >
                  <span className="text-3xl">{cat.emoji}</span>
                  <div className="flex-1 text-left">
                    <p className="font-bold" style={{ color: cat.color }}>{cat.name}</p>
                    <p className="text-xs text-gray-500">{cat.questions.length} otázek</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </motion.button>
              ))}
            </motion.div>
          )}

          {screen === 'quiz' && questions.length > 0 && (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-emerald-600">{currentIdx + 1}/{questions.length}</span>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
                <p className="text-base font-semibold text-emerald-900">{questions[currentIdx].question}</p>
              </div>

              <div className="space-y-2">
                {questions[currentIdx].options.map((opt, idx) => {
                  let classes = 'w-full p-4 rounded-xl text-left text-sm font-medium transition-all border-2 ';
                  if (!answered) {
                    classes += 'bg-white border-emerald-100 hover:border-emerald-300 text-emerald-800';
                  } else if (idx === questions[currentIdx].correct) {
                    classes += 'bg-emerald-50 border-emerald-400 text-emerald-800';
                  } else if (idx === selected) {
                    classes += 'bg-red-50 border-red-300 text-red-700';
                  } else {
                    classes += 'bg-gray-50 border-gray-100 text-gray-400';
                  }
                  return (
                    <motion.button key={idx} whileTap={!answered ? { scale: 0.98 } : {}} onClick={() => handleAnswer(idx)} className={classes}>
                      <span className="inline-block w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold leading-6 text-center mr-3">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </motion.button>
                  );
                })}
              </div>

              {answered && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={next}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg"
                >
                  {currentIdx + 1 >= questions.length ? 'Výsledky 🎉' : 'Další →'}
                </motion.button>
              )}
            </motion.div>
          )}

          {screen === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-6">
              <div className="text-6xl">{score >= 9 ? '🏆' : score >= 7 ? '🌟' : score >= 5 ? '👍' : '💪'}</div>
              <h2 className="text-2xl font-bold text-emerald-900">
                {score >= 9 ? 'Výborně!' : score >= 7 ? 'Super!' : score >= 5 ? 'Dobrá práce!' : 'Příště to dáš!'}
              </h2>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                  {score}/{questions.length}
                </div>
                <p className="text-sm text-emerald-500 mt-1">správných odpovědí</p>
                <div className="mt-3 flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-600">+{score * 10} XP</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => startQuiz(category!)} className="flex-1 py-3 rounded-xl bg-emerald-100 text-emerald-700 font-medium flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Znovu
                </button>
                <button onClick={() => setScreen('menu')} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold">
                  Jiné téma
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}
