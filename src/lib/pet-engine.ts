// Tamagotchi Pet Engine V2 — RPG companion with skills, quests, evolution paths

// ============================================================
// Types
// ============================================================

export interface SkillBranch {
  strength: number;   // 0-100, physical activities
  wisdom: number;     // 0-100, learning/quizzes
  charisma: number;   // 0-100, social/chat interactions
  creativity: number; // 0-100, drawing/creative games
  nature: number;     // 0-100, garden/food/nature activities
}

export type EvolutionPath = 'athletic' | 'scholar' | 'artist' | 'healer' | 'trickster';

export interface PetState {
  name: string;
  species: string;
  born: string;

  // Core stats (0-100)
  hunger: number;
  happiness: number;
  energy: number;
  cleanliness: number;

  // RPG progression
  xp: number;
  level: number;
  stage: PetStage;
  coins: number;
  skills: SkillBranch;
  evolutionPath: EvolutionPath | null;

  // Timestamps
  lastUpdate: string;
  lastFed: string;
  lastPlayed: string;
  lastSlept: string;
  lastBathed: string;
  lastTreated: string;
  lastChatted: string;

  // State
  isAlive: boolean; // deprecated — kept for compat, always true
  isSleeping: boolean;
  isOnVacation: boolean;
  vacationReturn: string | null;
  mood: PetMood;

  // Appearance
  accessories: string[];
  activeOutfit: Record<string, string>;

  // Personality (0-1 scale, evolves over time)
  personalityTraits: Record<string, number>;

  // Food Journey
  foodBravery: number;
  foodsTried: string[];
  favoriteFoods: string[];

  // English Learning
  englishLevel: number; // 0-100 (0=unknown, 10=beginner, 50=intermediate, 100=advanced)
  englishWordsLearned: string[]; // words/phrases Viki demonstrated knowledge of
}

export type PetStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'legendary';
export type PetMood = 'ecstatic' | 'happy' | 'neutral' | 'sad' | 'hungry' | 'tired' | 'dirty' | 'sleeping' | 'vacation';

export type PetSpecies = 'cat' | 'dog' | 'bunny' | 'dragon' | 'unicorn' | 'fox';

// ============================================================
// Constants
// ============================================================

const STAGE_LEVELS: Record<PetStage, number> = {
  egg: 0, baby: 1, child: 3, teen: 6, adult: 10, legendary: 18,
};

export const PET_SPRITES: Record<PetSpecies, Record<PetStage, string>> = {
  cat:     { egg: '🥚', baby: '🐱', child: '😺', teen: '😸', adult: '🐈', legendary: '🐈‍⬛' },
  dog:     { egg: '🥚', baby: '🐶', child: '🐕', teen: '🦮', adult: '🐕‍🦺', legendary: '🐺' },
  bunny:   { egg: '🥚', baby: '🐰', child: '🐇', teen: '🐇', adult: '🐇', legendary: '✨🐇✨' },
  dragon:  { egg: '🥚', baby: '🐲', child: '🐉', teen: '🔥🐉', adult: '🐉🔥', legendary: '⚡🐉⚡' },
  unicorn: { egg: '🥚', baby: '🦄', child: '🦄', teen: '🌈🦄', adult: '✨🦄✨', legendary: '👑🦄👑' },
  fox:     { egg: '🥚', baby: '🦊', child: '🦊', teen: '🦊', adult: '🦊', legendary: '✨🦊✨' },
};

// Evolution path sprites (override for adult/legendary when path is set)
export const EVOLUTION_SPRITES: Record<EvolutionPath, { adult: string; legendary: string; label: string; emoji: string }> = {
  athletic:  { adult: '💪', legendary: '🏆', label: 'Atlet', emoji: '⚡' },
  scholar:   { adult: '🎓', legendary: '🧙', label: 'Učenec', emoji: '📚' },
  artist:    { adult: '🎨', legendary: '🌟', label: 'Umělec', emoji: '🎭' },
  healer:    { adult: '🌿', legendary: '🌸', label: 'Léčitel', emoji: '💚' },
  trickster: { adult: '🎪', legendary: '🃏', label: 'Šprýmař', emoji: '😜' },
};

const DECAY_PER_HOUR = {
  hunger: 3,
  happiness: 2,
  energy: 2.5,
  cleanliness: 1.5,
};

export const ACTIONS = {
  feed:  { hunger: 25, happiness: 5, energy: 0, cleanliness: -5, xp: 5, cooldown: 30, skill: 'nature' as keyof SkillBranch, skillXp: 1 },
  play:  { hunger: -10, happiness: 20, energy: -15, cleanliness: -10, xp: 10, cooldown: 20, skill: 'strength' as keyof SkillBranch, skillXp: 2 },
  sleep: { hunger: -5, happiness: 5, energy: 40, cleanliness: 0, xp: 3, cooldown: 60, skill: null, skillXp: 0 },
  bathe: { hunger: 0, happiness: -5, energy: -5, cleanliness: 40, xp: 5, cooldown: 45, skill: null, skillXp: 0 },
  treat: { hunger: 10, happiness: 15, energy: 5, cleanliness: 0, xp: 8, cooldown: 60, skill: 'charisma' as keyof SkillBranch, skillXp: 1 },
  chat:  { hunger: 0, happiness: 10, energy: -3, cleanliness: 0, xp: 5, cooldown: 5, skill: 'charisma' as keyof SkillBranch, skillXp: 2 },
  wake:  { hunger: 0, happiness: 5, energy: -10, cleanliness: 0, xp: 2, cooldown: 10, skill: null, skillXp: 0 },
};

const DEFAULT_PERSONALITY: Record<string, number> = {
  brave: 0.5, curious: 0.5, playful: 0.5, gentle: 0.5, silly: 0.5,
};

const DEFAULT_SKILLS: SkillBranch = {
  strength: 0, wisdom: 0, charisma: 0, creativity: 0, nature: 0,
};

// ============================================================
// Core Functions
// ============================================================

function xpForLevel(level: number): number {
  return level * 50;
}

export function getStageForLevel(level: number): PetStage {
  if (level >= 18) return 'legendary';
  if (level >= 10) return 'adult';
  if (level >= 6) return 'teen';
  if (level >= 3) return 'child';
  if (level >= 1) return 'baby';
  return 'egg';
}

/** Determine evolution path based on dominant skill branch */
export function determineEvolutionPath(skills: SkillBranch): EvolutionPath | null {
  const entries = Object.entries(skills) as [keyof SkillBranch, number][];
  const max = entries.reduce((a, b) => b[1] > a[1] ? b : a);
  if (max[1] < 10) return null; // not enough skill points yet

  const map: Record<keyof SkillBranch, EvolutionPath> = {
    strength: 'athletic', wisdom: 'scholar', charisma: 'trickster',
    creativity: 'artist', nature: 'healer',
  };
  return map[max[0]];
}

export function calculateMood(pet: PetState): PetMood {
  if (pet.isOnVacation) return 'vacation';
  if (pet.isSleeping) return 'sleeping';

  const avg = (pet.hunger + pet.happiness + pet.energy + pet.cleanliness) / 4;

  if (pet.hunger < 15) return 'hungry';
  if (pet.energy < 15) return 'tired';
  if (pet.cleanliness < 15) return 'dirty';
  if (avg >= 80) return 'ecstatic';
  if (avg >= 60) return 'happy';
  if (avg >= 35) return 'neutral';
  return 'sad';
}

export function getMoodEmoji(mood: PetMood): string {
  const map: Record<PetMood, string> = {
    ecstatic: '🥰', happy: '😊', neutral: '😐', sad: '😢',
    hungry: '🍽️', tired: '😴', dirty: '🧼', sleeping: '💤', vacation: '🏖️',
  };
  return map[mood];
}

export function getMoodLabel(mood: PetMood): string {
  const map: Record<PetMood, string> = {
    ecstatic: 'Šťastný!', happy: 'Spokojený', neutral: 'V pohodě', sad: 'Smutný',
    hungry: 'Hladový!', tired: 'Unavený', dirty: 'Špinavý', sleeping: 'Spí...', vacation: 'Na výletě!',
  };
  return map[mood];
}

// ============================================================
// Decay + Vacation System (ethical: pet never dies)
// ============================================================

export function applyDecay(pet: PetState): PetState {
  // Pet on vacation — check if it's time to return
  if (pet.isOnVacation) {
    if (pet.vacationReturn && new Date(pet.vacationReturn).getTime() <= Date.now()) {
      return {
        ...pet,
        isOnVacation: false,
        vacationReturn: null,
        hunger: 70,
        happiness: 80,
        energy: 90,
        cleanliness: 85,
        mood: 'happy',
        lastUpdate: new Date().toISOString(),
      };
    }
    return pet; // still on vacation
  }

  const now = Date.now();
  const last = new Date(pet.lastUpdate).getTime();
  if (isNaN(last)) return pet; // corrupted timestamp — skip decay
  const hoursPassed = Math.min((now - last) / (1000 * 60 * 60), 48);

  if (hoursPassed < 0.05 || isNaN(hoursPassed)) return pet; // less than 3 minutes or invalid

  const updated = { ...pet, skills: { ...pet.skills }, personalityTraits: { ...pet.personalityTraits } };

  if (!updated.isSleeping) {
    updated.hunger = Math.max(0, updated.hunger - DECAY_PER_HOUR.hunger * hoursPassed);
    updated.happiness = Math.max(0, updated.happiness - DECAY_PER_HOUR.happiness * hoursPassed);
    updated.energy = Math.max(0, updated.energy - DECAY_PER_HOUR.energy * hoursPassed);
    updated.cleanliness = Math.max(0, updated.cleanliness - DECAY_PER_HOUR.cleanliness * hoursPassed);
  } else {
    updated.energy = Math.min(100, updated.energy + 5 * hoursPassed);
    updated.hunger = Math.max(0, updated.hunger - DECAY_PER_HOUR.hunger * 0.5 * hoursPassed);
    updated.cleanliness = Math.max(0, updated.cleanliness - DECAY_PER_HOUR.cleanliness * 0.3 * hoursPassed);

    const sleepHours = (now - new Date(updated.lastSlept).getTime()) / (1000 * 60 * 60);
    if (sleepHours >= 8) {
      updated.isSleeping = false;
    }
  }

  // Vacation trigger: all stats below 10 for extended neglect
  // Pet goes "on a trip" instead of dying — returns with full stats
  if (updated.hunger < 10 && updated.happiness < 10 && updated.energy < 10 && updated.cleanliness < 10) {
    updated.isOnVacation = true;
    updated.vacationReturn = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // returns in 4 hours
    updated.mood = 'vacation';
    updated.lastUpdate = new Date().toISOString();
    return updated;
  }

  updated.mood = calculateMood(updated);
  updated.lastUpdate = new Date().toISOString();

  return updated;
}

// ============================================================
// Actions
// ============================================================

export function performAction(
  pet: PetState,
  action: keyof typeof ACTIONS
): { pet: PetState; message: string; blocked?: boolean } {
  if (pet.isOnVacation) {
    return { pet, message: `${pet.name} je na výletě! Vrátí se brzy! 🏖️`, blocked: true };
  }
  if (pet.isSleeping && action !== 'feed' && action !== 'wake') {
    return { pet, message: 'Pššš... spí! 💤', blocked: true };
  }

  const effect = ACTIONS[action];

  // Check cooldown — each action has its own timestamp
  const lastActionMap: Record<string, string> = {
    feed: pet.lastFed,
    play: pet.lastPlayed,
    sleep: pet.lastSlept,
    bathe: pet.lastBathed,
    treat: pet.lastTreated || pet.lastFed, // fallback for V1 compat
    chat: pet.lastChatted || pet.born,     // fallback: never chatted
    wake: pet.lastSlept,
  };
  const lastActionTime = lastActionMap[action] || pet.lastUpdate;

  const minutesSince = (Date.now() - new Date(lastActionTime).getTime()) / (1000 * 60);
  if (minutesSince < effect.cooldown) {
    const remaining = Math.ceil(effect.cooldown - minutesSince);
    return { pet, message: `Počkej ještě ${remaining} min ⏳`, blocked: true };
  }

  const updated: PetState = {
    ...pet,
    skills: { ...pet.skills },
    personalityTraits: { ...pet.personalityTraits },
  };

  // Apply stat effects
  updated.hunger = Math.min(100, Math.max(0, updated.hunger + effect.hunger));
  updated.happiness = Math.min(100, Math.max(0, updated.happiness + effect.happiness));
  updated.energy = Math.min(100, Math.max(0, updated.energy + effect.energy));
  updated.cleanliness = Math.min(100, Math.max(0, updated.cleanliness + effect.cleanliness));
  updated.xp += effect.xp;

  // Apply skill XP
  if (effect.skill && effect.skillXp > 0) {
    updated.skills[effect.skill] = Math.min(100, updated.skills[effect.skill] + effect.skillXp);
  }

  // Update timestamps
  const now = new Date().toISOString();
  if (action === 'feed') updated.lastFed = now;
  if (action === 'play') updated.lastPlayed = now;
  if (action === 'sleep') { updated.lastSlept = now; updated.isSleeping = true; }
  if (action === 'bathe') updated.lastBathed = now;
  if (action === 'treat') updated.lastTreated = now;
  if (action === 'chat') updated.lastChatted = now;
  if (action === 'wake') { updated.isSleeping = false; }
  updated.lastUpdate = now;

  // Earn coins from actions (small amounts to keep economy flowing)
  const coinRewards: Record<string, number> = { feed: 1, play: 2, bathe: 1, treat: 0, chat: 1, wake: 0, sleep: 0 };
  updated.coins += coinRewards[action] || 0;

  // Level up check
  while (updated.xp >= xpForLevel(updated.level + 1)) {
    updated.xp -= xpForLevel(updated.level + 1);
    updated.level++;
  }

  // Evolution check
  const newStage = getStageForLevel(updated.level);
  let message = '';

  // Update evolution path when reaching adult stage
  if (updated.level >= 10 && !updated.evolutionPath) {
    updated.evolutionPath = determineEvolutionPath(updated.skills);
  }

  if (newStage !== updated.stage) {
    updated.stage = newStage;
    const pathInfo = updated.evolutionPath ? EVOLUTION_SPRITES[updated.evolutionPath] : null;
    message = pathInfo && (newStage === 'adult' || newStage === 'legendary')
      ? `🎉 Evoluce! ${pet.name} je teď ${pathInfo.label}! ${pathInfo.emoji}`
      : `🎉 Evoluce! ${pet.name} je teď ${getStageName(newStage)}!`;
  } else {
    const messages: Record<string, string[]> = {
      feed: ['Mňam! 😋', 'To bylo dobré! 🍕', 'Děkuji za jídlo! ❤️', 'Ještě! 🤤', 'Ňam ňam! 🥰'],
      play: ['Jupí! 🎉', 'To byla zábava! 🎾', 'Ještě! Ještě! 🎪', 'Hihihi! 😄', 'Hráli jsme si! ⭐'],
      sleep: ['Dobrou noc... 🌙', 'Zzzz... 💤', '*zívá* 😴', 'Už usínám...'],
      bathe: ['Brrr, studená! 🚿', 'Teď jsem čistý! ✨', 'Bubliny! 🫧', '*otřepe se* 💦'],
      treat: ['Pamlsek! 🍬', 'Ty jsi nejlepší! 💕', 'Miluju tě! 🥰', 'Wow! 🌟'],
      chat: ['Rád/a si povídám! 💬', 'To je zajímavé! 🤔', 'Díky za pokec! ❤️', 'Povídej dál! 😊'],
      wake: ['*zívá* Dobré ráno! ☀️', 'Už jsem vzhůru! 🌅', '*protahuje se* Ahoj! 🤗'],
    };
    const pool = messages[action] || ['❤️'];
    message = pool[Math.floor(Math.random() * pool.length)];
  }

  updated.mood = calculateMood(updated);

  return { pet: updated, message };
}

// ============================================================
// Helpers
// ============================================================

export function getStageName(stage: PetStage): string {
  const names: Record<PetStage, string> = {
    egg: 'Vajíčko', baby: 'Miminko', child: 'Mládě',
    teen: 'Puberťák', adult: 'Dospělý', legendary: 'Legendární!',
  };
  return names[stage];
}

export function createNewPet(species: PetSpecies, name: string): PetState {
  const now = new Date().toISOString();
  return {
    name, species, born: now,
    hunger: 50, happiness: 50, energy: 80, cleanliness: 90,
    xp: 0, level: 0, stage: 'egg', coins: 50,
    skills: { ...DEFAULT_SKILLS },
    evolutionPath: null,
    lastUpdate: now, lastFed: now, lastPlayed: now, lastSlept: now, lastBathed: now, lastTreated: now, lastChatted: now,
    isAlive: true, isSleeping: false,
    isOnVacation: false, vacationReturn: null,
    mood: 'happy',
    accessories: [],
    activeOutfit: {},
    personalityTraits: { ...DEFAULT_PERSONALITY },
    foodBravery: 0, foodsTried: [], favoriteFoods: [],
    englishLevel: 0, englishWordsLearned: [],
  };
}

export function getLevelProgress(pet: PetState): { current: number; needed: number; percent: number } {
  const needed = xpForLevel(pet.level + 1);
  return { current: pet.xp, needed, percent: Math.min(100, (pet.xp / needed) * 100) };
}

/** Get dominant skill name in Czech */
export function getDominantSkill(skills: SkillBranch): { key: keyof SkillBranch; name: string; value: number } | null {
  const entries = Object.entries(skills) as [keyof SkillBranch, number][];
  const max = entries.reduce((a, b) => b[1] > a[1] ? b : a);
  if (max[1] === 0) return null;
  const names: Record<keyof SkillBranch, string> = {
    strength: 'Síla', wisdom: 'Moudrost', charisma: 'Charisma',
    creativity: 'Kreativita', nature: 'Příroda',
  };
  return { key: max[0], name: names[max[0]], value: max[1] };
}

// ============================================================
// Persistence (localStorage — Supabase sync added via usePetSync hook)
// ============================================================

const PET_KEY = 'bub_pet';

export function savePet(pet: PetState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PET_KEY, JSON.stringify(pet));
  }
}

export function loadPet(): PetState | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PET_KEY);
  if (!raw) return null;
  try {
    const pet = JSON.parse(raw) as PetState;
    // Migrate V1 → V2 (add missing fields)
    return migratePetState(pet);
  } catch {
    return null;
  }
}

/** Migrate V1 pet state to V2 (backward compatible) */
function migratePetState(pet: PetState): PetState {
  const now = new Date().toISOString();
  return {
    ...pet,
    coins: pet.coins ?? 50,
    // Merge skills: fill missing branches with 0 (fixes NaN bug)
    skills: { ...DEFAULT_SKILLS, ...(pet.skills ?? {}) },
    evolutionPath: pet.evolutionPath ?? null,
    isOnVacation: pet.isOnVacation ?? false,
    vacationReturn: pet.vacationReturn ?? null,
    activeOutfit: pet.activeOutfit ?? {},
    personalityTraits: { ...DEFAULT_PERSONALITY, ...(pet.personalityTraits ?? {}) },
    foodBravery: pet.foodBravery ?? 0,
    foodsTried: pet.foodsTried ?? [],
    favoriteFoods: pet.favoriteFoods ?? [],
    isAlive: true,
    englishLevel: pet.englishLevel ?? 0,
    englishWordsLearned: pet.englishWordsLearned ?? [],
    lastTreated: pet.lastTreated ?? pet.lastFed ?? now,
    lastChatted: pet.lastChatted ?? pet.born ?? now,
    // Validate timestamps — protect against NaN from corrupted localStorage
    lastUpdate: isValidDate(pet.lastUpdate) ? pet.lastUpdate : now,
    lastFed: isValidDate(pet.lastFed) ? pet.lastFed : now,
    lastPlayed: isValidDate(pet.lastPlayed) ? pet.lastPlayed : now,
    lastSlept: isValidDate(pet.lastSlept) ? pet.lastSlept : now,
    lastBathed: isValidDate(pet.lastBathed) ? pet.lastBathed : now,
  };
}

function isValidDate(s: string | undefined | null): boolean {
  if (!s) return false;
  const t = new Date(s).getTime();
  return !isNaN(t) && t > 0;
}
