'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages, type UiMessage } from '@/hooks/useMessages';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { STICKERS, stickerFile } from '@/lib/sticker-catalog';
import { previewOf } from '@/lib/chat-meta';
import { hapticWarn } from '@/lib/haptics';

interface ChatUser {
  id: string;
  name: string;
  role: 'parent' | 'child';
  avatar_url: string | null;
  last_seen_at: string | null;
}

/** Messages from the same sender this close together stack into one group. */
const GROUP_GAP_MS = 3 * 60 * 1000;
/** Within this distance from the bottom we keep following new messages. */
const NEAR_BOTTOM_PX = 120;

function lastSeenLabel(iso: string | null): string {
  if (!iso) return 'offline';
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'naposledy před chvílí';
  if (minutes < 60) return `naposledy před ${minutes} min`;
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  return sameDay ? `naposledy dnes v ${time}` : `naposledy ${d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })} v ${time}`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Dnes';
  if (d.toDateString() === yesterday.toDateString()) return 'Včera';
  return d.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' });
}

async function upload(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await res.json();
  return data.success && data.data?.url ? data.data.url : null;
}

export function ChatView() {
  const { user } = useAuth();
  const {
    messages, loading, hasOlder, loadingOlder, otherOnline, otherTyping,
    sendMessage, retryMessage, discardMessage, editMessage, deleteMessage,
    markAsRead, loadOlder, notifyTyping,
  } = useMessages(user?.id);
  // Subscribe to push notifications — only parent gets them
  usePushNotifications(user?.role === 'parent' ? user.id : null);

  const [users, setUsers] = useState<ChatUser[]>([]);
  const [replyTo, setReplyTo] = useState<UiMessage | null>(null);
  const [editing, setEditing] = useState<UiMessage | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);
  const firstIdRef = useRef<string | null>(null);
  const prevScrollHeight = useRef(0);

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setUsers(data))
      .catch(() => {});
  }, []);

  const names = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u.name])),
    [users]
  );
  // The person on the other end: oldest account of the other role
  const other = useMemo(
    () => users.find((u) => u.role !== user?.role) ?? null,
    [users, user?.role]
  );

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // New messages: follow them when we're at the bottom (or sent them), else count them
  useEffect(() => {
    const added = messages.length - lastCountRef.current;
    const firstId = messages[0]?.id ?? null;
    const prependedOlder = firstIdRef.current !== null && firstId !== firstIdRef.current;
    lastCountRef.current = messages.length;
    firstIdRef.current = firstId;
    if (added <= 0 || prependedOlder) return;

    const last = messages[messages.length - 1];
    if (atBottom || last?.sender_id === user?.id) {
      scrollToBottom(added < 5);
    } else {
      setUnseenCount((c) => c + added);
    }
  }, [messages, atBottom, user?.id, scrollToBottom]);

  // Keep the viewport steady when older messages are prepended above it
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !prevScrollHeight.current) return;
    el.scrollTop += el.scrollHeight - prevScrollHeight.current;
    prevScrollHeight.current = 0;
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    setAtBottom(nearBottom);
    if (nearBottom) setUnseenCount(0);
    if (el.scrollTop < 80 && hasOlder && !loadingOlder) {
      prevScrollHeight.current = el.scrollHeight;
      void loadOlder();
    }
  };

  // Mark received messages as read
  useEffect(() => {
    if (!user) return;
    const unread = messages.filter((m) => m.sender_id !== user.id && !m.read_at && !m.status);
    if (unread.length > 0) {
      markAsRead(unread.map((m) => m.id));
    }
  }, [messages, user, markAsRead]);

  const jumpTo = useCallback((id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightId(id);
    setTimeout(() => setHighlightId(null), 1400);
  }, []);

  const startReply = (message: UiMessage) => {
    setEditing(null);
    setReplyTo(message);
  };

  const startEdit = (message: UiMessage) => {
    setReplyTo(null);
    setEditing(message);
  };

  const handleDelete = async (message: UiMessage) => {
    const result = await deleteMessage(message.id);
    if (!result.success) void hapticWarn();
  };

  const handleSend = async (content: string) => {
    if (editing) {
      const target = editing;
      setEditing(null);
      if (content !== target.content) {
        const result = await editMessage(target.id, content);
        if (!result.success) void hapticWarn();
      }
      return;
    }
    const replyToId = replyTo?.id;
    setReplyTo(null);
    await sendMessage({ content, type: 'text', replyToId });
  };

  const sendMedia = async (file: File, type: 'photo' | 'video' | 'voice') => {
    const replyToId = replyTo?.id;
    setReplyTo(null);
    const url = await upload(file);
    if (url) await sendMessage({ content: null, type, mediaUrl: url, replyToId });
    else void hapticWarn();
  };

  const handleVoice = async (blob: Blob) => {
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    await sendMedia(new File([blob], `voice.${ext}`, { type: blob.type }), 'voice');
  };

  const handleSticker = (stickerId: string) => {
    const sticker = STICKERS[stickerId];
    if (!sticker) return;
    const replyToId = replyTo?.id;
    setReplyTo(null);
    void sendMessage({ content: sticker.name, type: 'sticker', mediaUrl: stickerFile(stickerId), replyToId });
  };

  // Group by day, and mark which bubbles stack with their neighbours
  const rows = useMemo(() => {
    const list: (
      | { kind: 'day'; label: string; key: string }
      | { kind: 'msg'; message: UiMessage; joinsPrev: boolean; joinsNext: boolean }
    )[] = [];
    let lastDay = '';
    messages.forEach((m, i) => {
      const day = new Date(m.created_at).toDateString();
      if (day !== lastDay) {
        lastDay = day;
        list.push({ kind: 'day', label: dayLabel(m.created_at), key: `day-${day}` });
      }
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const joins = (a?: UiMessage, b?: UiMessage) =>
        !!a && !!b && a.sender_id === b.sender_id &&
        new Date(a.created_at).toDateString() === new Date(b.created_at).toDateString() &&
        Math.abs(new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) < GROUP_GAP_MS;
      list.push({ kind: 'msg', message: m, joinsPrev: joins(prev, m), joinsNext: joins(m, next) });
    });
    return list;
  }, [messages]);

  const status = otherTyping
    ? 'píše…'
    : otherOnline
      ? 'online'
      : lastSeenLabel(other?.last_seen_at ?? null);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-3 border-t-transparent rounded-full"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 flex-1">
      {/* Header — who's on the other end and what they're doing */}
      <div
        className="flex items-center gap-3 px-4 pb-2.5 safe-top flex-shrink-0 z-10"
        style={{
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="relative mt-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {other?.avatar_url ? (
              <img src={other.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (other?.name ?? '?').slice(0, 1)
            )}
          </div>
          <AnimatePresence>
            {otherOnline && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500"
                style={{ border: '2px solid var(--bg-primary)' }}
              />
            )}
          </AnimatePresence>
        </div>
        <div className="mt-2 min-w-0">
          <p className="font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
            {other?.name ?? 'Chat'}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={status}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs leading-tight"
              style={{ color: otherTyping || otherOnline ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              {status}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden py-3"
        style={{ paddingBottom: 'calc(9rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {loadingOlder && (
          <div className="flex justify-center py-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-t-transparent rounded-full"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
          </div>
        )}
        {!hasOlder && messages.length > 0 && (
          <p className="text-center text-[11px] py-2" style={{ color: 'var(--text-muted)' }}>
            Začátek konverzace 💬
          </p>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl"
            >
              💬
            </motion.div>
            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Zatím žádné zprávy.
              <br />
              Napiš první!
            </p>
          </div>
        ) : (
          rows.map((row) =>
            row.kind === 'day' ? (
              <div key={row.key} className="flex justify-center my-3">
                <span
                  className="text-[11px] font-medium px-3 py-1 rounded-full"
                  style={{ background: 'var(--accent-soft)', color: 'var(--text-muted)' }}
                >
                  {row.label}
                </span>
              </div>
            ) : (
              <MessageBubble
                key={row.message.id}
                message={row.message}
                isMine={row.message.sender_id === user?.id}
                currentUserId={user?.id}
                names={names}
                joinsPrev={row.joinsPrev}
                joinsNext={row.joinsNext}
                highlighted={highlightId === row.message.id}
                onReply={startReply}
                onEdit={startEdit}
                onDelete={handleDelete}
                onRetry={retryMessage}
                onDiscard={discardMessage}
                onJumpTo={jumpTo}
              />
            )
          )
        )}

        {/* Typing indicator bubble */}
        <AnimatePresence>
          {otherTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="px-4 mb-2"
            >
              <div
                className="inline-flex items-center gap-1 px-4 py-3"
                style={{
                  background: 'var(--bubble-received)',
                  borderRadius: 'var(--radius) var(--radius) var(--radius) 6px',
                  boxShadow: 'var(--shadow)',
                }}
                aria-label={`${other?.name ?? ''} píše`}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'var(--text-muted)' }}
                    animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Jump-to-latest button with unseen counter */}
      <AnimatePresence>
        {!atBottom && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setUnseenCount(0);
              scrollToBottom();
            }}
            className="fixed right-4 z-40 w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              bottom: 'calc(9.5rem + env(safe-area-inset-bottom, 0px))',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-lg)',
              color: 'var(--accent)',
            }}
            aria-label="Na poslední zprávu"
          >
            <ChevronDown size={22} />
            {unseenCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold text-white flex items-center justify-center"
                style={{ background: 'var(--accent-gradient)' }}
              >
                {unseenCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input area — above BottomNav (h-16 + safe-area) */}
      <div
        className="fixed left-0 right-0 z-40"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <MessageInput
          key={editing?.id ?? 'compose'}
          onSend={handleSend}
          onPhoto={(file) => sendMedia(file, file.type.startsWith('video/') ? 'video' : 'photo')}
          onVideo={(file) => sendMedia(file, 'video')}
          onVoice={handleVoice}
          onSticker={handleSticker}
          onTyping={notifyTyping}
          replyTo={
            replyTo
              ? {
                  name: replyTo.sender_id === user?.id ? 'sebe' : names[replyTo.sender_id] ?? '…',
                  preview: previewOf(replyTo),
                }
              : null
          }
          onCancelReply={() => setReplyTo(null)}
          editing={!!editing}
          initialText={editing?.content ?? ''}
          onCancelEdit={() => setEditing(null)}
        />
      </div>
    </div>
  );
}
