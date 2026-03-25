'use client';

import { useState, useEffect, useCallback } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Zap, Droplets, Sparkles, Moon, Gamepad2,
  Cookie, ShowerHead, Star, Coins,
} from 'lucide-react';
import {
  PetState, PetSpecies, PET_SPRITES, EVOLUTION_SPRITES,
  createNewPet, loadPet, savePet, applyDecay, performAction,
  calculateMood, getMoodEmoji, getMoodLabel, getLevelProgress,
  getStageName, ACTIONS, getDominantSkill,
} from '@/lib/pet-engine';
import { PetTabBar, type PetTab } from '@/components/pet/PetTabBar';
import { SpeechBubble } from '@/components/pet/SpeechBubble';
import { PetChatPanel } from '@/components/pet/PetChatPanel';
import { SkillTree } from '@/components/pet/SkillTree';

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
  const [petId, setPetId] = useState<string | undefined>();
  const [view, setView] = useState<View>('main');
  const [tab, setTab] = useState<PetTab>('home');
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpecies>('cat');
  const [petName, setPetName] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [proactiveMsg, setProactiveMsg] = useState('');
  const [proactiveEmotion, setProactiveEmotion] = useState('');
  const [showProactive, setShowProactive] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Load pet + sync with Supabase
  useEffect(() => {
    const saved = loadPet();
    if (saved) {
      const updated = applyDecay(saved);
      setPet(updated);
      savePet(updated);
      setView('main');

      // Async sync to Supabase
      const user = typeof window !== 'undefined' ? localStorage.getItem('bub_user') : null;
      if (user) {
        const { id } = JSON.parse(user);
        fetch(`/api/pet?userId=${id}`)
          .then(r => r.json())
          .then(data => { if (data.success) setPetId(data.pet.id); })
          .catch(() => {});

        // Upsert to DB
        fetch('/api/pet', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: id, pet: updated }),
        })
          .then(r => r.json())
          .then(data => { if (data.success && data.petId) setPetId(data.petId); })
          .catch(() => {});
      }
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

  // Fetch proactive message on mount
  useEffect(() => {
    if (!pet || view !== 'main') return;
    const timer = setTimeout(() => {
      fetch('/api/pet/proactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petId, petName: pet.name, species: pet.species,
          stage: pet.stage, level: pet.level, mood: pet.mood,
          hunger: pet.hunger, happiness: pet.happiness,
          energy: pet.energy, cleanliness: pet.cleanliness,
          foodBravery: pet.foodBravery,
        }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.message) {
            setProactiveMsg(data.message);
            setProactiveEmotion(data.emotion || 'happy');
            setShowProactive(true);
            setTimeout(() => setShowProactive(false), 8000);
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [pet?.name, view]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = () => {
    if (!petName.trim()) return;
    const newPet = createNewPet(selectedSpecies, petName.trim());
    setPet(newPet);
    savePet(newPet);
    setView('main');

    // Save to Supabase
    const user = typeof window !== 'undefined' ? localStorage.getItem('bub_user') : null;
    if (user) {
      const { id } = JSON.parse(user);
      fetch('/api/pet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, pet: newPet }),
      })
        .then(r => r.json())
        .then(data => { if (data.success && data.petId) setPetId(data.petId); })
        .catch(() => {});
    }
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
    setShowProactive(false);
    setTimeout(() => setShowMessage(false), 2500);
  }, [pet]);

  if (!loaded) return null;

  // ═══════════════ SETUP SCREEN ═══════════════
  if (view === 'setup' || !pet) {
    return (
      <div className="flex flex-col h-dvh">
        <div className="flex-1 overflow-y-auto p-6 pb-nav safe-top">
          <div className="max-w-sm mx-auto space-y-8">
            <div className="text-center space-y-2 pt-8">
              <motion.div className="text-6xl"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >🥚</motion.div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Vyber si mazlíčka!
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Starej se o něj a poroste s tebou
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {SPECIES_OPTIONS.map(sp => (
                <motion.button key={sp.id} whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSpecies(sp.id)}
                  className="p-4 rounded-2xl flex flex-col items-center gap-2 transition-all"
                  style={{
                    border: selectedSpecies === sp.id ? '2px solid var(--accent)' : '2px solid transparent',
                    background: selectedSpecies === sp.id ? 'var(--accent-soft)' : 'var(--bg-card)',
                  }}
                >
                  <span className="text-3xl">{sp.emoji}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{sp.name}</span>
                </motion.button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Jak se bude jmenovat?
              </label>
              <input type="text" value={petName}
                onChange={e => setPetName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Např. Bubla, Fifi, Drako..."
                className="w-full px-4 py-3 rounded-2xl text-base"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '2px solid var(--border)' }}
                maxLength={20}
              />
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate}
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

  // ═══════════════ MAIN VIEW ═══════════════
  const sprite = pet.evolutionPath && (pet.stage === 'adult' || pet.stage === 'legendary')
    ? `${PET_SPRITES[pet.species as PetSpecies]?.[pet.stage] || '🐾'}${EVOLUTION_SPRITES[pet.evolutionPath]?.emoji || ''}`
    : PET_SPRITES[pet.species as PetSpecies]?.[pet.stage] || '🐾';
  const mood = calculateMood(pet);
  const moodEmoji = getMoodEmoji(mood);
  const moodLabel = getMoodLabel(mood);
  const progress = getLevelProgress(pet);
  const stageName = getStageName(pet.stage);
  const daysOld = Math.floor((Date.now() - new Date(pet.born).getTime()) / (1000 * 60 * 60 * 24));
  const dominantSkill = getDominantSkill(pet.skills);

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <div className="safe-top px-4 py-2 flex items-center justify-between"
        style={{ background: 'var(--bg-nav)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{moodEmoji}</span>
          <div>
            <h1 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{pet.name}</h1>
            <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
              Lvl {pet.level} • {stageName} • {daysOld}d
              {dominantSkill ? ` • ${dominantSkill.name}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
          style={{ background: 'var(--bg-card)', color: '#F59E0B' }}>
          <Coins size={12} /> {pet.coins}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'home' && (
          <div className="h-full overflow-y-auto pb-2">
            {/* Pet display area */}
            <div className="relative flex flex-col items-center justify-center py-6 mx-4 mt-3 rounded-3xl"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)', minHeight: 180 }}
            >
              {/* Mood badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-secondary)' }}>
                <span className="text-xs">{moodEmoji}</span>
                <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>{moodLabel}</span>
              </div>

              {/* Proactive speech bubble */}
              <SpeechBubble message={proactiveMsg} emotion={proactiveEmotion} visible={showProactive && !showMessage} />

              {/* Action message */}
              <SpeechBubble message={actionMessage} visible={showMessage} />

              {/* Pet sprite */}
              <motion.div key={bounceKey} className="text-6xl select-none"
                animate={
                  pet.isOnVacation ? { rotate: [0, 5, -5, 0], scale: [1, 0.9, 1] }
                  : pet.isSleeping ? { y: [0, -3, 0], scale: [1, 1.02, 1] }
                  : mood === 'ecstatic' ? { y: [0, -20, 0], rotate: [0, -5, 5, 0] }
                  : mood === 'happy' ? { y: [0, -10, 0] }
                  : mood === 'sad' || mood === 'hungry' ? { y: [0, 2, 0], scale: [1, 0.95, 1] }
                  : { y: [0, -5, 0] }
                }
                transition={{ duration: pet.isSleeping ? 3 : 1.5, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
              >
                {pet.isOnVacation ? '🏖️' : sprite}
              </motion.div>

              {/* Level progress */}
              <div className="w-40 mt-3">
                <div className="flex justify-between mb-0.5">
                  <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    <Star className="w-3 h-3 inline" /> Lvl {pet.level}
                  </span>
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                    {progress.current}/{progress.needed} XP
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, var(--accent), #F59E0B)' }}
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mx-4 mt-3 p-3 rounded-2xl space-y-2" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
              <StatBar icon={<Heart size={12} className="text-red-400" />} label="Hlad" value={pet.hunger} color="#F87171" />
              <StatBar icon={<Sparkles size={12} className="text-yellow-400" />} label="Štěstí" value={pet.happiness} color="#FBBF24" />
              <StatBar icon={<Zap size={12} className="text-blue-400" />} label="Energie" value={pet.energy} color="#60A5FA" />
              <StatBar icon={<Droplets size={12} className="text-cyan-400" />} label="Čistota" value={pet.cleanliness} color="#22D3EE" />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-5 gap-2 mx-4 mt-3 mb-4">
              {[
                { action: 'feed' as const, icon: <span className="text-lg">🍕</span>, label: 'Krmit' },
                { action: 'play' as const, icon: <Gamepad2 size={18} />, label: 'Hrát si' },
                { action: 'sleep' as const, icon: <Moon size={18} />, label: 'Spát' },
                { action: 'bathe' as const, icon: <ShowerHead size={18} />, label: 'Koupat' },
                { action: 'treat' as const, icon: <Cookie size={18} />, label: 'Pamlsek' },
              ].map(({ action, icon, label }) => (
                <motion.button key={action} whileTap={{ scale: 0.9 }}
                  onClick={() => doAction(action)}
                  className="flex flex-col items-center gap-0.5 py-2.5 rounded-2xl transition-all active:opacity-80"
                  style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
                >
                  <div style={{ color: 'var(--accent)' }}>{icon}</div>
                  <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {tab === 'chat' && (
          <PetChatPanel pet={pet} petId={petId} />
        )}

        {tab === 'quests' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="text-center py-12 space-y-3">
              <span className="text-5xl">⭐</span>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Questy brzy!</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Denní úkoly a dobrodružství se připravují...
              </p>
            </div>
          </div>
        )}

        {tab === 'inventory' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="text-center py-12 space-y-3">
              <span className="text-5xl">🎒</span>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Batoh brzy!</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Tvoje předměty a obchůdek se chystají...
              </p>
              <div className="flex items-center justify-center gap-1 text-sm font-bold" style={{ color: '#F59E0B' }}>
                <Coins size={14} /> {pet.coins} mincí
              </div>
            </div>
          </div>
        )}

        {tab === 'skills' && (
          <div className="h-full overflow-y-auto">
            <SkillTree skills={pet.skills} evolutionPath={pet.evolutionPath} />
          </div>
        )}
      </div>

      {/* Pet tab bar */}
      <PetTabBar active={tab} onChange={setTab} />

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
}
