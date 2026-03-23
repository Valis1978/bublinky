'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { motion } from 'framer-motion';

export function ChatView() {
  const { user } = useAuth();
  const { messages, loading, sendMessage, markAsRead } = useMessages(user?.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark received messages as read
  useEffect(() => {
    if (!user) return;
    const unread = messages.filter(
      (m) => m.sender_id !== user.id && !m.read_at
    );
    if (unread.length > 0) {
      markAsRead(unread.map((m) => m.id));
    }
  }, [messages, user, markAsRead]);

  const handleSend = (content: string) => {
    sendMessage(content, 'text');
  };

  const handlePhoto = async (file: File) => {
    // Upload photo
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.success && data.data?.url) {
      sendMessage(null as unknown as string, 'photo', data.data.url);
    }
  };

  const handleVoice = async (blob: Blob) => {
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([blob], `voice.${ext}`, { type: blob.type });
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.success && data.data?.url) {
      sendMessage(null as unknown as string, 'voice', data.data.url);
    }
  };

  const handleVideo = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.success && data.data?.url) {
      sendMessage(null as unknown as string, 'video' as 'text', data.data.url);
    }
  };

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

  // Group messages by date
  const groupedByDate: { date: string; messages: typeof messages }[] = [];
  let currentDate = '';

  for (const msg of messages) {
    const msgDate = new Date(msg.created_at).toLocaleDateString('cs-CZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedByDate.push({ date: msgDate, messages: [msg] });
    } else {
      groupedByDate[groupedByDate.length - 1].messages.push(msg);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4"
        style={{ paddingBottom: '80px' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl"
            >
              💬
            </motion.div>
            <p
              className="text-center text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Zatím žádné zprávy.
              <br />
              Napiš první!
            </p>
          </div>
        ) : (
          groupedByDate.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex justify-center my-4">
                <span
                  className="text-[11px] font-medium px-3 py-1 rounded-full"
                  style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {group.date}
                </span>
              </div>
              {group.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.sender_id === user?.id}
                />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="fixed bottom-16 left-0 right-0 z-40">
        <MessageInput onSend={handleSend} onPhoto={handlePhoto} onVideo={handleVideo} onVoice={handleVoice} />
      </div>
    </div>
  );
}
