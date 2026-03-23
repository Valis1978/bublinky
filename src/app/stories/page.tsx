'use client';

import { useState } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, BookOpen, Loader2, RotateCcw, Star } from 'lucide-react';
import Link from 'next/link';

interface StoryData {
  title: string;
  story: string;
  moral: string;
}

const GENRES = [
  { id: 'fantasy', emoji: '🧙‍♀️', label: 'Fantasy' },
  { id: 'adventure', emoji: '🗺️', label: 'Dobrodružství' },
  { id: 'detective', emoji: '🔍', label: 'Detektivka' },
  { id: 'fairy-tale', emoji: '👸', label: 'Pohádka' },
  { id: 'sci-fi', emoji: '🚀', label: 'Sci-fi' },
  { id: 'animal', emoji: '🐾', label: 'Zvířecí' },
  { id: 'funny', emoji: '😂', label: 'Vtipný' },
  { id: 'scary-lite', emoji: '👻', label: 'Trochu strašidelný' },
];

const SETTINGS = [
  { id: 'castle', emoji: '🏰', label: 'Hrad' },
  { id: 'forest', emoji: '🌲', label: 'Enchanted les' },
  { id: 'space', emoji: '🌌', label: 'Vesmír' },
  { id: 'ocean', emoji: '🌊', label: 'Oceán' },
  { id: 'school', emoji: '🏫', label: 'Kouzelnická škola' },
  { id: 'city', emoji: '🌆', label: 'Město budoucnosti' },
];

export default function StoriesPage() {
  const [heroName, setHeroName] = useState('Viki');
  const [genre, setGenre] = useState('');
  const [setting, setSetting] = useState('');
  const [extras, setExtras] = useState('');
  const [story, setStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateStory = async () => {
    if (!genre || !heroName.trim()) return;
    setLoading(true);
    setError('');
    setStory(null);

    try {
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroName: heroName.trim(),
          genre: GENRES.find(g => g.id === genre)?.label || genre,
          setting: SETTINGS.find(s => s.id === setting)?.label || setting || '',
          extras: extras.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba');
      setStory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto pb-nav safe-top">
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
          style={{
            background: 'var(--bg-nav)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Link href="/" className="p-1" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen size={18} style={{ color: 'var(--accent)' }} />
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Příběhy</h1>
          </div>
          {story && (
            <button onClick={() => setStory(null)} className="ml-auto p-1" style={{ color: 'var(--text-muted)' }}>
              <RotateCcw size={18} />
            </button>
          )}
        </div>

        <div className="p-4 max-w-lg mx-auto">
          {/* Setup */}
          {!story && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center space-y-2 py-2">
                <div className="text-4xl">📖✨</div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Vytvoř si příběh!
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  AI napíše pohádku, kde jsi hlavní hrdinka
                </p>
              </div>

              {/* Hero name */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  👸 Jméno hrdinky
                </label>
                <input
                  type="text"
                  value={heroName}
                  onChange={e => setHeroName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-base"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '2px solid var(--border)' }}
                  maxLength={30}
                />
              </div>

              {/* Genre */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  🎭 Jaký příběh?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {GENRES.map(g => (
                    <motion.button
                      key={g.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setGenre(g.id)}
                      className="flex flex-col items-center gap-1 py-3 rounded-xl transition-all"
                      style={{
                        background: genre === g.id ? 'var(--accent-soft)' : 'var(--bg-card)',
                        border: genre === g.id ? '2px solid var(--accent)' : '2px solid transparent',
                        boxShadow: 'var(--shadow)',
                      }}
                    >
                      <span className="text-xl">{g.emoji}</span>
                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{g.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Setting */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  🌍 Kde se odehrává? <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(volitelné)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SETTINGS.map(s => (
                    <motion.button
                      key={s.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSetting(setting === s.id ? '' : s.id)}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                      style={{
                        background: setting === s.id ? 'var(--accent-soft)' : 'var(--bg-card)',
                        border: setting === s.id ? '2px solid var(--accent)' : '2px solid transparent',
                        boxShadow: 'var(--shadow)',
                      }}
                    >
                      <span className="text-lg">{s.emoji}</span>
                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Extras */}
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  ✨ Speciální přání <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(volitelné)</span>
                </label>
                <input
                  type="text"
                  value={extras}
                  onChange={e => setExtras(e.target.value)}
                  placeholder="Např. s drakem, s nejlepší kamarádkou..."
                  className="w-full px-4 py-3 rounded-2xl text-sm"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '2px solid var(--border)' }}
                  maxLength={100}
                />
              </div>

              {/* Generate button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={generateStory}
                disabled={!genre || !heroName.trim()}
                className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-30"
                style={{ background: 'var(--accent)' }}
              >
                <Sparkles size={20} /> Vytvořit příběh
              </motion.button>

              {error && (
                <div className="p-3 rounded-xl text-center text-sm" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  {error}
                </div>
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
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={40} style={{ color: 'var(--accent)' }} />
              </motion.div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Píšu příběh o {heroName}...</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI pracuje na tvé pohádce ✨</p>
            </motion.div>
          )}

          {/* Story display */}
          {story && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Title */}
              <div className="text-center py-4">
                <motion.div
                  className="text-4xl mb-3"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  📖
                </motion.div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {story.title}
                </h2>
              </div>

              {/* Story text */}
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
              >
                {story.story.split('\n').filter(Boolean).map((paragraph, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>

              {/* Moral */}
              <div
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: 'var(--accent-soft)' }}
              >
                <Star size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--accent)' }}>Poučení</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{story.moral}</p>
                </div>
              </div>

              {/* New story button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStory(null)}
                className="w-full py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                style={{ background: 'var(--bg-card)', color: 'var(--accent)', boxShadow: 'var(--shadow)' }}
              >
                <Sparkles size={18} /> Další příběh
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
