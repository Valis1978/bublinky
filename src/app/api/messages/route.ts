import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/services/chat.service';
import { createClient } from '@supabase/supabase-js';
import type { MessageType } from '@/types/database';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const { content, type = 'text', media_url, media_metadata } = body as {
      content?: string;
      type?: MessageType;
      media_url?: string;
      media_metadata?: Record<string, unknown>;
    };

    if (!content && !media_url) {
      return NextResponse.json(
        { success: false, error: 'Message content or media required' },
        { status: 400 }
      );
    }

    const { data, error } = await chatService.sendMessage(
      userId,
      content || null,
      type,
      media_url,
      media_metadata
    );

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    // Send push notification to the OTHER user (parent only)
    try {
      // Get sender info
      const { data: sender } = await supabaseAdmin
        .from('bub_users')
        .select('name, role')
        .eq('id', userId)
        .single();

      // Find the parent user to notify (only notify parent, not child)
      const { data: parent } = await supabaseAdmin
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
