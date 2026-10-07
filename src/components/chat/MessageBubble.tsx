'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import {
  Check, CheckCheck, X, Download, Clock, Reply, Copy, Pencil, Trash2, AlertCircle, RotateCw,
} from 'lucide-react';
import { toggleReaction, REACTION_EMOJIS, type ChatReactions } from '@/services/chat.service';
import type { UiMessage } from '@/hooks/useMessages';
import { readMeta, withinEditWindow, isEmojiOnly, splitLinks } from '@/lib/chat-meta';
import { hapticBump, hapticTap } from '@/lib/haptics';

interface MessageBubbleProps {
  message: UiMessage;
  isMine: boolean;
  /** Current logged-in user id — needed to attribute/toggle reactions. */
  currentUserId?: string;
  /** user id → display name, for reply quotes */
  names: Record<string, string>;
  /** Same sender as the previous / next message within a few minutes */
  joinsPrev?: boolean;
  joinsNext?: boolean;
  highlighted?: boolean;
  onReply: (message: UiMessage) => void;
  onEdit: (message: UiMessage) => void;
  onDelete: (message: UiMessage) => void;
  onRetry: (id: string) => void;
  onDiscard: (id: string) => void;
  onJumpTo: (id: string) => void;
}

const LONG_PRESS_MS = 350;
const SWIPE_REPLY_PX = 60;

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

function LinkedText({ text, isMine }: { text: string; isMine: boolean }) {
  return (
    <>
      {splitLinks(text).map((part, i) =>
        part.href ? (
          <a
            key={i}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 break-all"
            style={{ color: isMine ? 'inherit' : 'var(--accent)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

export function MessageBubble({
  message, isMine, currentUserId, names, joinsPrev, joinsNext, highlighted,
  onReply, onEdit, onDelete, onRetry, onDiscard, onJumpTo,
}: MessageBubbleProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stickerFailed, setStickerFailed] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragX = useMotionValue(0);
  const replyIconOpacity = useTransform(dragX, [0, SWIPE_REPLY_PX], [0, 1]);

  const meta = readMeta(message.media_metadata);
  const deleted = !!meta.deleted_at;
  const pending = !!message.status;
  const mediaUrl = message.media_url;
  const isSticker = message.type === 'sticker';
  const stickerOk = isSticker && !!mediaUrl && mediaUrl.startsWith('/stickers/') && !stickerFailed;
  const bigEmoji = message.type === 'text' && !deleted && !meta.reply_to && isEmojiOnly(message.content);
  const bare = (isSticker && stickerOk) || bigEmoji;

  const canChange = isMine && !deleted && !pending && withinEditWindow(message.created_at);
  const canEdit = canChange && message.type === 'text';

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

  const openMenu = () => {
    if (deleted || pending) return;
    void hapticBump();
    setConfirmDelete(false);
    setMenuOpen(true);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const gestureHandlers = {
    onPointerDown: () => {
      cancelLongPress();
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        openMenu();
      }, LONG_PRESS_MS);
    },
    onPointerUp: cancelLongPress,
    onPointerLeave: cancelLongPress,
    onDoubleClick: () => {
      cancelLongPress();
      openMenu();
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_REPLY_PX && !deleted && !pending) {
      void hapticTap();
      onReply(message);
    }
  };

  const handleToggleReaction = async (emoji: string) => {
    setMenuOpen(false);
    if (!currentUserId) return;
    void hapticTap();
    await toggleReaction(message.id, emoji, currentUserId);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content ?? '');
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setMenuOpen(false);
      }, 700);
    } catch {
      setMenuOpen(false);
    }
  };

  const textColor = isMine ? 'var(--bubble-sent-text)' : 'var(--bubble-received-text)';
  const timeRowColor = bare || deleted ? 'var(--text-muted)' : isMine ? 'var(--bubble-sent-text)' : 'var(--text-muted)';

  // Tail corner is always tight; the corner facing the previous bubble of a
  // stack tightens too, like iMessage
  const r = 'var(--radius)';
  const tight = '6px';
  const borderRadius = isMine
    ? `${r} ${joinsPrev ? tight : r} ${tight} ${r}`
    : `${joinsPrev ? tight : r} ${r} ${r} ${tight}`;

  const timeRow = (
    <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {meta.edited_at && !deleted && (
        <span className="text-[10px] opacity-60" style={{ color: timeRowColor }}>upraveno ·</span>
      )}
      <span className="text-[10px] opacity-60" style={{ color: timeRowColor }}>
        {formatTime(message.created_at)}
      </span>
      {isMine && !deleted &&
        (message.status === 'sending' ? (
          <Clock size={12} className="opacity-50" />
        ) : message.status === 'failed' ? (
          <AlertCircle size={14} className="text-red-500" />
        ) : message.read_at ? (
          <CheckCheck size={14} className="opacity-70" />
        ) : (
          <Check size={14} className="opacity-50" />
        ))}
    </div>
  );

  const replyQuote = meta.reply_to && !deleted && (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onJumpTo(meta.reply_to!.id);
      }}
      className="block w-full text-left mb-1.5 px-2.5 py-1.5 rounded-xl"
      style={{
        background: isMine ? 'rgba(255,255,255,0.18)' : 'var(--accent-soft)',
        borderLeft: `3px solid ${isMine ? 'rgba(255,255,255,0.7)' : 'var(--accent)'}`,
      }}
    >
      <span className="block text-[11px] font-bold opacity-90" style={{ color: textColor }}>
        {meta.reply_to.sender_id === currentUserId ? 'Ty' : names[meta.reply_to.sender_id] ?? 'Zpráva'}
      </span>
      <span className="block text-[13px] opacity-80 truncate" style={{ color: textColor }}>
        {meta.reply_to.preview}
      </span>
    </button>
  );

  const bubbleBody = deleted ? (
    <div
      className="px-4 py-2.5"
      style={{ borderRadius, border: '1px dashed var(--border)', color: 'var(--text-muted)' }}
    >
      <p className="text-[14px] italic">🚫 Zpráva byla smazána</p>
      {timeRow}
    </div>
  ) : isSticker && stickerOk ? (
    <div>
      <img
        src={mediaUrl!}
        alt={message.content ?? 'Samolepka'}
        width={110}
        height={110}
        style={{ aspectRatio: '1 / 1', filter: 'drop-shadow(var(--shadow))' }}
        loading="lazy"
        draggable={false}
        onError={() => setStickerFailed(true)}
      />
      {timeRow}
    </div>
  ) : bigEmoji ? (
    <div>
      <p className="text-5xl leading-tight select-none">{message.content}</p>
      {timeRow}
    </div>
  ) : (
    <div
      className="px-4 py-2.5 relative"
      style={{
        background: isMine ? 'var(--bubble-sent)' : 'var(--bubble-received)',
        color: textColor,
        borderRadius,
        boxShadow: isMine ? 'none' : 'var(--shadow)',
        opacity: message.status === 'sending' ? 0.75 : 1,
      }}
    >
      {replyQuote}

      {message.type === 'photo' && mediaUrl && (
        <img
          src={mediaUrl}
          alt=""
          className="rounded-xl mb-1.5 max-w-full cursor-pointer active:opacity-80 transition-opacity"
          style={{ maxHeight: 300 }}
          loading="lazy"
          draggable={false}
          onClick={() => setFullscreen(true)}
        />
      )}

      {message.type === 'voice' && mediaUrl && (
        <div className="flex items-center gap-2 mb-1">
          <audio src={mediaUrl} controls className="h-8 max-w-[200px]" preload="metadata" />
        </div>
      )}

      {message.type === 'video' && mediaUrl && (
        <div className="relative cursor-pointer" onClick={() => setFullscreen(true)}>
          <video
            src={mediaUrl}
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

      {message.content && (
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {isSticker ? `${message.content} 🎁` : <LinkedText text={message.content} isMine={isMine} />}
        </p>
      )}

      {timeRow}
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

      {/* Long-press menu: reactions + actions, iOS-style sheet */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[90] flex flex-col items-center justify-end p-4 pb-8 safe-bottom"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              className="w-full max-w-sm flex flex-col gap-2"
              initial={{ y: 40, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex justify-between px-3 py-2 rounded-full"
                style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}
              >
                {REACTION_EMOJIS.map((emoji, i) => {
                  const mine = !!currentUserId && (reactions[emoji] ?? []).includes(currentUserId);
                  return (
                    <motion.button
                      key={emoji}
                      type="button"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.03 * i, type: 'spring', stiffness: 500, damping: 18 }}
                      whileTap={{ scale: 1.4 }}
                      onClick={() => handleToggleReaction(emoji)}
                      className="text-[28px] leading-none p-1 rounded-full"
                      style={{ background: mine ? 'var(--accent-soft)' : 'transparent' }}
                    >
                      {emoji}
                    </motion.button>
                  );
                })}
              </div>

              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}
              >
                {confirmDelete ? (
                  <>
                    <p className="px-4 pt-3 pb-1 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                      Smazat zprávu pro všechny?
                    </p>
                    <MenuItem
                      icon={<Trash2 size={18} />}
                      label="Smazat"
                      danger
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(message);
                      }}
                    />
                    <MenuItem icon={<X size={18} />} label="Zpět" onClick={() => setConfirmDelete(false)} />
                  </>
                ) : (
                  <>
                    <MenuItem
                      icon={<Reply size={18} />}
                      label="Odpovědět"
                      onClick={() => {
                        setMenuOpen(false);
                        onReply(message);
                      }}
                    />
                    {message.content && !isSticker && (
                      <MenuItem
                        icon={copied ? <Check size={18} /> : <Copy size={18} />}
                        label={copied ? 'Zkopírováno' : 'Kopírovat'}
                        onClick={handleCopy}
                      />
                    )}
                    {canEdit && (
                      <MenuItem
                        icon={<Pencil size={18} />}
                        label="Upravit"
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit(message);
                        }}
                      />
                    )}
                    {canChange && (
                      <MenuItem
                        icon={<Trash2 size={18} />}
                        label="Smazat pro všechny"
                        danger
                        onClick={() => setConfirmDelete(true)}
                      />
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        id={`msg-${message.id}`}
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`relative flex flex-col ${isMine ? 'items-end' : 'items-start'} px-4 ${joinsNext ? 'mb-0.5' : 'mb-2.5'}`}
      >
        {/* Reply arrow revealed while swiping right */}
        <motion.div
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ opacity: replyIconOpacity, color: 'var(--accent)' }}
        >
          <Reply size={20} />
        </motion.div>

        <motion.div
          className="relative max-w-[80%] touch-pan-y"
          drag={deleted || pending ? false : 'x'}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.5 }}
          dragSnapToOrigin
          onDragStart={cancelLongPress}
          onDragEnd={handleDragEnd}
          style={{ x: dragX }}
          animate={highlighted ? { scale: [1, 1.04, 1] } : undefined}
          transition={{ duration: 0.5 }}
          {...gestureHandlers}
        >
          <div
            className="transition-shadow"
            style={highlighted ? { boxShadow: '0 0 0 3px var(--accent-soft)', borderRadius } : undefined}
          >
            {bubbleBody}
          </div>
        </motion.div>

        {message.status === 'failed' && (
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-red-500 font-medium">Neodesláno</span>
            <button
              type="button"
              onClick={() => onRetry(message.id)}
              className="flex items-center gap-1 font-bold"
              style={{ color: 'var(--accent)' }}
            >
              <RotateCw size={12} /> Zkusit znovu
            </button>
            <button type="button" onClick={() => onDiscard(message.id)} style={{ color: 'var(--text-muted)' }}>
              Zrušit
            </button>
          </div>
        )}

        {/* Reaction chips */}
        {reactionEntries.length > 0 && !deleted && (
          <div className={`flex flex-wrap gap-1 -mt-1 mb-1 max-w-[80%] ${isMine ? 'justify-end' : 'justify-start'}`}>
            {reactionEntries.map(([emoji, ids]) => {
              const mine = !!currentUserId && ids.includes(currentUserId);
              return (
                <motion.button
                  key={emoji}
                  type="button"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  onClick={() => handleToggleReaction(emoji)}
                  className="flex items-center gap-1 text-sm px-2 py-0.5 rounded-full"
                  style={{
                    background: mine ? 'var(--accent-soft)' : 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>{emoji}</span>
                  {ids.length > 1 && <span className="opacity-70 text-xs">{ids.length}</span>}
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>
    </>
  );
}

function MenuItem({
  icon, label, onClick, danger,
}: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 text-[15px] font-medium active:opacity-60"
      style={{
        color: danger ? '#EF4444' : 'var(--text-primary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {label}
      {icon}
    </button>
  );
}
