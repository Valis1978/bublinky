// Tamagotchi Pet Engine — stats, evolution, persistence

export interface PetState {
  name: string;
  species: string;          // which pet type
  born: string;             // ISO date
  hunger: number;           // 0-100 (100 = full)
  happiness: number;        // 0-100
  energy: number;           // 0-100
  cleanliness: number;      // 0-100
  xp: number;               // total XP earned
  level: number;            // 1-20
  stage: PetStage;          // evolution stage
  lastUpdate: string;       // ISO — for decay calculation
  lastFed: string;
  lastPlayed: string;
  lastSlept: string;
  lastBathed: string;
  isAlive: boolean;
  isSleeping: boolean;
  mood: PetMood;
  accessories: string[];    // unlocked accessories
}

export type PetStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'legendary';
export type PetMood = 'ecstatic' | 'happy' | 'neutral' | 'sad' | 'hungry' | 'tired' | 'dirty' | 'sleeping';

export type PetSpecies = 'cat' | 'dog' | 'bunny' | 'dragon' | 'unicorn' | 'fox';

// Evolution thresholds
const STAGE_LEVELS: Record<PetStage, number> = {
  egg: 0,
  baby: 1,
  child: 3,
  teen: 6,
  adult: 10,
  legendary: 18,
};

// Pet appearances per species and stage
export const PET_SPRITES: Record<PetSpecies, Record<PetStage, string>> = {
  cat:     { egg: '🥚', baby: '🐱', child: '😺', teen: '😸', adult: '🐈', legendary: '🐈‍⬛' },
  dog:     { egg: '🥚', baby: '🐶', child: '🐕', teen: '🦮', adult: '🐕‍🦺', legendary: '🐺' },
  bunny:   { egg: '🥚', baby: '🐰', child: '🐇', teen: '🐇', adult: '🐇', legendary: '✨🐇✨' },
  dragon:  { egg: '🥚', baby: '🐲', child: '🐉', teen: '🔥🐉', adult: '🐉🔥', legendary: '⚡🐉⚡' },
  unicorn: { egg: '🥚', baby: '🦄', child: '🦄', teen: '🌈🦄', adult: '✨🦄✨', legendary: '👑🦄👑' },
  fox:     { egg: '🥚', baby: '🦊', child: '🦊', teen: '🦊', adult: '🦊', legendary: '✨🦊✨' },
};

// Stat decay rates per hour
const DECAY_PER_HOUR = {
  hunger: 3,      // loses 3 hunger/hour → ~33 hours to starve
  happiness: 2,   // loses 2/hour
  energy: 2.5,    // loses 2.5/hour → ~40 hours to exhaust
  cleanliness: 1.5,
};

// Action effects
export const ACTIONS = {
  feed: { hunger: 25, happiness: 5, energy: 0, cleanliness: -5, xp: 5, cooldown: 30 },     // 30min cooldown
  play: { hunger: -10, happiness: 20, energy: -15, cleanliness: -10, xp: 10, cooldown: 20 },
  sleep: { hunger: -5, happiness: 5, energy: 40, cleanliness: 0, xp: 3, cooldown: 60 },
  bathe: { hunger: 0, happiness: -5, energy: -5, cleanliness: 40, xp: 5, cooldown: 45 },
  treat: { hunger: 10, happiness: 15, energy: 5, cleanliness: 0, xp: 8, cooldown: 60 },     // special treat
};

// XP needed per level: level N needs N*50 XP
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

export function calculateMood(pet: PetState): PetMood {
  if (pet.isSleeping) return 'sleeping';
  if (!pet.isAlive) return 'sad';

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
  switch (mood) {
    case 'ecstatic': return '🥰';
    case 'happy': return '😊';
    case 'neutral': return '😐';
    case 'sad': return '😢';
    case 'hungry': return '🍽️';
    case 'tired': return '😴';
    case 'dirty': return '🧼';
    case 'sleeping': return '💤';
  }
}

export function getMoodLabel(mood: PetMood): string {
  switch (mood) {
    case 'ecstatic': return 'Šťastný!';
    case 'happy': return 'Spokojený';
    case 'neutral': return 'V pohodě';
    case 'sad': return 'Smutný';
    case 'hungry': return 'Hladový!';
    case 'tired': return 'Unavený';
    case 'dirty': return 'Špinavý';
    case 'sleeping': return 'Spí...';
  }
}

// Apply time-based decay
export function applyDecay(pet: PetState): PetState {
  const now = Date.now();
  const last = new Date(pet.lastUpdate).getTime();
  const hoursPassed = Math.min((now - last) / (1000 * 60 * 60), 48); // cap at 48h

  if (hoursPassed < 0.05) return pet; // less than 3 minutes, skip

  const updated = { ...pet };

  if (!updated.isSleeping) {
    updated.hunger = Math.max(0, updated.hunger - DECAY_PER_HOUR.hunger * hoursPassed);
    updated.happiness = Math.max(0, updated.happiness - DECAY_PER_HOUR.happiness * hoursPassed);
    updated.energy = Math.max(0, updated.energy - DECAY_PER_HOUR.energy * hoursPassed);
    updated.cleanliness = Math.max(0, updated.cleanliness - DECAY_PER_HOUR.cleanliness * hoursPassed);
  } else {
    // Sleeping: energy recovers, others decay slower
    updated.energy = Math.min(100, updated.energy + 5 * hoursPassed);
    updated.hunger = Math.max(0, updated.hunger - DECAY_PER_HOUR.hunger * 0.5 * hoursPassed);
    updated.cleanliness = Math.max(0, updated.cleanliness - DECAY_PER_HOUR.cleanliness * 0.3 * hoursPassed);

    // Auto wake up after 8 hours
    const sleepHours = (now - new Date(updated.lastSlept).getTime()) / (1000 * 60 * 60);
    if (sleepHours >= 8) {
      updated.isSleeping = false;
    }
  }

  // Pet gets sad if neglected (all stats below 20)
  if (updated.hunger < 20 && updated.happiness < 20 && updated.energy < 20) {
    updated.happiness = Math.max(0, updated.happiness - 5);
  }

  updated.mood = calculateMood(updated);
  updated.lastUpdate = new Date().toISOString();

  return updated;
}

// Perform action
export function performAction(
  pet: PetState,
  action: keyof typeof ACTIONS
): { pet: PetState; message: string; blocked?: boolean } {
  if (!pet.isAlive) return { pet, message: 'Mazlíček potřebuje pomoc...', blocked: true };
  if (pet.isSleeping && action !== 'feed') {
    return { pet, message: 'Pššš... spí! 💤', blocked: true };
  }

  const effect = ACTIONS[action];

  // Check cooldown
  const lastActionTime = action === 'feed' ? pet.lastFed
    : action === 'play' ? pet.lastPlayed
    : action === 'sleep' ? pet.lastSlept
    : action === 'bathe' ? pet.lastBathed
    : pet.lastFed;

  const minutesSince = (Date.now() - new Date(lastActionTime).getTime()) / (1000 * 60);
  if (minutesSince < effect.cooldown) {
    const remaining = Math.ceil(effect.cooldown - minutesSince);
    return { pet, message: `Počkej ještě ${remaining} min ⏳`, blocked: true };
  }

  const updated = { ...pet };

  updated.hunger = Math.min(100, Math.max(0, updated.hunger + effect.hunger));
  updated.happiness = Math.min(100, Math.max(0, updated.happiness + effect.happiness));
  updated.energy = Math.min(100, Math.max(0, updated.energy + effect.energy));
  updated.cleanliness = Math.min(100, Math.max(0, updated.cleanliness + effect.cleanliness));
  updated.xp += effect.xp;

  // Update timestamps
  const now = new Date().toISOString();
  if (action === 'feed') updated.lastFed = now;
  if (action === 'play') updated.lastPlayed = now;
  if (action === 'sleep') { updated.lastSlept = now; updated.isSleeping = true; }
  if (action === 'bathe') updated.lastBathed = now;
  updated.lastUpdate = now;

  // Level up check
  while (updated.xp >= xpForLevel(updated.level + 1)) {
    updated.xp -= xpForLevel(updated.level + 1);
    updated.level++;
  }

  // Evolution check
  const newStage = getStageForLevel(updated.level);
  let message = '';
  if (newStage !== updated.stage) {
    updated.stage = newStage;
    message = `🎉 Evoluce! Tvůj mazlíček je teď ${getStageName(newStage)}!`;
  } else {
    const messages: Record<string, string[]> = {
      feed: ['Mňam! 😋', 'To bylo dobré! 🍕', 'Děkuji za jídlo! ❤️', 'Ještě! 🤤'],
      play: ['Jupí! 🎉', 'To byla zábava! 🎾', 'Ještě! Ještě! 🎪', 'Hihihi! 😄'],
      sleep: ['Dobrou noc... 🌙', 'Zzzz... 💤', '*zívá* 😴', 'Už usínám...'],
      bathe: ['Brrr, studená! 🚿', 'Teď jsem čistý! ✨', 'Bubliny! 🫧', '*otřepe se* 💦'],
      treat: ['Pamlsek! 🍬', 'Ty jsi nejlepší! 💕', 'Miluju tě! 🥰', 'Wow! 🌟'],
    };
    const pool = messages[action] || ['❤️'];
    message = pool[Math.floor(Math.random() * pool.length)];
  }

  updated.mood = calculateMood(updated);

  return { pet: updated, message };
}

export function getStageName(stage: PetStage): string {
  switch (stage) {
    case 'egg': return 'Vajíčko';
    case 'baby': return 'Miminko';
    case 'child': return 'Mládě';
    case 'teen': return 'Puberťák';
    case 'adult': return 'Dospělý';
    case 'legendary': return 'Legendární!';
  }
}

export function createNewPet(species: PetSpecies, name: string): PetState {
  const now = new Date().toISOString();
  return {
    name,
    species,
    born: now,
    hunger: 50,
    happiness: 50,
    energy: 80,
    cleanliness: 90,
    xp: 0,
    level: 0,
    stage: 'egg',
    lastUpdate: now,
    lastFed: now,
    lastPlayed: now,
    lastSlept: now,
    lastBathed: now,
    isAlive: true,
    isSleeping: false,
    mood: 'happy',
    accessories: [],
  };
}

// Get XP progress to next level
export function getLevelProgress(pet: PetState): { current: number; needed: number; percent: number } {
  const needed = xpForLevel(pet.level + 1);
  return {
    current: pet.xp,
    needed,
    percent: Math.min(100, (pet.xp / needed) * 100),
  };
}

// Save/Load from localStorage (later: Supabase)
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
    return JSON.parse(raw) as PetState;
  } catch {
    return null;
  }
}
