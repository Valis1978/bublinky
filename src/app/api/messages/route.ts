import { NextRequest, NextResponse } from 'next/server';
import { chatService, REACTION_EMOJIS } from '@/services/chat.service';
import { createClient } from '@supabase/supabase-js';
import type { MessageType } from '@/types/database';
import { SERVER_META_KEYS, previewOf, type ChatMeta } from '@/lib/chat-meta';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const before = searchParams.get('before') || undefined;

  const { data, error } = await chatService.getMessages(limit, before);

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }

  // Update last seen
  await chatService.updateLastSeen(userId);

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, type = 'text', media_url, media_metadata, reply_to_id } = body as {
      content?: string;
      type?: MessageType;
      media_url?: string;
      media_metadata?: Record<string, unknown>;
      reply_to_id?: string;
    };

    if (!content && !media_url) {
      return NextResponse.json(
        { success: false, error: 'Message content or media required' },
        { status: 400 }
      );
    }

    // Reply/edit/delete markers are server-owned; never trust them from the client
    const meta: ChatMeta = { ...(media_metadata ?? {}) };
    for (const key of SERVER_META_KEYS) delete meta[key];

    if (reply_to_id && typeof reply_to_id === 'string') {
      const { data: quoted } = await getSupabaseAdmin()
        .from('bub_messages')
        .select('id, sender_id, type, content, media_metadata')
        .eq('id', reply_to_id)
        .maybeSingle();
      if (quoted && !(quoted.media_metadata as ChatMeta | null)?.deleted_at) {
        meta.reply_to = {
          id: quoted.id,
          sender_id: quoted.sender_id,
          type: quoted.type,
          preview: previewOf(quoted),
        };
      }
    }

    const { data, error } = await chatService.sendMessage(
      userId,
      content || null,
      type,
      media_url,
      Object.keys(meta).length > 0 ? meta : undefined
    );

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    // Send push notification to the OTHER user (parent only)
    try {
      // Get sender info
      const { data: sender } = await getSupabaseAdmin()
        .from('bub_users')
        .select('name, role')
        .eq('id', userId)
        .single();

      // Find the parent user to notify (only notify parent, not child)
      const { data: parent } = await getSupabaseAdmin()
        .from('bub_users')
        .select('id')
        .eq('role', 'parent')
        .neq('id', userId)
        .single();

      if (parent && sender?.role === 'child') {
        // Only send push when CHILD sends message to PARENT
        const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || '';
        fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: parent.id,
            title: `💬 ${sender.name || 'Viki'}`,
            body: content?.substring(0, 100) || (type === 'photo' ? '📷 Fotka' : type === 'video' ? '🎥 Video' : '🎤 Hlasovka'),
            url: '/chat',
          }),
        }).catch(() => {}); // Fire and forget
      }
    } catch {
      // Non-critical, don't fail the message
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  // Authoritative identity — set by middleware from a verified session cookie,
  // never trust a client-supplied userId over this for the actual mutation.
  const authenticatedUserId = request.headers.get('x-user-id');
  if (!authenticatedUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { messageId, emoji, userId } = body as {
      messageId?: string;
      emoji?: string;
      userId?: string;
    };

    if (!messageId || typeof messageId !== 'string') {
      return NextResponse.json({ success: false, error: 'messageId is required' }, { status: 400 });
    }

    if (
      !emoji ||
      typeof emoji !== 'string' ||
      emoji.length > 8 ||
      !REACTION_EMOJIS.includes(emoji)
    ) {
      return NextResponse.json({ success: false, error: 'Invalid emoji' }, { status: 400 });
    }

    if (userId && userId !== authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Cannot toggle another user's reaction" },
        { status: 403 }
      );
    }

    const { data, error } = await chatService.toggleReaction(messageId, emoji, authenticatedUserId);

    if (error === 'Message not found') {
      return NextResponse.json({ success: false, error }, { status: 404 });
    }

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error || 'Reaction toggle failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reactions: data });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
