'use client';

import { useState, useEffect, useCallback } from 'react';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import {
  Heart, Zap, Droplets, Sparkles, Moon, Gamepad2,
  Cookie, ShowerHead, Star, Coins,
} from 'lucide-react';
import {
  PetState, PetSpecies, createNewPet, loadPet, savePet, applyDecay,
  performAction, calculateMood, getMoodEmoji, getMoodLabel, getLevelProgress,
  getStageName, ACTIONS, getDominantSkill,
} from '@/lib/pet-engine';
import { PetTabBar, type PetTab } from '@/components/pet/PetTabBar';
import { SpeechBubble } from '@/components/pet/SpeechBubble';
import { PetChatPanel, type ChatMessage } from '@/components/pet/PetChatPanel';
import { SkillTree } from '@/components/pet/SkillTree';
import { PetAvatar, MiniPet } from '@/components/pet/avatar/PetAvatar';
import { SPECIES } from '@/components/pet/avatar/species';
import { PetRoom } from '@/components/pet/room/PetRoom';
import { ShopPanel } from '@/components/pet/ShopPanel';
import { BackpackPanel } from '@/components/pet/BackpackPanel';
import { hapticTap, hapticBump, hapticWarn, hapticSuccess } from '@/lib/haptics';
import {
  getRoutinesByTime, getCurrentTimeOfDay, getCompletedRoutines,
  completeRoutine, getRoutineStreak, type RoutineStep,
} from '@/lib/routine-engine';

type View = 'setup' | 'main';

const SPECIES_OPTIONS: PetSpecies[] = ['cat', 'dog', 'bunny', 'dragon', 'unicorn', 'fox'];

function StatBar({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 flex-shrink-0 flex justify-center">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between mb-0.5">
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
          <span className="text-[11px] font-bold" style={{ color }}>{Math.round(value)}%</span>
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

// Persist last 20 chat messages
const CHAT_STORAGE_KEY = 'bub_pet_chat';
const MAX_CHAT_MESSAGES = 20;

function loadChatMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw).slice(-MAX_CHAT_MESSAGES) : [];
  } catch { return []; }
}

function saveChatMessages(msgs: ChatMessage[]) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_CHAT_MESSAGES)));
  } catch { /* full storage */ }
}

export default function PetPage() {
  const [pet, setPet] = useState<PetState | null>(() => {
    const saved = loadPet();
    return saved ? applyDecay(saved) : null;
  });
  const [petId, setPetId] = useState<string | undefined>();
  const [view, setView] = useState<View>(() => loadPet() ? 'main' : 'setup');
  const [tab, setTab] = useState<PetTab>('home');
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpecies>('cat');
  const [petName, setPetName] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [proactiveMsg, setProactiveMsg] = useState('');
  const [proactiveEmotion, setProactiveEmotion] = useState('');
  const [showProactive, setShowProactive] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => loadChatMessages());

  // Persist chat messages when they change
  useEffect(() => {
    if (chatMessages.length > 0) saveChatMessages(chatMessages);
  }, [chatMessages]);

  // Sync with Supabase on mount (pet already loaded via lazy init)
  useEffect(() => {
    if (!pet) return;
    savePet(pet);

    let userId: string | null = null;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('bub_user') : null;
      if (raw) userId = JSON.parse(raw)?.id;
    } catch { /* corrupted localStorage */ }
    if (!userId) return;

    const id = userId;
    fetch(`/api/pet?userId=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.pet) {
          setPetId(data.pet.id);
          const serverUpdate = new Date(data.pet.lastUpdate).getTime();
          const localUpdate = new Date(pet.lastUpdate).getTime();
          if (serverUpdate > localUpdate) {
            const serverPet = applyDecay(data.pet);
            setPet(serverPet);
            savePet(serverPet);
          }
        } else {
          fetch('/api/pet', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: id, pet }),
          })
            .then(r => r.json())
            .then(d => { if (d.success && d.petId) setPetId(d.petId); })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    void hapticSuccess();

    // Save to Supabase
    let createUserId: string | null = null;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('bub_user') : null;
      if (raw) createUserId = JSON.parse(raw)?.id;
    } catch { /* ignore */ }
    if (createUserId) {
      const id = createUserId;
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
      if (result.message.includes('Evoluce')) void hapticSuccess();
      else void hapticBump();
    } else {
      void hapticWarn();
    }
    setActionMessage(result.message);
    setShowMessage(true);
    setShowProactive(false);
    setTimeout(() => setShowMessage(false), 2500);
  }, [pet]);

  /** Shop / backpack panels report back here — they never persist themselves. */
  const handleEconomyUpdate = useCallback((result: { pet: PetState; message: string }) => {
    const changed = result.pet !== pet;
    if (changed) {
      setPet(result.pet);
      savePet(result.pet);
      setBounceKey(k => k + 1);
      void hapticBump();
    } else {
      void hapticWarn();
    }
    setActionMessage(result.message);
    setShowMessage(true);
    setShowProactive(false);
    setTimeout(() => setShowMessage(false), 2500);
  }, [pet]);

  // ═══════════════ SETUP SCREEN ═══════════════
  if (view === 'setup' || !pet) {
    return (
      <div className="flex flex-col h-dvh">
        <div className="flex-1 overflow-y-auto p-6 pb-nav safe-top">
          <div className="max-w-sm mx-auto space-y-8">
            <div className="text-center space-y-2 pt-6">
              <motion.div
                animate={{ rotate: [0, -6, 6, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block"
              >
                <PetAvatar species={selectedSpecies} stage="egg" mood="happy" size={110} still />
              </motion.div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Vyber si mazlíčka!
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Starej se o něj a poroste s tebou
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {SPECIES_OPTIONS.map(sp => (
                <motion.button key={sp} whileTap={{ scale: 0.95 }}
                  onClick={() => { setSelectedSpecies(sp); void hapticTap(); }}
                  className="p-3 rounded-2xl flex flex-col items-center gap-1 transition-all"
                  style={{
                    border: selectedSpecies === sp ? '2px solid var(--accent)' : '2px solid transparent',
                    background: selectedSpecies === sp ? 'var(--accent-soft)' : 'var(--bg-card)',
                  }}
                >
                  <MiniPet species={sp} stage="child" mood="happy" size={62} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {SPECIES[sp].name}
                  </span>
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
              Adoptovat ❤️
            </motion.button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ═══════════════ MAIN VIEW ═══════════════
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
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
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

      {/* Tab content — extra padding for PetTabBar + BottomNav */}
      <div className="flex-1 overflow-hidden pb-pet-tabs">
        {tab === 'home' && (
          <div className="h-full overflow-y-auto pb-2">
            {/* Pet in its room */}
            <div className="relative mx-4 mt-3 rounded-3xl overflow-hidden"
              style={{ boxShadow: 'var(--shadow-lg)', height: 'min(46vh, 380px)', minHeight: 280 }}
            >
              <PetRoom placed={pet.room.placed} className="h-full">
                <button
                  onClick={() => { setBounceKey(k => k + 1); void hapticTap(); }}
                  aria-label={`Pohladit ${pet.name}`}
                  style={{ background: 'transparent', border: 'none', padding: 0 }}
                >
                  <PetAvatar
                    species={pet.species as PetSpecies}
                    stage={pet.stage}
                    mood={mood}
                    outfit={pet.activeOutfit}
                    evolutionPath={pet.evolutionPath}
                    size={175}
                    bounceKey={bounceKey}
                  />
                </button>
              </PetRoom>

              {/* Mood badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-nav)', backdropFilter: 'blur(8px)' }}>
                <span className="text-xs">{moodEmoji}</span>
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{moodLabel}</span>
              </div>

              {/* Speech bubbles over the scene */}
              <div className="absolute top-3 left-0 right-0 flex justify-center px-6">
                <SpeechBubble message={proactiveMsg} emotion={proactiveEmotion} visible={showProactive && !showMessage} />
                <SpeechBubble message={actionMessage} visible={showMessage} />
              </div>
            </div>

            {/* Level progress */}
            <div className="mx-4 mt-3 p-3 rounded-2xl" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  <Star className="w-3 h-3 inline" /> Level {pet.level}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
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
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {tab === 'chat' && (
          <PetChatPanel pet={pet} petId={petId} messages={chatMessages} setMessages={setChatMessages} />
        )}

        {tab === 'quests' && (
          <QuestsPanel pet={pet} onXpGain={(xp) => {
            setPet(prev => {
              if (!prev) return prev;
              const updated = { ...prev, xp: prev.xp + xp };
              savePet(updated);
              return updated;
            });
          }} />
        )}

        {tab === 'shop' && (
          <div className="h-full overflow-y-auto">
            <ShopPanel pet={pet} onUpdate={handleEconomyUpdate} />
          </div>
        )}

        {tab === 'inventory' && (
          <div className="h-full overflow-y-auto">
            <BackpackPanel pet={pet} onUpdate={handleEconomyUpdate} />
          </div>
        )}

        {tab === 'skills' && (
          <div className="h-full overflow-y-auto">
            <SkillTree skills={pet.skills} evolutionPath={pet.evolutionPath} />
          </div>
        )}
      </div>

      {/* Both are fixed positioned */}
      <PetTabBar active={tab} onChange={(t) => { setTab(t); void hapticTap(); }} />
      <BottomNav />
    </div>
  );
}

// ═══════════════ QUESTS PANEL ═══════════════
function QuestsPanel({ pet, onXpGain }: { pet: PetState; onXpGain: (xp: number) => void }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);

  useEffect(() => {
    setCompleted(getCompletedRoutines());
    setStreak(getRoutineStreak());
  }, []);

  const timeOfDay = getCurrentTimeOfDay();
  const allRoutines = [
    { time: 'morning' as const, label: '🌅 Ráno', routines: getRoutinesByTime('morning') },
    { time: 'afternoon' as const, label: '☀️ Odpoledne', routines: getRoutinesByTime('afternoon') },
    { time: 'evening' as const, label: '🌙 Večer', routines: getRoutinesByTime('evening') },
  ];

  const handleComplete = (routine: RoutineStep) => {
    if (completed.includes(routine.id)) return;
    const updated = completeRoutine(routine.id);
    setCompleted(updated);
    onXpGain(routine.xpReward);
    setCelebrateId(routine.id);
    void hapticSuccess();
    setTimeout(() => setCelebrateId(null), 1500);
    setStreak(getRoutineStreak());
  };

  const totalToday = completed.length;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Streak + progress */}
      <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
        <div className="flex items-center justify-center gap-4">
          <div>
            <p className="text-2xl font-black" style={{ color: 'var(--accent)' }}>{totalToday}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Dnes splněno</p>
          </div>
          {streak > 0 && (
            <div>
              <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>🔥 {streak}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Dní v řadě</p>
            </div>
          )}
        </div>
        {totalToday === 0 && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {pet.name} chce dělat věci s tebou! Klikni na úkol 🐾
          </p>
        )}
      </div>

      {/* Current time section highlighted */}
      {allRoutines.map(section => (
        <div key={section.time}>
          <h3 className="text-xs font-bold mb-2 flex items-center gap-1"
            style={{ color: section.time === timeOfDay ? 'var(--accent)' : 'var(--text-muted)' }}>
            {section.label}
            {section.time === timeOfDay && <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)' }}>teď</span>}
          </h3>
          <div className="space-y-2">
            {section.routines.map(routine => {
              const isDone = completed.includes(routine.id);
              const isCelebrating = celebrateId === routine.id;

              return (
                <motion.button
                  key={routine.id}
                  whileTap={isDone ? {} : { scale: 0.97 }}
                  onClick={() => handleComplete(routine)}
                  disabled={isDone}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
                  style={{
                    background: isDone ? 'var(--accent-soft)' : 'var(--bg-card)',
                    boxShadow: isDone ? 'none' : 'var(--shadow)',
                    opacity: isDone ? 0.7 : 1,
                  }}
                >
                  <motion.span
                    className="text-xl flex-shrink-0"
                    animate={isCelebrating ? { scale: [1, 1.5, 1], rotate: [0, 10, -10, 0] } : {}}
                  >
                    {isDone ? '✅' : routine.emoji}
                  </motion.span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDone ? 'line-through' : ''}`}
                      style={{ color: 'var(--text-primary)' }}>
                      {routine.label}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {isDone ? '🐾 Hotovo!' : routine.petMessage}
                    </p>
                  </div>
                  {!isDone && (
                    <span className="text-[11px] font-bold flex-shrink-0" style={{ color: 'var(--accent)' }}>
                      +{routine.xpReward} XP
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
