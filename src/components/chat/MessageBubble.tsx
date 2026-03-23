'use client';

import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import type { BubMessage } from '@/types/database';

interface MessageBubbleProps {
  message: BubMessage;
  isMine: boolean;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2 px-4`}
    >
      <div
        className="max-w-[80%] px-4 py-2.5 relative"
        style={{
          background: isMine ? 'var(--bubble-sent)' : 'var(--bubble-received)',
          color: isMine ? 'var(--bubble-sent-text)' : 'var(--bubble-received-text)',
          borderRadius: isMine
            ? 'var(--radius) var(--radius) 6px var(--radius)'
            : 'var(--radius) var(--radius) var(--radius) 6px',
          boxShadow: isMine ? 'none' : 'var(--shadow)',
        }}
      >
        {/* Photo */}
        {message.type === 'photo' && message.media_url && (
          <img
            src={message.media_url}
            alt=""
            className="rounded-xl mb-1.5 max-w-full"
            style={{ maxHeight: 300 }}
            loading="lazy"
          />
        )}

        {/* Text content */}
        {message.content && (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* Time + read receipt */}
        <div
          className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}
        >
          <span
            className="text-[10px] opacity-60"
            style={{
              color: isMine ? 'var(--bubble-sent-text)' : 'var(--text-muted)',
            }}
          >
            {formatTime(message.created_at)}
          </span>
          {isMine && (
            message.read_at ? (
              <CheckCheck size={14} className="opacity-70" />
            ) : (
              <Check size={14} className="opacity-50" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
