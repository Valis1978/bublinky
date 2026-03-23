import { createAdminClient } from '@/lib/supabase/admin';
import type { BubMessage, MessageType } from '@/types/database';

function getClient() {
  return createAdminClient();
}

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
};
