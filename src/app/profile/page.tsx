'use client';

import { BottomNav } from '@/components/ui/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/hooks/useStats';
import { ACHIEVEMENTS } from '@/lib/gamification';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Flame, Trophy, Star, Target, Zap, PawPrint, CloudSun, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { stats, newAchievement, levelUp, dismissAchievement, dismissLevelUp } = useStats();

  return (
    <div className="flex flex-col h-dvh">
      {/* Level Up Toast */}
      <AnimatePresence>
        {levelUp && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            onClick={dismissLevelUp}
            className="fixed top-4 left-4 right-4 z-50 p-4 rounded-2xl text-center"
            style={{
              background: 'var(--accent-gradient)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <p className="text-white text-lg font-bold">
              🎉 Level {levelUp}!
            </p>
            <p className="text-white/80 text-sm">{stats.levelName}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Toast */}
      <AnimatePresence>
        {newAchievement && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            onClick={dismissAchievement}
            className="fixed top-4 left-4 right-4 z-50 glass-card p-4 flex items-center gap-3"
          >
            <span className="text-3xl">{newAchievement.emoji}</span>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {newAchievement.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {newAchievement.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-4 pb-nav safe-top">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Profil
        </h1>

        {/* Avatar + Level */}
        <div className="glass-card p-6 flex flex-col items-center gap-3 mb-4">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ background: 'var(--accent-gradient)' }}
            >
              {stats.levelEmoji}
            </motion.div>
            <div
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'var(--accent)' }}
            >
              {stats.level}
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {user?.name || 'Uživatel'}
            </p>
            <p className="text-sm" style={{ color: 'var(--accent)' }}>
              {stats.levelName}
            </p>
          </div>

          {/* XP Progress bar */}
          <div className="w-full">
            <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
              <span>{stats.totalXP} XP</span>
              <span>Level {stats.level + 1}</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--accent-gradient)' }}
                animate={{ width: `${stats.xpProgress.progress * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[10px] text-center mt-1" style={{ color: 'var(--text-muted)' }}>
              {stats.xpProgress.current} / {stats.xpProgress.needed} XP
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="glass-card p-3 text-center">
            <Flame size={18} className="mx-auto mb-1" style={{ color: '#EF4444' }} />
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.currentStreak}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Streak</p>
          </div>
          <div className="glass-card p-3 text-center">
            <Star size={18} className="mx-auto mb-1" style={{ color: 'var(--accent)' }} />
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.totalXP}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>XP</p>
          </div>
          <div className="glass-card p-3 text-center">
            <Target size={18} className="mx-auto mb-1" style={{ color: 'var(--mint)' }} />
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {stats.correctAnswers}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Správně</p>
          </div>
        </div>

        {/* More stats */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="glass-card p-3 flex items-center gap-2">
            <Zap size={16} style={{ color: 'var(--lavender)' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.longestStreak}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Nejdelší streak</p>
            </div>
          </div>
          <div className="glass-card p-3 flex items-center gap-2">
            <Trophy size={16} style={{ color: '#FBBF24' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats.sessionsCompleted}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Cvičení</p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Odznaky ({stats.unlockedAchievements.length} / {ACHIEVEMENTS.length})
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = stats.unlockedAchievements.includes(achievement.id);
              return (
                <div
                  key={achievement.id}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
                  style={{
                    background: unlocked ? 'var(--accent-soft)' : 'var(--bg-input)',
                    opacity: unlocked ? 1 : 0.4,
                    border: unlocked ? '1px solid var(--accent)' : '1px solid transparent',
                  }}
                  title={`${achievement.name}: ${achievement.description}`}
                >
                  <span className="text-xl">{unlocked ? achievement.emoji : '🔒'}</span>
                  <span
                    className="text-[8px] font-medium text-center px-1 leading-tight"
                    style={{ color: unlocked ? 'var(--text-secondary)' : 'var(--text-muted)' }}
                  >
                    {achievement.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dad Dashboard — only for parent */}
        {user?.role === 'parent' && (
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="glass-card p-4 flex items-center gap-3 transition-all active:scale-95 w-full"
              style={{ border: '2px solid var(--accent)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: 'var(--accent-soft)' }}
              >
                📊
              </div>
              <div>
                <span className="font-bold text-sm block" style={{ color: 'var(--text-primary)' }}>
                  Rodičovský Dashboard
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Aktivita, GPS, notifikace
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* More sections */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Více
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/pet', icon: PawPrint, label: 'Mazlíček', emoji: '🐾', color: '#F59E0B' },
              { href: '/weather', icon: CloudSun, label: 'Počasí', emoji: '🌤️', color: '#0EA5E9' },
              { href: '/stories', icon: Sparkles, label: 'Příběhy', emoji: '✨', color: '#A855F7' },
              { href: '/diary', icon: BookOpen, label: 'Deníček', emoji: '📓', color: '#EC4899' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="glass-card p-4 flex items-center gap-3 transition-all active:scale-95"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: `${item.color}20` }}
                >
                  {item.emoji}
                </div>
                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full glass-card p-4 flex items-center gap-3 transition-colors"
          style={{ color: 'var(--coral)' }}
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Odhlásit se</span>
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
