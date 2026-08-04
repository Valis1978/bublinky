'use client';

// "Moje příběhy" — stories Viki chose to keep. Tap one to read it whole,
// with the choices she made written in. No counters, no progress, no badges.

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import type { SavedStory } from '@/types/story';
import { CAMEOS } from '@/lib/story-cameos';
import { hapticTap } from '@/lib/haptics';
import { formatDay, genreGradient, genreMeta, readList, toParagraphs } from './shared';

interface StoryShelfProps {
  userId: string | null;
  /** bump to refetch (a new story was just saved) */
  refreshKey: number;
  scrollToTop?: () => void;
}

export function StoryShelf({ userId, refreshKey, scrollToTop }: StoryShelfProps) {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<SavedStory | null>(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetch(`/api/stories?userId=${encodeURIComponent(userId)}`)
      .then(r => r.json())
      .then((payload: unknown) => {
        if (alive) setStories(readList<SavedStory>(payload, 'stories'));
      })
      .catch(() => { /* offline — empty shelf is fine */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId, refreshKey]);

  const openStory = useCallback((story: SavedStory) => {
    void hapticTap();
    setOpen(story);
    scrollToTop?.();
  }, [scrollToTop]);

  if (open) return <StoryDetail story={open} onBack={() => { setOpen(null); scrollToTop?.(); }} />;

  // Without a user there is nothing to wait for — show the empty shelf.
  if (loading && userId) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-20 rounded-3xl animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="rounded-3xl p-6 text-center space-y-2" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
        <div className="text-[34px]">📖</div>
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
          Zatím je tu prázdno.
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Až se ti nějaký příběh bude líbit, můžeš si ho uložit — a najdeš ho tady.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {stories.map(story => {
        const meta = genreMeta(story.genre);
        const cameo = story.cameoId ? CAMEOS[story.cameoId] : undefined;
        return (
          <motion.button
            key={story.id}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => openStory(story)}
            className="w-full flex items-center gap-3 rounded-3xl p-3 text-left"
            style={{
              minHeight: 76,
              touchAction: 'manipulation',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <span
              className="flex items-center justify-center rounded-2xl flex-shrink-0"
              style={{
                width: 52, height: 52,
                background: 'var(--accent-soft)',
                backgroundImage: genreGradient(story.genre, 60),
              }}
            >
              <span className="text-[24px] leading-none" aria-hidden>{meta.emoji}</span>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {story.title}
              </span>
              <span className="block text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {meta.label}
                {story.createdAt ? ` · ${formatDay(story.createdAt)}` : ''}
              </span>
            </span>
            {cameo && (
              <span className="text-[20px] flex-shrink-0" title={cameo.name} aria-hidden>{cameo.emoji}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function StoryDetail({ story, onBack }: { story: SavedStory; onBack: () => void }) {
  const meta = genreMeta(story.genre);
  const cameo = story.cameoId ? CAMEOS[story.cameoId] : undefined;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4 pb-6"
      >
        <button
          type="button"
          onClick={() => { void hapticTap(); onBack(); }}
          className="flex items-center gap-2 text-sm font-bold -ml-2 px-2"
          style={{ minHeight: 60, touchAction: 'manipulation', color: 'var(--text-muted)', background: 'transparent', border: 'none' }}
        >
          <ArrowLeft size={18} /> Moje příběhy
        </button>

        <div
          className="rounded-3xl p-5"
          style={{
            background: 'var(--accent-soft)',
            backgroundImage: genreGradient(story.genre, 50),
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="text-[30px] mb-1" aria-hidden>{meta.emoji}</div>
          <h2 className="text-2xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
            {story.title}
          </h2>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {meta.label}
            {story.createdAt ? ` · ${formatDay(story.createdAt)}` : ''}
            {cameo ? ` · ${cameo.emoji} ${cameo.name}` : ''}
          </p>
        </div>

        {story.segments.map((segment, i) => {
          const chosenLabel = segment.choices.find(c => c.id === segment.chosen)?.label;
          return (
            <div
              key={i}
              className="rounded-3xl p-5 space-y-3"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
            >
              {toParagraphs(segment.text).map((paragraph, p) => (
                <p key={p} className="text-[17px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {paragraph}
                </p>
              ))}
              {chosenLabel && (
                <p
                  className="text-[14px] italic rounded-2xl px-3 py-2"
                  style={{ background: 'var(--accent-soft)', color: 'var(--text-primary)' }}
                >
                  → vybrala sis: {chosenLabel}
                </p>
              )}
            </div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}
