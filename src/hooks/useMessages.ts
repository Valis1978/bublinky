'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BubMessage } from '@/types/database';

export function useMessages(userId: string | undefined) {
  const [messages, setMessages] = useState<BubMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    const res = await fetch('/api/messages?limit=100');
    const data = await res.json();
    if (data.success) {
      setMessages(data.data);
    }
    setLoading(false);
  }, []);

  // Send a message
  const sendMessage = useCallback(
    async (content: string, type: 'text' | 'photo' | 'voice' = 'text', mediaUrl?: string) => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type, media_url: mediaUrl }),
      });
      const data = await res.json();
      // Optimistically add sent message + refetch for sync
      if (data.success && data.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.data.id)) return prev;
          return [...prev, data.data];
        });
      }
      return data;
    },
    []
  );

  // Mark messages as read
  const markAsRead = useCallback(
    async (messageIds: string[]) => {
      if (!messageIds.length) return;
      await fetch('/api/messages/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_ids: messageIds }),
      });
    },
    []
  );

  // Subscribe to realtime
  useEffect(() => {
    if (!userId) return;

    fetchMessages();

    const supabase = createClient();
    const channel = supabase
      .channel('bub-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bub_messages' },
        (payload) => {
          const newMsg = payload.new as BubMessage;
          setMessages((prev) => {
            // Deduplicate
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bub_messages' },
        (payload) => {
          const updated = payload.new as BubMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Reconnect on visibility change (iOS PWA wakeup)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchMessages(); // Sync missed messages
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId, fetchMessages]);

  return { messages, loading, sendMessage, markAsRead };
}
