'use client';

// Story setup wizard — pick a genre, optionally whisper a place and a wish.
// Everything except the genre is skippable on purpose: no form pressure.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GENRES, type StorySetup as StorySetupData } from '@/types/story';
import { MiniPet } from '@/components/pet/avatar/PetAvatar';
import type { PetSpecies, PetStage } from '@/lib/pet-engine';
import { hapticTap } from '@/lib/haptics';
import { genreGradient } from './shared';

interface StorySetupProps {
  heroName: string;
  petName: string;
  petSpecies: PetSpecies;
  petStage: PetStage;
  onStart: (setup: StorySetupData) => void;
}

export function StorySetup({ heroName, petName, petSpecies, petStage, onStart }: StorySetupProps) {
  const [genre, setGenre] = useState('');
  const [setting, setSetting] = useState('');
  const [extras, setExtras] = useState('');

  const start = () => {
    if (!genre) return;
    void hapticTap();
    onStart({
      heroName,
      petName,
      petSpecies,
      genre,
      setting: setting.trim() || undefined,
      extras: extras.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Intro */}
      <div className="flex items-center gap-3 rounded-3xl p-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
        <MiniPet species={petSpecies} stage={petStage} mood="happy" size={62} />
        <div>
          <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            Vymyslíme příběh?
          </p>
          <p className="text-[13px] leading-snug" style={{ color: 'var(--text-muted)' }}>
            Budeš v něm ty, {heroName} — a {petName} jde s tebou.
          </p>
        </div>
      </div>

      {/* Genre cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold px-1" style={{ color: 'var(--text-primary)' }}>
          O čem to bude?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {GENRES.map(g => {
            const active = genre === g.id;
            return (
              <motion.button
                key={g.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => { setGenre(g.id); void hapticTap(); }}
                aria-pressed={active}
                className="flex flex-col items-center justify-center gap-2 rounded-3xl px-2 py-4 text-center"
                style={{
                  minHeight: 112,
                  touchAction: 'manipulation',
                  // color-mix gradient sits on top of a plain fallback color
                  background: active ? 'var(--accent-soft)' : 'var(--bg-card)',
                  backgroundImage: active ? genreGradient(g.id, 55) : 'none',
                  border: active ? '2px solid var(--accent)' : '2px solid var(--border)',
                  boxShadow: active ? 'var(--shadow-lg)' : 'var(--shadow)',
                }}
              >
                <span className="text-[34px] leading-none">{g.emoji}</span>
                <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
                  {g.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Optional details */}
      <section className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="story-setting" className="text-sm font-bold px-1 block" style={{ color: 'var(--text-primary)' }}>
            Kde se to stane?{' '}
            <span className="font-normal" style={{ color: 'var(--text-muted)' }}>nemusíš vyplňovat</span>
          </label>
          <input
            id="story-setting"
            type="text"
            value={setting}
            onChange={e => setSetting(e.target.value)}
            placeholder="v zasněženém lese, na pirátské lodi…"
            maxLength={80}
            enterKeyHint="next"
            className="w-full px-4 rounded-2xl text-[15px]"
            style={{
              minHeight: 60,
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '2px solid var(--border)',
            }}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="story-extras" className="text-sm font-bold px-1 block" style={{ color: 'var(--text-primary)' }}>
            Máš nějaké přání?{' '}
            <span className="font-normal" style={{ color: 'var(--text-muted)' }}>klidně přeskoč</span>
          </label>
          <input
            id="story-extras"
            type="text"
            value={extras}
            onChange={e => setExtras(e.target.value)}
            placeholder="ať tam je duha, ať se ztratí mapa…"
            maxLength={120}
            enterKeyHint="go"
            onKeyDown={e => { if (e.key === 'Enter') start(); }}
            className="w-full px-4 rounded-2xl text-[15px]"
            style={{
              minHeight: 60,
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '2px solid var(--border)',
            }}
          />
        </div>
      </section>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={start}
        disabled={!genre}
        className="w-full rounded-3xl text-white font-bold text-[17px] disabled:opacity-40"
        style={{
          minHeight: 64,
          touchAction: 'manipulation',
          background: 'var(--accent-gradient)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        Vyprávěj! ✨
      </motion.button>

      {!genre && (
        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Vyber si nahoře, o čem to bude 💛
        </p>
      )}
    </div>
  );
}
