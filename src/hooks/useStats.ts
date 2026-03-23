'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getLevelFromXP,
  getXPForNextLevel,
  getLevelName,
  getLevelEmoji,
  calculateStreak,
  XP_REWARDS,
  ACHIEVEMENTS,
  type Achievement,
} from '@/lib/gamification';

interface UserStats {
  totalXP: number;
  level: number;
  levelName: string;
  levelEmoji: string;
  xpProgress: { current: number; needed: number; progress: number };
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  sessionsCompleted: number;
  correctAnswers: number;
  gamesWon: number;
  tasksCompleted: number;
  unlockedAchievements: string[];
}

const DEFAULT_STATS: UserStats = {
  totalXP: 0,
  level: 1,
  levelName: 'Začátečník',
  levelEmoji: '🌱',
  xpProgress: { current: 0, needed: 50, progress: 0 },
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  sessionsCompleted: 0,
  correctAnswers: 0,
  gamesWon: 0,
  tasksCompleted: 0,
  unlockedAchievements: [],
};

function enrichStats(raw: Partial<UserStats>): UserStats {
  const totalXP = raw.totalXP ?? 0;
  const level = getLevelFromXP(totalXP);
  return {
    ...DEFAULT_STATS,
    ...raw,
    level,
    levelName: getLevelName(level),
    levelEmoji: getLevelEmoji(level),
    xpProgress: getXPForNextLevel(totalXP),
  };
}

// Debounced DB sync — saves at most once per 2 seconds
function useDebouncedDBSync() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncToDB = useCallback((userId: string, stats: UserStats) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await fetch('/api/stats', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, stats }),
        });
      } catch {
        // Silently fail — localStorage is primary, DB is backup
      }
    }, 2000);
  }, []);

  return syncToDB;
}

export function useStats() {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const syncToDB = useDebouncedDBSync();

  // Get current user ID from localStorage
  const getUserId = useCallback((): string | null => {
    try {
      const user = localStorage.getItem('bub_user');
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.id || null;
      }
    } catch { /* ignore */ }
    return null;
  }, []);

  // Load: localStorage first (instant), then DB (background merge)
  useEffect(() => {
    // 1. Load from localStorage (instant)
    const saved = localStorage.getItem('bub_stats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStats(enrichStats(parsed));
      } catch { /* ignore */ }
    }

    // 2. Load from DB (async, merge with higher values)
    const userId = getUserId();
    if (userId) {
      fetch(`/api/stats?userId=${userId}`)
        .then(res => res.json())
        .then(dbData => {
          if (dbData && typeof dbData.total_xp === 'number') {
            // Convert DB snake_case to camelCase
            const dbStats: Partial<UserStats> = {
              totalXP: dbData.total_xp,
              currentStreak: dbData.current_streak,
              longestStreak: dbData.longest_streak,
              lastActivityDate: dbData.last_activity_date,
              sessionsCompleted: dbData.sessions_completed,
              correctAnswers: dbData.correct_answers,
              gamesWon: dbData.games_won,
              tasksCompleted: dbData.tasks_completed,
              unlockedAchievements: dbData.unlocked_achievements || [],
            };

            // Merge: take the MAX of each numeric field
            setStats(prev => {
              const merged = enrichStats({
                totalXP: Math.max(prev.totalXP, dbStats.totalXP ?? 0),
                currentStreak: Math.max(prev.currentStreak, dbStats.currentStreak ?? 0),
                longestStreak: Math.max(prev.longestStreak, dbStats.longestStreak ?? 0),
                lastActivityDate: prev.lastActivityDate && dbStats.lastActivityDate
                  ? (new Date(prev.lastActivityDate) > new Date(dbStats.lastActivityDate) ? prev.lastActivityDate : dbStats.lastActivityDate)
                  : prev.lastActivityDate || dbStats.lastActivityDate || null,
                sessionsCompleted: Math.max(prev.sessionsCompleted, dbStats.sessionsCompleted ?? 0),
                correctAnswers: Math.max(prev.correctAnswers, dbStats.correctAnswers ?? 0),
                gamesWon: Math.max(prev.gamesWon, dbStats.gamesWon ?? 0),
                tasksCompleted: Math.max(prev.tasksCompleted, dbStats.tasksCompleted ?? 0),
                unlockedAchievements: [...new Set([...prev.unlockedAchievements, ...(dbStats.unlockedAchievements ?? [])])],
              });
              localStorage.setItem('bub_stats', JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch(() => { /* offline — use localStorage */ });
    }

    setLoaded(true);
  }, [getUserId]);

  // Save to localStorage + schedule DB sync
  const saveStats = useCallback((newStats: UserStats) => {
    localStorage.setItem('bub_stats', JSON.stringify(newStats));
    setStats(newStats);

    const userId = getUserId();
    if (userId) {
      syncToDB(userId, newStats);
    }
  }, [getUserId, syncToDB]);

  // Check achievements
  const checkAchievements = useCallback(
    (s: UserStats): string[] => {
      const newUnlocks: string[] = [];
      for (const achievement of ACHIEVEMENTS) {
        if (s.unlockedAchievements.includes(achievement.id)) continue;

        let unlocked = false;
        switch (achievement.condition.type) {
          case 'total_xp':
            unlocked = s.totalXP >= achievement.condition.value;
            break;
          case 'level':
            unlocked = s.level >= achievement.condition.value;
            break;
          case 'streak':
            unlocked = s.currentStreak >= achievement.condition.value;
            break;
          case 'sessions_completed':
            unlocked = s.sessionsCompleted >= achievement.condition.value;
            break;
          case 'games_won':
            unlocked = s.gamesWon >= achievement.condition.value;
            break;
          case 'tasks_completed':
            unlocked = s.tasksCompleted >= achievement.condition.value;
            break;
        }

        if (unlocked) {
          newUnlocks.push(achievement.id);
        }
      }
      return newUnlocks;
    },
    []
  );

  // Add XP
  const addXP = useCallback(
    (amount: number, source?: string) => {
      setStats((prev) => {
        const oldLevel = prev.level;
        const newXP = prev.totalXP + amount;

        // Streak
        const { newStreak } = calculateStreak(prev.lastActivityDate, prev.currentStreak);
        const longestStreak = Math.max(prev.longestStreak, newStreak);
        const streakBonus = newStreak > 1 ? XP_REWARDS.STREAK_BONUS : 0;
        const finalXP = newXP + streakBonus;

        const newStats: UserStats = {
          ...prev,
          totalXP: finalXP,
          level: getLevelFromXP(finalXP),
          levelName: getLevelName(getLevelFromXP(finalXP)),
          levelEmoji: getLevelEmoji(getLevelFromXP(finalXP)),
          xpProgress: getXPForNextLevel(finalXP),
          currentStreak: newStreak,
          longestStreak,
          lastActivityDate: new Date().toISOString(),
          correctAnswers: source === 'learn' ? prev.correctAnswers + 1 : prev.correctAnswers,
        };

        // Check level up
        const newLevel = getLevelFromXP(finalXP);
        if (newLevel > oldLevel) {
          setLevelUp(newLevel);
          setTimeout(() => setLevelUp(null), 3000);
        }

        // Check achievements
        const newUnlocks = checkAchievements(newStats);
        if (newUnlocks.length > 0) {
          newStats.unlockedAchievements = [...prev.unlockedAchievements, ...newUnlocks];
          const achievement = ACHIEVEMENTS.find((a) => a.id === newUnlocks[0]);
          if (achievement) {
            setNewAchievement(achievement);
            setTimeout(() => setNewAchievement(null), 3000);
          }
        }

        saveStats(newStats);
        return newStats;
      });
    },
    [saveStats, checkAchievements]
  );

  // Complete a learning session
  const completeSession = useCallback(
    (correct: number, total: number) => {
      const baseXP = correct * XP_REWARDS.CORRECT_ANSWER;
      const perfectBonus = correct === total ? XP_REWARDS.PERFECT_SESSION : 0;

      setStats((prev) => {
        const isFirst = prev.sessionsCompleted === 0;
        const firstBonus = isFirst ? XP_REWARDS.FIRST_SESSION : 0;

        const newStats = {
          ...prev,
          sessionsCompleted: prev.sessionsCompleted + 1,
          correctAnswers: prev.correctAnswers + correct,
        };
        saveStats(newStats);
        return newStats;
      });

      const isFirst = stats.sessionsCompleted === 0;
      addXP(baseXP + perfectBonus + (isFirst ? XP_REWARDS.FIRST_SESSION : 0), 'learn');
    },
    [addXP, saveStats, stats.sessionsCompleted]
  );

  // Win a game
  const winGame = useCallback(() => {
    setStats((prev) => {
      const newStats = { ...prev, gamesWon: prev.gamesWon + 1 };
      saveStats(newStats);
      return newStats;
    });
    addXP(XP_REWARDS.GAME_WIN, 'game');
  }, [addXP, saveStats]);

  // Complete a task
  const completeTask = useCallback(() => {
    setStats((prev) => {
      const newStats = { ...prev, tasksCompleted: prev.tasksCompleted + 1 };
      saveStats(newStats);
      return newStats;
    });
    addXP(5, 'task');
  }, [addXP, saveStats]);

  // Dismiss notifications
  const dismissAchievement = useCallback(() => setNewAchievement(null), []);
  const dismissLevelUp = useCallback(() => setLevelUp(null), []);

  return {
    stats,
    loaded,
    addXP,
    completeSession,
    winGame,
    completeTask,
    newAchievement,
    levelUp,
    dismissAchievement,
    dismissLevelUp,
    allAchievements: ACHIEVEMENTS,
  };
}
