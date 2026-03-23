'use client';

import { BottomNav } from '@/components/ui/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { LogOut, User, Star } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-dvh">
      <div className="flex-1 overflow-y-auto p-6 pb-24 safe-top">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
          Profil
        </h1>

        {/* Avatar + Name */}
        <div className="glass-card p-6 flex flex-col items-center gap-4 mb-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {user?.role === 'child' ? '💜' : '💙'}
          </motion.div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {user?.name || 'Uživatel'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {user?.role === 'child' ? 'Hlavní hrdinka' : 'Admin'}
            </p>
          </div>
        </div>

        {/* Stats placeholder */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Star size={18} style={{ color: 'var(--accent)' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Statistiky
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Brzy! XP, levely, streak a achievementy.
          </p>
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
