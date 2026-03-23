'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Check } from 'lucide-react';

interface PinKeypadProps {
  onSubmit: (pin: string) => void;
  loading?: boolean;
  error?: string | null;
  maxLength?: number;
}

export function PinKeypad({ onSubmit, loading, error, maxLength = 4 }: PinKeypadProps) {
  const [pin, setPin] = useState('');

  const addDigit = useCallback(
    (digit: string) => {
      if (pin.length < maxLength) {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === maxLength) {
          setTimeout(() => onSubmit(newPin), 150);
        }
      }
    },
    [pin, maxLength, onSubmit]
  );

  const deleteDigit = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="flex flex-col items-center gap-8">
      {/* PIN dots */}
      <div className="flex gap-4">
        {Array.from({ length: maxLength }).map((_, i) => (
          <motion.div
            key={i}
            className="w-4 h-4 rounded-full border-2"
            style={{
              borderColor: error ? '#EF4444' : 'var(--accent)',
              background: i < pin.length ? 'var(--accent)' : 'transparent',
            }}
            animate={
              error && i < pin.length
                ? { x: [0, -6, 6, -4, 4, 0] }
                : i === pin.length - 1 && pin.length > 0
                  ? { scale: [1, 1.3, 1] }
                  : {}
            }
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-500 text-sm font-medium text-center"
            onAnimationComplete={() => {
              setTimeout(() => setPin(''), 500);
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
        {keys.map((key) => {
          if (key === '') return <div key="empty" />;

          if (key === 'del') {
            return (
              <motion.button
                key="del"
                whileTap={{ scale: 0.9 }}
                onClick={deleteDigit}
                disabled={loading || pin.length === 0}
                className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center
                  text-[var(--text-secondary)] transition-colors
                  disabled:opacity-30"
                style={{ background: 'var(--bg-input)' }}
              >
                <Delete size={24} />
              </motion.button>
            );
          }

          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.9 }}
              onClick={() => addDigit(key)}
              disabled={loading || pin.length >= maxLength}
              className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center
                text-2xl font-semibold transition-all
                disabled:opacity-30 active:shadow-none"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow)',
              }}
            >
              {key}
            </motion.button>
          );
        })}
      </div>

      {/* Loading indicator */}
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-6 h-6 border-2 border-t-transparent rounded-full"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      )}
    </div>
  );
}
