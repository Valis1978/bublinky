'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface SpeechBubbleProps {
  message: string;
  emotion?: string;
  visible: boolean;
}

export function SpeechBubble({ message, emotion, visible }: SpeechBubbleProps) {
  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 max-w-[250px]"
        >
          <div
            className="px-4 py-2 rounded-2xl rounded-bl-sm text-sm relative"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            {emotion && <span className="mr-1">{getEmotionEmoji(emotion)}</span>}
            <span className="font-medium">{message}</span>
            {/* Triangle pointer */}
            <div
              className="absolute -bottom-1.5 left-6 w-3 h-3 rotate-45"
              style={{ background: 'var(--accent)' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getEmotionEmoji(emotion: string): string {
  const map: Record<string, string> = {
    happy: '😊', sad: '😢', excited: '🤩', sleepy: '😴',
    hungry: '🍽️', playful: '🎮', grateful: '🥰', shy: '🙈',
    curious: '🤔',
  };
  return map[emotion] || '';
}
