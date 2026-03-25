'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, X, Download } from 'lucide-react';
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
  const [fullscreen, setFullscreen] = useState(false);
  const mediaUrl = message.media_url;

  return (
    <>
      {/* Fullscreen image/video overlay */}
      <AnimatePresence>
        {fullscreen && mediaUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setFullscreen(false)}
          >
            {/* Close + Download — safe area aware for iPhone notch/dynamic island */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-between p-4 safe-top">
              <a
                href={mediaUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-white/20 text-white backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={20} />
              </a>
              <button
                className="p-3 rounded-full bg-white/20 text-white backdrop-blur-sm"
                onClick={() => setFullscreen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {message.type === 'video' ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <motion.img
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                src={mediaUrl}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
        {/* Photo — tap to fullscreen */}
        {message.type === 'photo' && message.media_url && (
          <img
            src={message.media_url}
            alt=""
            className="rounded-xl mb-1.5 max-w-full cursor-pointer active:opacity-80 transition-opacity"
            style={{ maxHeight: 300 }}
            loading="lazy"
            onClick={() => setFullscreen(true)}
          />
        )}

        {/* Voice */}
        {message.type === 'voice' && message.media_url && (
          <div className="flex items-center gap-2 mb-1">
            <audio src={message.media_url} controls className="h-8 max-w-[200px]" preload="metadata" />
          </div>
        )}

        {/* Video — tap to fullscreen */}
        {message.type === 'video' && message.media_url && (
          <div className="relative cursor-pointer" onClick={() => setFullscreen(true)}>
            <video
              src={message.media_url}
              playsInline
              preload="metadata"
              className="rounded-xl mb-1.5 max-w-full"
              style={{ maxHeight: 300 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                <span className="text-white text-xl ml-1">▶</span>
              </div>
            </div>
          </div>
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
    </>
  );
}
