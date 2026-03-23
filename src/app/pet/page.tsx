'use client';

import { useState, useEffect, useCallback } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, Zap, Droplets, Sparkles, Moon, Gamepad2,
  Cookie, ShowerHead, Star, Trophy,
} from 'lucide-react';
import Link from 'next/link';
import {
  PetState, PetSpecies, PET_SPRITES,
  createNewPet, loadPet, savePet, applyDecay, performAction,
  calculateMood, getMoodEmoji, getMoodLabel, getLevelProgress,
  getStageName, ACTIONS,
} from '@/lib/pet-engine';

type View = 'setup' | 'main';

const SPECIES_OPTIONS: { id: PetSpecies; emoji: string; name: string }[] = [
  { id: 'cat', emoji: '🐱', name: 'Kočička' },
  { id: 'dog', emoji: '🐶', name: 'Pejsek' },
  { id: 'bunny', emoji: '🐰', name: 'Králíček' },
  { id: 'dragon', emoji: '🐲', name: 'Dráček' },
  { id: 'unicorn', emoji: '🦄', name: 'Jednorožec' },
  { id: 'fox', emoji: '🦊', name: 'Lištička' },
];

function StatBar({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 flex-shrink-0 flex justify-center">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between mb-0.5">
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
          <span className="text-[10px] font-bold" style={{ color }}>{Math.round(value)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={false}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PetPage() {
  const [pet, setPet] = useState<PetState | null>(null);
  const [view, setView] = useState<View>('main');
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpecies>('cat');
  const [petName, setPetName] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Load pet on mount
  useEffect(() => {
    const saved = loadPet();
    if (saved) {
      const updated = applyDecay(saved);
      setPet(updated);
      savePet(updated);
      setView('main');
    } else {
      setView('setup');
    }
    setLoaded(true);
  }, []);

  // Auto-save + decay every minute
  useEffect(() => {
    if (!pet) return;
    const interval = setInterval(() => {
      setPet(prev => {
        if (!prev) return prev;
        const updated = applyDecay(prev);
        savePet(updated);
        return updated;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [pet]);

  const handleCreate = () => {
    if (!petName.trim()) return;
    const newPet = createNewPet(selectedSpecies, petName.trim());
    setPet(newPet);
    savePet(newPet);
    setView('main');
  };

  const doAction = useCallback((action: keyof typeof ACTIONS) => {
    if (!pet) return;
    const result = performAction(pet, action);
    if (!result.blocked) {
      setPet(result.pet);
      savePet(result.pet);
      setBounceKey(k => k + 1);
    }
    setActionMessage(result.message);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 2000);
  }, [pet]);

  if (!loaded) return null;

  // Setup screen
  if (view === 'setup' || !pet) {
    return (
      <div className="flex flex-col h-dvh">
        <div className="flex-1 overflow-y-auto p-6 pb-nav safe-top">
          <div className="max-w-sm mx-auto space-y-8">
            <div className="text-center space-y-2 pt-8">
              <motion.div
                className="text-6xl"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                🥚
              </motion.div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Vyber si mazlíčka!
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Starej se o něj a poroste s tebou
              </p>
            </div>

            {/* Species selection */}
            <div className="grid grid-cols-3 gap-3">
              {SPECIES_OPTIONS.map(sp => (
                <motion.button
                  key={sp.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSpecies(sp.id)}
                  className="glass-card p-4 flex flex-col items-center gap-2 transition-all"
                  style={{
                    border: selectedSpecies === sp.id ? '2px solid var(--accent)' : '2px solid transparent',
                    background: selectedSpecies === sp.id ? 'var(--accent-soft)' : 'var(--bg-card)',
                  }}
                >
                  <span className="text-3xl">{sp.emoji}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {sp.name}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Name input */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Jak se bude jmenovat?
              </label>
              <input
                type="text"
                value={petName}
                onChange={e => setPetName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Např. Bubla, Fifi, Drako..."
                className="w-full px-4 py-3 rounded-2xl text-base"
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '2px solid var(--border)',
                }}
                maxLength={20}
              />
            </div>

            {/* Create button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              disabled={!petName.trim()}
              className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-30"
              style={{ background: 'var(--accent)' }}
            >
              Adoptovat {SPECIES_OPTIONS.find(s => s.id === selectedSpecies)?.emoji} ❤️
            </motion.button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Main pet view
  const sprite = PET_SPRITES[pet.species as PetSpecies]?.[pet.stage] || '🐾';
  const mood = calculateMood(pet);
  const moodEmoji = getMoodEmoji(mood);
  const moodLabel = getMoodLabel(mood);
  const progress = getLevelProgress(pet);
  const stageName = getStageName(pet.stage);
  const daysOld = Math.floor((Date.now() - new Date(pet.born).getTime()) / (1000 * 60 * 60 * 24));

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
          <Link href="/" className="p-1" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>
          <div className="text-center">
            <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {pet.name}
            </h1>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {stageName} • Lvl {pet.level} • {daysOld}d starý
            </p>
          </div>
          <div className="w-8" />
        </div>

        {/* Pet display area */}
        <div
          className="relative flex flex-col items-center justify-center py-8 mx-4 mt-4 rounded-3xl"
          style={{
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow)',
            minHeight: 220,
          }}
        >
          {/* Mood indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: 'var(--bg-secondary)' }}>
            <span className="text-sm">{moodEmoji}</span>
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{moodLabel}</span>
          </div>

          {/* Pet sprite with animations */}
          <motion.div
            key={bounceKey}
            className="text-7xl select-none"
            animate={
              pet.isSleeping
                ? { y: [0, -3, 0], scale: [1, 1.02, 1] }
                : mood === 'ecstatic'
                  ? { y: [0, -20, 0], rotate: [0, -5, 5, 0] }
                  : mood === 'happy'
                    ? { y: [0, -10, 0] }
                    : mood === 'sad' || mood === 'hungry'
                      ? { y: [0, 2, 0], scale: [1, 0.95, 1] }
                      : { y: [0, -5, 0] }
            }
            transition={{
              duration: pet.isSleeping ? 3 : 1.5,
              repeat: Infinity,
              repeatDelay: pet.isSleeping ? 2 : 1,
              ease: 'easeInOut',
            }}
          >
            {sprite}
          </motion.div>

          {/* Action message bubble */}
          <AnimatePresence>
            {showMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute -top-2 px-4 py-2 rounded-2xl"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                <p className="text-sm font-bold whitespace-nowrap">{actionMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Level XP bar */}
          <div className="w-48 mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                <Star className="w-3 h-3 inline" /> Lvl {pet.level}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {progress.current}/{progress.needed} XP
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, var(--accent), #F59E0B)' }}
                animate={{ width: `${progress.percent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-4 mt-4 p-4 rounded-2xl space-y-3" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
          <StatBar icon={<Heart size={14} className="text-red-400" />} label="Hlad" value={pet.hunger} color="#F87171" />
          <StatBar icon={<Sparkles size={14} className="text-yellow-400" />} label="Štěstí" value={pet.happiness} color="#FBBF24" />
          <StatBar icon={<Zap size={14} className="text-blue-400" />} label="Energie" value={pet.energy} color="#60A5FA" />
          <StatBar icon={<Droplets size={14} className="text-cyan-400" />} label="Čistota" value={pet.cleanliness} color="#22D3EE" />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-5 gap-2 mx-4 mt-4 mb-4">
          {[
            { action: 'feed' as const, icon: <span className="text-xl">🍕</span>, label: 'Krmit' },
            { action: 'play' as const, icon: <Gamepad2 size={20} />, label: 'Hrát si' },
            { action: 'sleep' as const, icon: <Moon size={20} />, label: 'Spát' },
            { action: 'bathe' as const, icon: <ShowerHead size={20} />, label: 'Koupat' },
            { action: 'treat' as const, icon: <Cookie size={20} />, label: 'Pamlsek' },
          ].map(({ action, icon, label }) => (
            <motion.button
              key={action}
              whileTap={{ scale: 0.9 }}
              onClick={() => doAction(action)}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl transition-all active:opacity-80"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
            >
              <div style={{ color: 'var(--accent)' }}>{icon}</div>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </motion.button>
          ))}
        </div>

        {/* Pet info card */}
        <div className="mx-4 mb-4 p-4 rounded-2xl" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>O {pet.name}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{pet.level}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Level</p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{daysOld}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Dní</p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{stageName}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Fáze</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
