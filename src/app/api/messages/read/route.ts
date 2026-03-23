import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/services/chat.service';

export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message_ids } = (await request.json()) as { message_ids: string[] };

    if (!message_ids?.length) {
      return NextResponse.json(
        { success: false, error: 'message_ids required' },
        { status: 400 }
      );
    }

    const { error } = await chatService.markAsRead(message_ids);

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
