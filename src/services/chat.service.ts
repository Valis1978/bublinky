import { createAdminClient } from '@/lib/supabase/admin';
import type { BubMessage, MessageType } from '@/types/database';

function getClient() {
  return createAdminClient();
}

// ============================================================
// Reactions + stickers — local type additions
// The DB migration (bub_messages.reactions JSONB DEFAULT '{}',
// type now allows 'sticker') is already applied. src/types/database.ts
// itself is owned by a parallel task, so we widen locally here instead
// of editing it, and reuse this shape from the chat components.
// ============================================================

/** { [emoji]: userId[] } */
export type ChatReactions = Record<string, string[]>;

export interface ChatMessage extends Omit<BubMessage, 'type'> {
  type: MessageType | 'sticker';
  reactions?: ChatReactions;
}

/** Single source of truth for allowed reaction emoji — shared by the picker UI and the API validation. */
export const REACTION_EMOJIS: readonly string[] = ['❤️', '😂', '😮', '👍', '🎉', '🥰'];

export const chatService = {
  async getMessages(
    limit = 50,
    before?: string
  ): Promise<{ data: BubMessage[]; error?: string }> {
    const supabase = getClient();
    let query = supabase
      .from('bub_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: error.message };
    }

    // Return in chronological order (oldest first)
    return { data: (data as BubMessage[]).reverse() };
  },

  async sendMessage(
    senderId: string,
    content: string | null,
    type: MessageType = 'text',
    mediaUrl?: string,
    mediaMetadata?: Record<string, unknown>
  ): Promise<{ data: BubMessage | null; error?: string }> {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('bub_messages')
      .insert({
        sender_id: senderId,
        content,
        type,
        media_url: mediaUrl || null,
        media_metadata: mediaMetadata || null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as BubMessage };
  },

  async markAsRead(messageIds: string[]): Promise<{ error?: string }> {
    const supabase = getClient();
    const { error } = await supabase
      .from('bub_messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds)
      .is('read_at', null);

    if (error) {
      return { error: error.message };
    }

    return {};
  },

  async getUnreadCount(userId: string): Promise<number> {
    const supabase = getClient();
    const { count, error } = await supabase
      .from('bub_messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .is('read_at', null);

    if (error) return 0;
    return count || 0;
  },

  async updateLastSeen(userId: string): Promise<void> {
    const supabase = getClient();
    await supabase
      .from('bub_users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId);
  },

  /** Toggle userId in reactions[emoji] on a message; drops the emoji key when its list empties. */
  async toggleReaction(
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<{ data: ChatReactions | null; error?: string }> {
    const supabase = getClient();

    const { data: existing, error: fetchError } = await supabase
      .from('bub_messages')
      .select('reactions')
      .eq('id', messageId)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: fetchError?.message || 'Message not found' };
    }

    const currentReactions = (existing as { reactions: ChatReactions | null }).reactions ?? {};
    const holders = currentReactions[emoji] ?? [];
    const nextHolders = holders.includes(userId)
      ? holders.filter((id) => id !== userId)
      : [...holders, userId];

    const nextReactions: ChatReactions = { ...currentReactions };
    if (nextHolders.length === 0) {
      delete nextReactions[emoji];
    } else {
      nextReactions[emoji] = nextHolders;
    }

    const { data: updated, error: updateError } = await supabase
      .from('bub_messages')
      .update({ reactions: nextReactions })
      .eq('id', messageId)
      .select('reactions')
      .single();

    if (updateError || !updated) {
      return { data: null, error: updateError?.message || 'Update failed' };
    }

    return { data: (updated as { reactions: ChatReactions | null }).reactions ?? {} };
  },
};

/**
 * Client-callable helper — hits the PATCH endpoint directly (no admin client involved),
 * so it's safe to import from client components like MessageBubble.
 */
export async function toggleReaction(
  messageId: string,
  emoji: string,
  userId: string
): Promise<{ success: boolean; reactions?: ChatReactions; error?: string }> {
  try {
    const res = await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, emoji, userId }),
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Network error' };
  }
}
