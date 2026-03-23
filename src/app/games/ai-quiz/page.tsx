'use client';

import { useState } from 'react';
import { useStats } from '@/hooks/useStats';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, BookOpen, Star, Users, Lightbulb, Loader2, Trophy, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface QuizData {
  title: string;
  description: string;
  cast: string[];
  funFacts: string[];
  questions: QuizQuestion[];
}

type Tab = 'quiz' | 'info';

export default function AIQuizPage() {
  const { completeSession } = useStats();
  const [topic, setTopic] = useState('');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [tab, setTab] = useState<Tab>('quiz');

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    setQuizData(null);
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setFinished(false);
    setTab('quiz');

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba');
      setQuizData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (quizData && idx === quizData.questions[currentQ].correct) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (!quizData) return;
    if (currentQ + 1 >= quizData.questions.length) {
      setFinished(true);
      const finalScore = score + (selected === quizData.questions[currentQ].correct ? 1 : 0);
      completeSession(finalScore, quizData.questions.length);
    } else {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const resetQuiz = () => {
    setQuizData(null);
    setTopic('');
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setFinished(false);
  };

  const suggestions = [
    'Wednesday', 'Harry Potter', 'Stranger Things', 'Frozen',
    'Minecraft', 'Encanto', 'Pokemon', 'Taylor Swift',
    'Dinosauři', 'Vesmír', 'Moana', 'Spider-Man',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-pink-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-violet-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/games" className="p-2 -ml-2 rounded-xl hover:bg-violet-50">
            <ArrowLeft className="w-5 h-5 text-violet-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h1 className="text-lg font-bold text-violet-900">AI Kvíz</h1>
          </div>
          {quizData && (
            <button onClick={resetQuiz} className="ml-auto p-2 rounded-xl hover:bg-violet-50">
              <RotateCcw className="w-5 h-5 text-violet-400" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Input phase */}
        {!quizData && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center space-y-2 py-4">
              <div className="text-5xl">🎬</div>
              <h2 className="text-xl font-bold text-violet-900">Na co máš náladu?</h2>
              <p className="text-sm text-violet-500">Napiš seriál, film, hru nebo cokoliv a já ti udělám kvíz!</p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateQuiz()}
                placeholder="Např. Wednesday, Harry Potter..."
                className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-violet-200 focus:border-violet-500 focus:outline-none bg-white text-violet-900 placeholder:text-violet-300 text-base"
                maxLength={100}
              />
              <button
                onClick={generateQuiz}
                disabled={!topic.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-violet-500 text-white disabled:opacity-30"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-violet-400 font-medium uppercase tracking-wide">Nebo vyber:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setTopic(s); }}
                    className="px-3 py-1.5 rounded-full bg-white border border-violet-200 text-sm text-violet-700 hover:bg-violet-50 hover:border-violet-300 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">{error}</div>
            )}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
            <p className="text-violet-600 font-medium">Připravuji kvíz o &quot;{topic}&quot;...</p>
            <p className="text-xs text-violet-400">AI pracuje na otázkách ✨</p>
          </motion.div>
        )}

        {/* Quiz active */}
        {quizData && !finished && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 bg-violet-100 rounded-xl p-1">
              <button
                onClick={() => setTab('quiz')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'quiz' ? 'bg-white text-violet-700 shadow-sm' : 'text-violet-500'
                }`}
              >
                <Star className="w-4 h-4" /> Kvíz
              </button>
              <button
                onClick={() => setTab('info')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'info' ? 'bg-white text-violet-700 shadow-sm' : 'text-violet-500'
                }`}
              >
                <BookOpen className="w-4 h-4" /> O {quizData.title}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {tab === 'quiz' && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Progress */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-violet-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${((currentQ + 1) / quizData.questions.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-violet-600">
                      {currentQ + 1}/{quizData.questions.length}
                    </span>
                  </div>

                  {/* Question */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-violet-100">
                    <p className="text-base font-semibold text-violet-900 leading-relaxed">
                      {quizData.questions[currentQ].question}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {quizData.questions[currentQ].options.map((opt, idx) => {
                      let classes = 'w-full p-4 rounded-xl text-left text-sm font-medium transition-all border-2 ';
                      if (!answered) {
                        classes += 'bg-white border-violet-100 hover:border-violet-300 text-violet-800';
                      } else if (idx === quizData.questions[currentQ].correct) {
                        classes += 'bg-emerald-50 border-emerald-400 text-emerald-800';
                      } else if (idx === selected) {
                        classes += 'bg-red-50 border-red-300 text-red-700';
                      } else {
                        classes += 'bg-gray-50 border-gray-100 text-gray-400';
                      }

                      return (
                        <motion.button
                          key={idx}
                          whileTap={!answered ? { scale: 0.98 } : {}}
                          onClick={() => handleAnswer(idx)}
                          className={classes}
                        >
                          <span className="inline-block w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs font-bold leading-6 text-center mr-3">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          {opt}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Next button */}
                  {answered && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={nextQuestion}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-base shadow-lg"
                    >
                      {currentQ + 1 >= quizData.questions.length ? 'Zobrazit výsledky 🎉' : 'Další otázka →'}
                    </motion.button>
                  )}

                  {/* Score */}
                  <div className="text-center text-sm text-violet-400">
                    Skóre: {score}/{currentQ + (answered ? 1 : 0)}
                  </div>
                </motion.div>
              )}

              {tab === 'info' && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Description */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-violet-100">
                    <h3 className="font-bold text-violet-900 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-violet-500" /> O čem to je
                    </h3>
                    <p className="text-sm text-violet-700 leading-relaxed">{quizData.description}</p>
                  </div>

                  {/* Cast */}
                  {quizData.cast.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-violet-100">
                      <h3 className="font-bold text-violet-900 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-violet-500" /> Kdo tam hraje
                      </h3>
                      <div className="space-y-2">
                        {quizData.cast.map((person, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-violet-700">
                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-200 to-pink-200 flex items-center justify-center text-xs font-bold text-violet-600">
                              {i + 1}
                            </span>
                            {person}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fun Facts */}
                  {quizData.funFacts.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-violet-100">
                      <h3 className="font-bold text-violet-900 mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" /> Věděla jsi, že...
                      </h3>
                      <div className="space-y-3">
                        {quizData.funFacts.map((fact, i) => (
                          <div key={i} className="flex gap-2 text-sm text-violet-700">
                            <span className="text-amber-400 mt-0.5">💡</span>
                            <span>{fact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Results */}
        {finished && quizData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-6"
          >
            <div className="text-6xl">
              {score >= 9 ? '🏆' : score >= 7 ? '🌟' : score >= 5 ? '👍' : '💪'}
            </div>
            <h2 className="text-2xl font-bold text-violet-900">
              {score >= 9 ? 'Geniální!' : score >= 7 ? 'Super!' : score >= 5 ? 'Dobrá práce!' : 'Nevadí, příště to dáš!'}
            </h2>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-violet-100">
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600">
                {score}/{quizData.questions.length}
              </div>
              <p className="text-sm text-violet-500 mt-1">správných odpovědí</p>
              <div className="mt-3 flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-600">
                  +{score * 15} XP
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCurrentQ(0);
                  setScore(0);
                  setSelected(null);
                  setAnswered(false);
                  setFinished(false);
                }}
                className="flex-1 py-3 rounded-xl bg-violet-100 text-violet-700 font-medium"
              >
                Znovu 🔄
              </button>
              <button
                onClick={resetQuiz}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold"
              >
                Nový kvíz ✨
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
