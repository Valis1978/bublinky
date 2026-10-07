'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage } from '@/services/chat.service';
import type { MessageType } from '@/types/database';

export type SendType = MessageType | 'sticker';

/** A message as the UI sees it — server rows plus optimistic local ones. */
export interface UiMessage extends ChatMessage {
  /** Only set on optimistic rows that haven't been confirmed yet. */
  status?: 'sending' | 'failed';
}

interface SendArgs {
  content: string | null;
  type?: SendType;
  mediaUrl?: string;
  replyToId?: string;
}

const PAGE_SIZE = 50;
const TYPING_TTL_MS = 4000;

let tempCounter = 0;

export function useMessages(userId: string | undefined) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasOlder, setHasOlder] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const pendingSends = useRef(new Map<string, SendArgs>());
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef(0);

  // Realtime carries no message content: bub_messages is not readable with the
  // public anon key, so a change is announced with a content-free "sync" ping
  // and the other side refetches through the authenticated API.
  const ping = useCallback(() => {
    void channelRef.current?.send({ type: 'broadcast', event: 'sync', payload: {} });
  }, []);

  /** Merge server rows in, keeping optimistic rows that are still in flight. */
  const mergeServer = useCallback((rows: UiMessage[]) => {
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      for (const row of rows) byId.set(row.id, row);
      return [...byId.values()].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?limit=${PAGE_SIZE}`);
      const data = await res.json();
      if (data.success) {
        mergeServer(data.data);
        if (data.data.length < PAGE_SIZE) setHasOlder(false);
      }
    } finally {
      setLoading(false);
    }
  }, [mergeServer]);

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasOlder) return;
    const oldest = messages.find((m) => !m.status);
    if (!oldest) return;
    setLoadingOlder(true);
    try {
      const res = await fetch(
        `/api/messages?limit=${PAGE_SIZE}&before=${encodeURIComponent(oldest.created_at)}`
      );
      const data = await res.json();
      if (data.success) {
        mergeServer(data.data);
        if (data.data.length < PAGE_SIZE) setHasOlder(false);
      }
    } finally {
      setLoadingOlder(false);
    }
  }, [messages, loadingOlder, hasOlder, mergeServer]);

  const deliver = useCallback(async (tempId: string, args: SendArgs) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: args.content,
          type: args.type ?? 'text',
          media_url: args.mediaUrl,
          reply_to_id: args.replyToId,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.data) throw new Error(data.error || 'send failed');
      pendingSends.current.delete(tempId);
      ping();
      // Swap the optimistic row for the real one (realtime may have added it already)
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        return withoutTemp.some((m) => m.id === data.data.id)
          ? withoutTemp
          : [...withoutTemp, data.data];
      });
      return data;
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
      );
      return { success: false };
    }
  }, [ping]);

  /** Show the message instantly, then confirm it with the server. */
  const sendMessage = useCallback(
    async (args: SendArgs) => {
      if (!userId) return { success: false };
      const tempId = `temp-${Date.now()}-${tempCounter++}`;
      const replyTo = args.replyToId ? messages.find((m) => m.id === args.replyToId) : undefined;
      const optimistic: UiMessage = {
        id: tempId,
        sender_id: userId,
        content: args.content,
        type: (args.type ?? 'text') as UiMessage['type'],
        media_url: args.mediaUrl ?? null,
        media_metadata: replyTo
          ? ({
              reply_to: {
                id: replyTo.id,
                sender_id: replyTo.sender_id,
                type: replyTo.type,
                preview: replyTo.content ?? '',
              },
            } as unknown as UiMessage['media_metadata'])
          : null,
        read_at: null,
        created_at: new Date().toISOString(),
        reactions: {},
        status: 'sending',
      };
      pendingSends.current.set(tempId, args);
      setMessages((prev) => [...prev, optimistic]);
      return deliver(tempId, args);
    },
    [userId, messages, deliver]
  );

  const retryMessage = useCallback(
    (tempId: string) => {
      const args = pendingSends.current.get(tempId);
      if (!args) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'sending' } : m))
      );
      void deliver(tempId, args);
    },
    [deliver]
  );

  const discardMessage = useCallback((tempId: string) => {
    pendingSends.current.delete(tempId);
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }, []);

  const editMessage = useCallback(async (id: string, content: string) => {
    const res = await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (data.success && data.data) {
      setMessages((prev) => prev.map((m) => (m.id === id ? data.data : m)));
      ping();
    }
    return data as { success: boolean; error?: string };
  }, [ping]);

  const deleteMessage = useCallback(async (id: string) => {
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success && data.data) {
      setMessages((prev) => prev.map((m) => (m.id === id ? data.data : m)));
      ping();
    }
    return data as { success: boolean; error?: string };
  }, [ping]);

  /** After a reaction toggle: pull the fresh state and tell the other side. */
  const syncNow = useCallback(async () => {
    await fetchMessages();
    ping();
  }, [fetchMessages, ping]);

  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!messageIds.length) return;
    // Mark locally first so the read effect doesn't fire again for the same ids
    const readAt = new Date().toISOString();
    setMessages((prev) => prev.map((m) => (messageIds.includes(m.id) ? { ...m, read_at: readAt } : m)));
    await fetch('/api/messages/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_ids: messageIds }),
    });
    // Let the sender's ✓ turn into ✓✓
    ping();
  }, [ping]);

  /** Tell the other side we're typing — throttled to one broadcast per 2 s. */
  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (!channelRef.current || !userId || now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;
    void channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId } });
  }, [userId]);

  // Realtime: sync pings, presence (online) and typing broadcasts
  useEffect(() => {
    if (!userId) return;

    fetchMessages();

    const supabase = createClient();
    const channel = supabase.channel('bub-chat', {
      config: { presence: { key: userId } },
    });

    channel
      .on('broadcast', { event: 'sync' }, () => {
        setOtherTyping(false);
        void fetchMessages();
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOtherOnline(Object.keys(state).some((key) => key !== userId));
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.userId === userId) return;
        setOtherTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setOtherTyping(false), TYPING_TTL_MS);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void channel.track({ online_at: new Date().toISOString() });
      });

    channelRef.current = channel;

    // Re-sync after the iOS app comes back to the foreground
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchMessages();
        void channel.track({ online_at: new Date().toISOString() });
      } else {
        void channel.untrack();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, fetchMessages]);

  return {
    messages,
    loading,
    hasOlder,
    loadingOlder,
    otherOnline,
    otherTyping,
    sendMessage,
    syncNow,
    retryMessage,
    discardMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    loadOlder,
    notifyTyping,
  };
}
