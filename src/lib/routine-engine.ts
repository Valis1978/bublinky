/**
 * Daily Routine Engine
 * Pet does routines WITH Viki (not commands, shared activities)
 * All routines are opt-in, never forced
 */

export interface RoutineStep {
  id: string;
  label: string;
  emoji: string;
  time: 'morning' | 'afternoon' | 'evening';
  petMessage: string;
  xpReward: number;
  skillBranch?: string;
}

export const ROUTINES: RoutineStep[] = [
  // Morning
  { id: 'teeth_morning', label: 'Zuby ráno', emoji: '🪥', time: 'morning',
    petMessage: 'Jdeme si čistit zoubky! 🦷✨ Čistíme spolu!', xpReward: 3 },
  { id: 'get_dressed', label: 'Převléct se', emoji: '👕', time: 'morning',
    petMessage: 'Převlékneme se! Co si dneska vezmeš? 👗', xpReward: 3 },
  { id: 'make_bed', label: 'Ustlat postel', emoji: '🛏️', time: 'morning',
    petMessage: 'Ustláno! Jsme šikovní! 🌟 Já si taky ustlal/a pelíšek!', xpReward: 5 },
  { id: 'drink_water_am', label: 'Napít se vody', emoji: '💧', time: 'morning',
    petMessage: 'Gulp gulp! 💧 Voda je fajn! Napila ses taky?', xpReward: 2 },
  { id: 'walk_dog_am', label: 'Venčit pejska', emoji: '🐕', time: 'morning',
    petMessage: 'Pojďme venčit! 🐾 Čerstvý vzduch!', xpReward: 5, skillBranch: 'nature' },

  // Afternoon
  { id: 'homework', label: 'Domácí úkoly', emoji: '📚', time: 'afternoon',
    petMessage: 'Učení! 📖 Já se taky budu učit nový trik!', xpReward: 8, skillBranch: 'wisdom' },
  { id: 'drink_water_pm', label: 'Napít se vody', emoji: '💧', time: 'afternoon',
    petMessage: 'Nezapomeň pít! 💧 Já mám taky žízeň!', xpReward: 2 },
  { id: 'outside_play', label: 'Hrát si venku', emoji: '🌳', time: 'afternoon',
    petMessage: 'Pojď ven! 🌞 Dneska je krásně!', xpReward: 5, skillBranch: 'strength' },

  // Evening
  { id: 'walk_dog_pm', label: 'Venčit pejska', emoji: '🐕', time: 'evening',
    petMessage: 'Večerní procházka! 🌙🐾 Pojďme!', xpReward: 5, skillBranch: 'nature' },
  { id: 'shower', label: 'Sprcha / koupel', emoji: '🚿', time: 'evening',
    petMessage: 'Koupelka! 🛁 Já se taky osprchuju! Bubliny! 🫧', xpReward: 3 },
  { id: 'teeth_evening', label: 'Zuby večer', emoji: '🪥', time: 'evening',
    petMessage: 'Zuby na dobrou noc! 🦷🌙 Čistíme spolu!', xpReward: 3 },
  { id: 'read_story', label: 'Přečíst si', emoji: '📖', time: 'evening',
    petMessage: 'Příběh na dobrou noc! 📚✨ Přečti mi něco!', xpReward: 5, skillBranch: 'wisdom' },
  { id: 'goodnight', label: 'Dobrou noc', emoji: '🌙', time: 'evening',
    petMessage: 'Dobrou noc, Viki! 💤🌙 Sladké sny! Zítra se uvidíme!', xpReward: 2 },
];

export function getRoutinesByTime(time: 'morning' | 'afternoon' | 'evening'): RoutineStep[] {
  return ROUTINES.filter(r => r.time === time);
}

export function getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

/** Get today's date key for tracking completions (local timezone, not UTC) */
export function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Load completed routines for today from localStorage */
export function getCompletedRoutines(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = `bub_routines_${getTodayKey()}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

/** Mark a routine as completed today */
export function completeRoutine(routineId: string): string[] {
  if (typeof window === 'undefined') return [];
  const key = `bub_routines_${getTodayKey()}`;
  const completed = getCompletedRoutines();
  if (!completed.includes(routineId)) {
    completed.push(routineId);
    localStorage.setItem(key, JSON.stringify(completed));
  }
  return completed;
}

/** Get streak (consecutive days with at least 3 completed routines) */
export function getRoutineStreak(): number {
  if (typeof window === 'undefined') return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `bub_routines_${d.toISOString().split('T')[0]}`;
    const raw = localStorage.getItem(key);
    const completed = raw ? JSON.parse(raw) : [];
    if (completed.length >= 3) {
      streak++;
    } else if (i > 0) {
      break; // streak broken (skip today in case they haven't done any yet)
    }
  }
  return streak;
}
