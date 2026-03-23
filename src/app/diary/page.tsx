'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Lock, ChevronRight, Trash2, X } from 'lucide-react';
import Link from 'next/link';

interface DiaryEntry {
  id: string;
  date: string;      // ISO
  mood: string;       // emoji
  title: string;
  content: string;
  stickers: string[];
}

const MOODS = ['😊', '😄', '🥰', '😎', '🤔', '😴', '😢', '😤', '🤩', '🥺', '😌', '🤪'];

const STICKERS = ['⭐', '❤️', '🌈', '🦋', '🌸', '🎵', '🍕', '📸', '🏃‍♀️', '📚', '🎨', '🐾', '☀️', '🌙', '🎉', '💪'];

const STORAGE_KEY = 'bub_diary';

function loadEntries(): DiaryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveEntries(entries: DiaryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Dnes';
  if (d.toDateString() === yesterday.toDateString()) return 'Včera';

  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' });
}

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // New entry state
  const [mood, setMood] = useState('😊');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [stickers, setStickers] = useState<string[]>([]);

  useEffect(() => {
    setEntries(loadEntries());
    setLoaded(true);
  }, []);

  const saveEntry = () => {
    if (!content.trim()) return;

    const entry: DiaryEntry = {
      id: editing?.id || Date.now().toString(),
      date: editing?.date || new Date().toISOString(),
      mood,
      title: title.trim() || formatDate(new Date().toISOString()),
      content: content.trim(),
      stickers,
    };

    let updated: DiaryEntry[];
    if (editing) {
      updated = entries.map(e => e.id === editing.id ? entry : e);
    } else {
      updated = [entry, ...entries];
    }

    setEntries(updated);
    saveEntries(updated);
    resetForm();
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  };

  const resetForm = () => {
    setShowNew(false);
    setEditing(null);
    setMood('😊');
    setTitle('');
    setContent('');
    setStickers([]);
  };

  const openEntry = (entry: DiaryEntry) => {
    setEditing(entry);
    setMood(entry.mood);
    setTitle(entry.title);
    setContent(entry.content);
    setStickers(entry.stickers);
    setShowNew(true);
  };

  const toggleSticker = (s: string) => {
    setStickers(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  if (!loaded) return null;

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto pb-nav safe-top">
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
          style={{
            background: 'var(--bg-nav)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1" style={{ color: 'var(--text-muted)' }}>
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <Lock size={14} style={{ color: 'var(--accent)' }} />
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Můj deníček</h1>
            </div>
          </div>
          {!showNew && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNew(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <Plus size={20} />
            </motion.button>
          )}
        </div>

        {/* New/Edit entry */}
        <AnimatePresence>
          {showNew && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editing ? 'Upravit zápis' : 'Nový zápis'}
                </h2>
                <button onClick={resetForm} style={{ color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Mood selector */}
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Jak se cítíš?</p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all"
                      style={{
                        background: mood === m ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                        border: mood === m ? '2px solid var(--accent)' : '2px solid transparent',
                        transform: mood === m ? 'scale(1.15)' : 'scale(1)',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nadpis (volitelné)"
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                maxLength={50}
              />

              {/* Content */}
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Co se dnes stalo? Co tě potěšilo? O čem přemýšlíš? 💭"
                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  minHeight: 150,
                }}
                maxLength={2000}
              />

              {/* Sticker tags */}
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Přidej nálepky:</p>
                <div className="flex flex-wrap gap-1.5">
                  {STICKERS.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleSticker(s)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all"
                      style={{
                        background: stickers.includes(s) ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                        border: stickers.includes(s) ? '2px solid var(--accent)' : '2px solid transparent',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={saveEntry}
                disabled={!content.trim()}
                className="w-full py-3 rounded-2xl text-white font-bold disabled:opacity-30"
                style={{ background: 'var(--accent)' }}
              >
                {editing ? 'Uložit změny' : 'Uložit do deníčku'} 📝
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entries list */}
        {!showNew && (
          <div className="p-4 space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="text-5xl">📔</div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Tvůj deníček je prázdný
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Napiš, co se ti dnes stalo! Nikdo jiný to neuvidí 🔒
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowNew(true)}
                  className="px-6 py-3 rounded-2xl text-white font-bold"
                  style={{ background: 'var(--accent)' }}
                >
                  Napsat první zápis ✨
                </motion.button>
              </div>
            ) : (
              entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-4 group"
                  style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
                >
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => openEntry(entry)}
                      className="flex-1 text-left flex items-start gap-3"
                    >
                      <span className="text-2xl">{entry.mood}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                          {entry.title}
                        </p>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                          {entry.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(entry.date)}
                          </span>
                          {entry.stickers.length > 0 && (
                            <span className="text-xs">{entry.stickers.join('')}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
