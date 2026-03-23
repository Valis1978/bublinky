'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { PinKeypad } from '@/components/ui/PinKeypad';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Heart, Shield } from 'lucide-react';
import type { UserRole } from '@/types/database';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { setTheme } = useTheme();

  const handleSubmit = async (pin: string) => {
    if (!selectedRole) return;
    setLoading(true);
    setError(null);

    const result = await login(pin, selectedRole);

    if (result.success) {
      setTheme(selectedRole === 'parent' ? 'tata' : 'viki');
      window.location.href = '/chat';
    } else {
      setError(result.error || 'Nesprávný PIN');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--bg-primary)' }}
    >
      <AnimatePresence mode="wait">
        {!selectedRole ? (
          <motion.div
            key="role-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-10 w-full max-w-sm"
          >
            {/* Logo */}
            <div className="text-center">
              <motion.h1
                className="text-5xl font-extrabold mb-2"
                style={{
                  background: 'linear-gradient(135deg, #F9A8D4, #C4B5FD, #86EFAC)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                Bublinky
              </motion.h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Kdo jsi?
              </p>
            </div>

            {/* Role buttons */}
            <div className="flex flex-col gap-4 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedRole('child');
                  setTheme('viki');
                }}
                className="w-full p-6 rounded-3xl flex items-center gap-4 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #FFF0F5, #F5F3FF)',
                  border: '2px solid rgba(249, 168, 212, 0.3)',
                  boxShadow: '0 4px 20px rgba(249, 168, 212, 0.15)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'linear-gradient(135deg, #F9A8D4, #C4B5FD)' }}
                >
                  <Heart className="text-white" size={28} />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-gray-800">Jsem Viki</p>
                  <p className="text-sm text-gray-500">Ahoj!</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedRole('parent');
                  setTheme('tata');
                }}
                className="w-full p-6 rounded-3xl flex items-center gap-4 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #1E293B, #0F172A)',
                  border: '2px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #10B981)' }}
                >
                  <Shield className="text-white" size={28} />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-slate-200">Jsem Táta</p>
                  <p className="text-sm text-slate-400">Vstup</p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pin-entry"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-8 w-full max-w-sm"
          >
            <button
              onClick={() => {
                setSelectedRole(null);
                setError(null);
              }}
              className="self-start text-sm font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              &larr; Zpět
            </button>

            <div className="text-center">
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {selectedRole === 'child' ? 'Ahoj Viki!' : 'Ahoj!'}
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Zadej svůj PIN
              </p>
            </div>

            <PinKeypad onSubmit={handleSubmit} loading={loading} error={error} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
