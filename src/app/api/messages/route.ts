import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/services/chat.service';
import type { MessageType } from '@/types/database';

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

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
