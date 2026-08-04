'use client';

// Fashion Show minigame — dress the pet from owned accessories for 3 themes
// in a row, then get judged by 3 MiniPet judges. No timers, no losing state:
// even a bare outfit still earns a friendly scorecard and a few coins.

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { BottomNav } from '@/components/ui/BottomNav';
import { PetAvatar, MiniPet } from '@/components/pet/avatar/PetAvatar';
import { loadPet, calculateMood, type PetState, type PetSpecies } from '@/lib/pet-engine';
import { getOwnedByType } from '@/lib/pet-economy';
import { ITEMS, RARITY_COLORS, type AccessorySlot, type ItemDef } from '@/lib/item-catalog';
import { awardGameCoins, type GameReward } from '@/lib/game-rewards';

// ============================================================
// Data
// ============================================================

interface ThemeDef {
  id: string;
  label: string;
  /** accessory ids that fit this theme best (+3 each when worn) */
  idealIds: string[];
}

const THEME_POOL: ThemeDef[] = [
  { id: 'royal', label: 'Královská párty 👑', idealIds: ['acc_crown', 'acc_medal', 'acc_cape'] },
  { id: 'wizard', label: 'Kouzelnický ples 🧙', idealIds: ['acc_wizard', 'acc_cape', 'acc_wings'] },
  { id: 'sport', label: 'Sportovní den 🏅', idealIds: ['acc_hat', 'acc_medal', 'acc_sunglasses'] },
  { id: 'beach', label: 'Výlet k moři 🕶️', idealIds: ['acc_sunglasses', 'acc_hat', 'acc_bow'] },
  { id: 'winter', label: 'Zimní pohádka 🧣', idealIds: ['acc_scarf', 'acc_hat', 'acc_bow'] },
  { id: 'fairy', label: 'Vílí louka 🧚', idealIds: ['acc_wings', 'acc_flower', 'acc_crown'] },
];

const ROUND_LENGTH = 3;

// Judges are always this trio — unless one matches Viki's own pet species,
// in which case that slot swaps to the fallback so no judge mirrors her pet.
const JUDGE_DEFAULT: PetSpecies[] = ['cat', 'dragon', 'bunny'];
const JUDGE_FALLBACK: PetSpecies[] = ['fox', 'unicorn', 'dog'];

const JUDGE_COMMENTS = [
  'Wow, to je paráda! ✨',
  'Tohle je hotová hvězda mola! 🌟',
  'Ty barvy k sobě sedí skvěle! 🎨',
  'Hihi, to je roztomilé! 🥰',
  'Tenhle styl bych nosil/a taky! 😄',
  'Máš oko pro módu! 👀',
  'To vypadá jako z pohádky! 📖',
  'Originalita na jedničku! 💡',
  'Klobouk dolů, tohle sedí! 🎩',
  'Ten pohyb na molu byl famózní! 💃',
  'Tleskal/a bych i vestoje! 👏',
  'Přesně takhle se dělá móda! 😎',
];

const SLOT_ORDER: AccessorySlot[] = ['head', 'face', 'neck', 'back'];
const SLOT_LABELS: Record<AccessorySlot, string> = {
  head: 'Hlava', face: 'Obličej', neck: 'Krk', back: 'Záda',
};

type SlotItem = ItemDef & { slot: AccessorySlot };
type OwnedSlotItem = { item: SlotItem; count: number };

interface JudgeCard {
  species: PetSpecies;
  score: number;
  comment: string;
}

type Phase = 'dressing' | 'runway' | 'final';

// ============================================================
// Pure helpers
// ============================================================

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickJudges(petSpecies: PetSpecies): PetSpecies[] {
  return JUDGE_DEFAULT.map((s, i) => (s === petSpecies ? JUDGE_FALLBACK[i] : s));
}

function wornIdsOf(outfit: Partial<Record<AccessorySlot, string>>): string[] {
  return SLOT_ORDER.map(slot => outfit[slot]).filter((v): v is string => Boolean(v));
}

/** +3 per on-theme item, +1 per other worn item, +2 flat if any worn item is rare/epic. */
function scoreOutfit(theme: ThemeDef, wornIds: string[]): number {
  if (wornIds.length === 0) return 0;
  let score = 0;
  let hasRareBonus = false;
  for (const id of wornIds) {
    score += theme.idealIds.includes(id) ? 3 : 1;
    const item = ITEMS[id];
    if (item && (item.rarity === 'rare' || item.rarity === 'epic')) hasRareBonus = true;
  }
  return hasRareBonus ? score + 2 : score;
}

/** Judge's scorecard number — friendly 6..10 range, never crushing. */
function judgeScoreCard(themeScore: number): number {
  const base = 7 + Math.min(3, themeScore / 4);
  const jitter = Math.round(Math.random() * 2) - 1; // -1..1
  return Math.max(6, Math.min(10, Math.round(base + jitter)));
}

function finalTitle(total: number): string {
  if (total >= 27) return 'Módní hvězda!';
  if (total >= 15) return 'Stylová kočka!';
  return 'Krásná přehlídka!';
}

// ============================================================
// Small presentational pieces
// ============================================================

function AccessoryChip({
  item, equipped, onToggle,
}: {
  item: SlotItem;
  equipped: boolean;
  onToggle: () => void;
}) {
  const rarityColor = RARITY_COLORS[item.rarity];
  const borderColor = equipped ? 'var(--accent)' : `${rarityColor}55`;
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onToggle}
      className="flex flex-col items-center justify-center gap-1 rounded-2xl flex-shrink-0"
      style={{
        width: 68,
        minHeight: 66,
        padding: '8px 6px',
        background: equipped ? 'var(--accent-soft)' : 'var(--bg-card)',
        boxShadow: 'var(--shadow)',
        border: `2px solid ${borderColor}`,
      }}
    >
      <span className="text-2xl leading-none">{item.emoji}</span>
      <span className="text-[9px] font-medium text-center leading-tight" style={{ color: 'var(--text-primary)' }}>
        {item.name}
      </span>
    </motion.button>
  );
}

const CONFETTI_DOTS = [
  { left: '8%', color: 'var(--accent)' },
  { left: '20%', color: 'var(--mint)' },
  { left: '32%', color: 'var(--lavender)' },
  { left: '44%', color: 'var(--coral)' },
  { left: '56%', color: 'var(--accent)' },
  { left: '68%', color: 'var(--mint)' },
  { left: '80%', color: 'var(--lavender)' },
  { left: '92%', color: 'var(--coral)' },
];

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
      {CONFETTI_DOTS.map((dot, i) => (
        <motion.span
          key={dot.left}
          className="absolute rounded-full"
          style={{ left: dot.left, top: '-4%', width: 10, height: 10, background: dot.color }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: [1, 1, 0], rotate: 200 }}
          transition={{ duration: 1.7 + (i % 3) * 0.2, delay: i * 0.06, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function PrehlidkaPage() {
  const [ready, setReady] = useState(false);
  const [pet, setPet] = useState<PetState | null>(null);

  const [themes, setThemes] = useState<ThemeDef[]>(() => shuffle(THEME_POOL).slice(0, ROUND_LENGTH));
  const [themeIdx, setThemeIdx] = useState(0);
  const [outfit, setOutfit] = useState<Partial<Record<AccessorySlot, string>>>({});
  const [phase, setPhase] = useState<Phase>('dressing');
  const [judgeCards, setJudgeCards] = useState<JudgeCard[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [bounceKey, setBounceKey] = useState(0);
  const [reward, setReward] = useState<GameReward | null>(null);

  // Pet is client-only (localStorage) — resolve after mount, matches app convention.
  useEffect(() => {
    setPet(loadPet());
    setReady(true);
  }, []);

  const ownedAccessories = useMemo<OwnedSlotItem[]>(() => {
    if (!pet) return [];
    return getOwnedByType(pet, 'accessory').filter(
      (e): e is OwnedSlotItem => Boolean(e.item.slot)
    );
  }, [pet]);

  const bySlot = useMemo(() => {
    const map: Partial<Record<AccessorySlot, SlotItem[]>> = {};
    for (const { item } of ownedAccessories) {
      const list = map[item.slot] ?? [];
      list.push(item);
      map[item.slot] = list;
    }
    return map;
  }, [ownedAccessories]);

  const total = useMemo(() => scores.reduce((a, b) => a + b, 0), [scores]);
  const currentTheme = themes[themeIdx];

  const toggleItem = useCallback((item: SlotItem) => {
    setOutfit(prev => {
      const next = { ...prev };
      if (next[item.slot] === item.id) delete next[item.slot];
      else next[item.slot] = item.id;
      return next;
    });
    setBounceKey(k => k + 1);
  }, []);

  const handleWalk = useCallback(() => {
    if (!pet || !currentTheme) return;
    const wornIds = wornIdsOf(outfit);
    const themeScore = scoreOutfit(currentTheme, wornIds);
    const judges = pickJudges(pet.species as PetSpecies);
    const comments = shuffle(JUDGE_COMMENTS).slice(0, 3);
    setJudgeCards(judges.map((species, i) => ({
      species, score: judgeScoreCard(themeScore), comment: comments[i],
    })));
    setScores(prev => [...prev, themeScore]);
    setBounceKey(k => k + 1);
    setPhase('runway');
  }, [pet, outfit, currentTheme]);

  const handleContinue = useCallback(() => {
    if (themeIdx + 1 < themes.length) {
      setThemeIdx(i => i + 1);
      setOutfit({});
      setPhase('dressing');
    } else {
      const finalTotal = scores.reduce((a, b) => a + b, 0);
      const celkove01 = Math.min(1, (finalTotal - 18) / 12);
      setReward(awardGameCoins('prehlidka', celkove01));
      setPhase('final');
    }
  }, [themeIdx, themes.length, scores]);

  const restart = useCallback(() => {
    setThemes(shuffle(THEME_POOL).slice(0, ROUND_LENGTH));
    setThemeIdx(0);
    setOutfit({});
    setScores([]);
    setJudgeCards([]);
    setReward(null);
    setPhase('dressing');
  }, []);

  const hasWardrobe = ownedAccessories.length > 0;
  const showGame = ready && pet !== null && hasWardrobe;

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto px-4 pb-nav safe-top">
        <div className="flex items-center gap-3 mb-3 pt-1">
          <Link href="/games" className="p-2 -ml-2" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Módní přehlídka 👗
          </h1>
        </div>

        {showGame && phase !== 'final' && (
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {themes.map((t, i) => (
              <span
                key={t.id}
                className="rounded-full transition-all"
                style={{
                  width: i === themeIdx ? 20 : 7,
                  height: 7,
                  background: i <= themeIdx ? 'var(--accent)' : 'var(--border)',
                }}
              />
            ))}
          </div>
        )}

        {ready && (!pet || !hasWardrobe) && (
          <div className="flex flex-col items-center justify-center text-center gap-3 mt-16">
            <span className="text-5xl">🎀</span>
            <p className="text-sm font-medium max-w-[220px]" style={{ color: 'var(--text-primary)' }}>
              Nejdřív nakup oblečky v obchůdku! 🎀
            </p>
            <Link href="/pet" className="accent-button px-6 py-2.5 text-sm inline-block mt-1">
              Do obchůdku
            </Link>
          </div>
        )}

        {showGame && pet && currentTheme && phase === 'dressing' && (
          <div className="flex flex-col items-center">
            <motion.div
              key={currentTheme.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-2"
            >
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {currentTheme.label}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Obleč mazlíčka na téma!
              </p>
            </motion.div>

            <PetAvatar
              species={pet.species as PetSpecies}
              stage={pet.stage}
              mood={calculateMood(pet)}
              outfit={outfit}
              evolutionPath={pet.evolutionPath}
              size={190}
              bounceKey={bounceKey}
            />

            <div className="w-full max-w-sm space-y-3 mt-4">
              {SLOT_ORDER.filter(slot => (bySlot[slot]?.length ?? 0) > 0).map(slot => (
                <div key={slot}>
                  <p className="text-[11px] font-bold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {SLOT_LABELS[slot]}
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ touchAction: 'pan-x' }}>
                    {(bySlot[slot] ?? []).map(item => (
                      <AccessoryChip
                        key={item.id}
                        item={item}
                        equipped={outfit[slot] === item.id}
                        onToggle={() => toggleItem(item)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleWalk}
              className="accent-button px-8 py-3 text-sm mt-6 mb-2 inline-flex items-center gap-2"
            >
              <Sparkles size={16} />
              Na molo! ✨
            </motion.button>
          </div>
        )}

        {showGame && pet && currentTheme && phase === 'runway' && (
          <div className="flex flex-col items-center">
            <p className="text-lg font-bold mb-1 text-center" style={{ color: 'var(--text-primary)' }}>
              {currentTheme.label}
            </p>
            <PetAvatar
              species={pet.species as PetSpecies}
              stage={pet.stage}
              mood={calculateMood(pet)}
              outfit={outfit}
              evolutionPath={pet.evolutionPath}
              size={140}
              bounceKey={bounceKey}
            />
            <p className="text-sm font-medium mt-1 mb-4" style={{ color: 'var(--accent)' }}>
              ✨ Přehlídka na molu! ✨
            </p>

            <div className="w-full max-w-sm space-y-3">
              {judgeCards.map((jc, i) => (
                <motion.div
                  key={jc.species}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.3, type: 'spring', stiffness: 300, damping: 24 }}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
                >
                  <MiniPet species={jc.species} stage="adult" mood="happy" size={44} />
                  <p className="flex-1 text-xs" style={{ color: 'var(--text-primary)' }}>{jc.comment}</p>
                  <div
                    className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ width: 38, height: 38, background: 'var(--accent-soft)' }}
                  >
                    <span className="text-base font-extrabold" style={{ color: 'var(--accent)' }}>{jc.score}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleContinue}
              className="accent-button px-8 py-3 text-sm mt-6 mb-2 inline-flex items-center gap-2"
            >
              {themeIdx + 1 < themes.length ? 'Další téma ✨' : 'Vyhodnocení 🎉'}
            </motion.button>
          </div>
        )}

        {showGame && phase === 'final' && (
          <>
            <Confetti />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center gap-2 py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="text-6xl mb-1"
              >
                🏆
              </motion.div>
              <div className="flex items-center gap-1.5">
                <Trophy size={18} style={{ color: 'var(--accent)' }} />
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {finalTitle(total)}
                </h2>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Body z mola: {total}
              </p>
              {reward?.rewarded && (
                <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>
                  🪙 +{reward.coins} mincí
                </p>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={restart} className="accent-button px-6 py-2.5 text-sm inline-flex items-center gap-2">
                  <RotateCcw size={14} />
                  Ještě jednou
                </button>
                <Link
                  href="/games"
                  className="px-6 py-2.5 text-sm font-medium rounded-full"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}
                >
                  Zpět
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
