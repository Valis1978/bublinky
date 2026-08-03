'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, X, Download } from 'lucide-react';
import { toggleReaction, REACTION_EMOJIS, type ChatMessage, type ChatReactions } from '@/services/chat.service';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  /** Current logged-in user id — needed to attribute/toggle reactions. */
  currentUserId?: string;
}

const LONG_PRESS_MS = 350;

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isMine, currentUserId }: MessageBubbleProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [stickerFailed, setStickerFailed] = useState(false);
  const mediaUrl = message.media_url;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const isSticker = message.type === 'sticker';
  const stickerOk = isSticker && !!mediaUrl && mediaUrl.startsWith('/stickers/') && !stickerFailed;

  const reactions: ChatReactions = message.reactions ?? {};
  const reactionEntries = Object.entries(reactions).filter(([, ids]) => ids.length > 0);

  // Cancel a pending long-press if the list scrolls underneath the finger.
  useEffect(() => {
    const cancelLongPress = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
    document.addEventListener('scroll', cancelLongPress, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', cancelLongPress, { capture: true });
  }, []);

  // Tap anywhere outside the open picker to dismiss it.
  useEffect(() => {
    if (!pickerOpen) return;
    const handleOutside = (event: PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [pickerOpen]);

  const handlePointerDown = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setPickerOpen(true);
      longPressTimer.current = null;
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDoubleClick = () => {
    handlePointerUp();
    setPickerOpen(true);
  };

  const handleToggleReaction = async (emoji: string) => {
    setPickerOpen(false);
    if (!currentUserId) return;
    await toggleReaction(message.id, emoji, currentUserId);
  };

  const gestureHandlers = {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerLeave: handlePointerUp,
    onDoubleClick: handleDoubleClick,
  };

  const timeRowColor = isSticker
    ? 'var(--text-muted)'
    : isMine
      ? 'var(--bubble-sent-text)'
      : 'var(--text-muted)';

  const timeRow = (
    <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <span className="text-[10px] opacity-60" style={{ color: timeRowColor }}>
        {formatTime(message.created_at)}
      </span>
      {isMine &&
        (message.read_at ? (
          <CheckCheck size={14} className="opacity-70" />
        ) : (
          <Check size={14} className="opacity-50" />
        ))}
    </div>
  );

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
        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-2 px-4`}
      >
        <div className="relative max-w-[80%]">
          {/* Reaction picker — floating pill above the bubble */}
          <AnimatePresence>
            {pickerOpen && (
              <motion.div
                ref={pickerRef}
                initial={{ opacity: 0, scale: 0.4, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.4, y: 8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  background: 'var(--bg-card)',
                  boxShadow: 'var(--shadow-lg)',
                  transformOrigin: 'bottom center',
                }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 flex gap-1 px-2 py-1.5 rounded-full"
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleToggleReaction(emoji)}
                    className="text-2xl leading-none p-1 active:scale-90 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {isSticker ? (
            stickerOk ? (
              <img
                src={mediaUrl}
                alt={message.content ?? 'Samolepka'}
                width={110}
                height={110}
                style={{ aspectRatio: '1 / 1', filter: 'drop-shadow(var(--shadow))' }}
                loading="lazy"
                onError={() => setStickerFailed(true)}
                {...gestureHandlers}
              />
            ) : (
              <div
                className="px-4 py-2.5"
                style={{
                  background: isMine ? 'var(--bubble-sent)' : 'var(--bubble-received)',
                  color: isMine ? 'var(--bubble-sent-text)' : 'var(--bubble-received-text)',
                  borderRadius: isMine
                    ? 'var(--radius) var(--radius) 6px var(--radius)'
                    : 'var(--radius) var(--radius) var(--radius) 6px',
                  boxShadow: isMine ? 'none' : 'var(--shadow)',
                }}
                {...gestureHandlers}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                  {message.content ?? 'Samolepka'} 🎁
                </p>
                {timeRow}
              </div>
            )
          ) : (
            <div
              className="px-4 py-2.5 relative"
              style={{
                background: isMine ? 'var(--bubble-sent)' : 'var(--bubble-received)',
                color: isMine ? 'var(--bubble-sent-text)' : 'var(--bubble-received-text)',
                borderRadius: isMine
                  ? 'var(--radius) var(--radius) 6px var(--radius)'
                  : 'var(--radius) var(--radius) var(--radius) 6px',
                boxShadow: isMine ? 'none' : 'var(--shadow)',
              }}
              {...gestureHandlers}
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

              {timeRow}
            </div>
          )}
        </div>

        {/* Reaction chips */}
        {reactionEntries.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 max-w-[80%] ${isMine ? 'justify-end' : 'justify-start'}`}>
            {reactionEntries.map(([emoji, ids]) => {
              const mine = !!currentUserId && ids.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleToggleReaction(emoji)}
                  className="flex items-center gap-1 text-sm px-2.5 py-1 rounded-full transition-colors"
                  style={{
                    background: mine ? 'var(--accent-soft)' : 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>{emoji}</span>
                  {ids.length > 1 && <span className="opacity-70 text-xs">{ids.length}</span>}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </>
  );
}
