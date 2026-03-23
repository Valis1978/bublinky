// Gamification engine — XP, levels, streaks, achievements

// Level thresholds (logarithmic curve)
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  50,     // Level 2
  150,    // Level 3
  300,    // Level 4
  500,    // Level 5
  750,    // Level 6
  1100,   // Level 7
  1500,   // Level 8
  2000,   // Level 9
  2700,   // Level 10
  3500,   // Level 11
  4500,   // Level 12
  5800,   // Level 13
  7500,   // Level 14
  10000,  // Level 15
];

export const LEVEL_NAMES = [
  'Začátečník',      // 1
  'Objevitel',       // 2
  'Učedník',         // 3
  'Průzkumník',      // 4
  'Znalec',          // 5
  'Šampion',         // 6
  'Expert',          // 7
  'Mistr',           // 8
  'Velmistr',        // 9
  'Legenda',         // 10
  'Génius',          // 11
  'Superhrdina',     // 12
  'Hvězda',          // 13
  'Diamant',         // 14
  'Bohyně vědomostí', // 15
];

export const LEVEL_EMOJIS = [
  '🌱', '🌿', '🌻', '🌸', '⭐', '🏆', '💎', '👑', '🔮', '🌟',
  '🧠', '🦸', '✨', '💠', '🌈',
];

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXPForNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const level = getLevelFromXP(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

  const current = xp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  const progress = Math.min(current / needed, 1);

  return { current, needed, progress };
}

export function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
}

export function getLevelEmoji(level: number): string {
  return LEVEL_EMOJIS[Math.min(level - 1, LEVEL_EMOJIS.length - 1)];
}

// XP rewards
export const XP_REWARDS = {
  CORRECT_ANSWER: 10,
  STREAK_BONUS: 5,        // per day of streak
  PERFECT_SESSION: 20,    // bonus for 100% score
  DAILY_CHALLENGE: 30,    // completing daily challenge
  FIRST_SESSION: 50,      // first ever session
  GAME_WIN: 15,           // winning a game
} as const;

// Streak calculation
export function calculateStreak(lastActivityDate: string | null, currentStreak: number): {
  newStreak: number;
  streakBroken: boolean;
  isNewDay: boolean;
} {
  if (!lastActivityDate) {
    return { newStreak: 1, streakBroken: false, isNewDay: true };
  }

  const last = new Date(lastActivityDate);
  const now = new Date();

  // Normalize to date only (Prague timezone)
  const lastDay = new Date(last.toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' }));
  const today = new Date(now.toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' }));

  const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Same day — no change
    return { newStreak: currentStreak, streakBroken: false, isNewDay: false };
  }
  if (diffDays === 1) {
    // Consecutive day — extend streak
    return { newStreak: currentStreak + 1, streakBroken: false, isNewDay: true };
  }
  // Streak broken
  return { newStreak: 1, streakBroken: true, isNewDay: true };
}

// Achievement definitions
export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: { type: string; value: number };
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_msg', name: 'První zpráva', description: 'Pošli první zprávu', emoji: '💬', condition: { type: 'messages_sent', value: 1 } },
  { id: 'chatty', name: 'Povídálka', description: 'Pošli 50 zpráv', emoji: '🗣️', condition: { type: 'messages_sent', value: 50 } },
  { id: 'first_learn', name: 'Začínáme', description: 'Dokonči první cvičení', emoji: '📖', condition: { type: 'sessions_completed', value: 1 } },
  { id: 'bookworm', name: 'Knihomol', description: 'Dokonči 10 cvičení', emoji: '📚', condition: { type: 'sessions_completed', value: 10 } },
  { id: 'czech_pro', name: 'Češtinář', description: '100 správných odpovědí v češtině', emoji: '🇨🇿', condition: { type: 'czech_correct', value: 100 } },
  { id: 'math_wiz', name: 'Matikář', description: '100 správných příkladů', emoji: '🧮', condition: { type: 'math_correct', value: 100 } },
  { id: 'perfect', name: 'Bezchybný', description: '10 správných v řadě', emoji: '💯', condition: { type: 'perfect_streak', value: 10 } },
  { id: 'streak_3', name: 'Třídenní', description: '3 dny v řadě', emoji: '🔥', condition: { type: 'streak', value: 3 } },
  { id: 'streak_7', name: 'Týdenní bojovník', description: '7 dní v řadě', emoji: '⚡', condition: { type: 'streak', value: 7 } },
  { id: 'streak_14', name: 'Dvoutýdenní hrdina', description: '14 dní v řadě', emoji: '🌟', condition: { type: 'streak', value: 14 } },
  { id: 'streak_30', name: 'Měsíční legenda', description: '30 dní v řadě', emoji: '👑', condition: { type: 'streak', value: 30 } },
  { id: 'xp_100', name: 'Stovka', description: 'Získej 100 XP', emoji: '⭐', condition: { type: 'total_xp', value: 100 } },
  { id: 'xp_500', name: 'Pětistovka', description: 'Získej 500 XP', emoji: '🏅', condition: { type: 'total_xp', value: 500 } },
  { id: 'xp_1000', name: 'Tisícovka', description: 'Získej 1000 XP', emoji: '🏆', condition: { type: 'total_xp', value: 1000 } },
  { id: 'level_5', name: 'Znalec', description: 'Dosáhni levelu 5', emoji: '🎓', condition: { type: 'level', value: 5 } },
  { id: 'level_10', name: 'Legenda', description: 'Dosáhni levelu 10', emoji: '🌈', condition: { type: 'level', value: 10 } },
  { id: 'gamer', name: 'Hráčka', description: 'Vyhraj 10 her', emoji: '🎮', condition: { type: 'games_won', value: 10 } },
  { id: 'task_5', name: 'Úkolníček', description: 'Splň 5 úkolů', emoji: '✅', condition: { type: 'tasks_completed', value: 5 } },
  { id: 'task_20', name: 'Pracovitá včelka', description: 'Splň 20 úkolů', emoji: '🐝', condition: { type: 'tasks_completed', value: 20 } },
  { id: 'explorer', name: 'Průzkumnice', description: 'Vyzkoušej všechny předměty', emoji: '🗺️', condition: { type: 'subjects_tried', value: 4 } },
];
