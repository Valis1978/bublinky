import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { readMeta, withinEditWindow } from '@/lib/chat-meta';

const MAX_LENGTH = 4000;

/** Load a message the caller may still change: their own, not deleted, within the edit window. */
async function loadOwnEditable(id: string, userId: string) {
  const supabase = createAdminClient();
  const { data: message, error } = await supabase
    .from('bub_messages')
    .select('id, sender_id, type, content, media_metadata, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) return { error: NextResponse.json({ success: false, error: error.message }, { status: 500 }) };
  if (!message) return { error: NextResponse.json({ success: false, error: 'Zpráva nenalezena' }, { status: 404 }) };
  if (message.sender_id !== userId) {
    return { error: NextResponse.json({ success: false, error: 'Cizí zprávu nejde měnit' }, { status: 403 }) };
  }
  const meta = readMeta(message.media_metadata);
  if (meta.deleted_at) {
    return { error: NextResponse.json({ success: false, error: 'Zpráva je smazaná' }, { status: 409 }) };
  }
  if (!withinEditWindow(message.created_at)) {
    return { error: NextResponse.json({ success: false, error: 'Na úpravu je to už moc staré' }, { status: 409 }) };
  }
  return { supabase, message, meta };
}

/** Edit the text of your own message. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  try {
    const { content } = (await request.json()) as { content?: string };
    const trimmed = typeof content === 'string' ? content.trim() : '';
    if (!trimmed || trimmed.length > MAX_LENGTH) {
      return NextResponse.json({ success: false, error: 'Neplatný text' }, { status: 400 });
    }

    const loaded = await loadOwnEditable(id, userId);
    if ('error' in loaded) return loaded.error;
    if (loaded.message.type !== 'text') {
      return NextResponse.json({ success: false, error: 'Upravit jde jen text' }, { status: 400 });
    }

    const { data, error } = await loaded.supabase
      .from('bub_messages')
      .update({
        content: trimmed,
        media_metadata: { ...loaded.meta, edited_at: new Date().toISOString() },
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

/** Unsend your own message for everyone — the row stays as a "deleted" placeholder. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const loaded = await loadOwnEditable(id, userId);
  if ('error' in loaded) return loaded.error;

  const { data, error } = await loaded.supabase
    .from('bub_messages')
    .update({
      content: null,
      media_url: null,
      reactions: {},
      media_metadata: { deleted_at: new Date().toISOString() },
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
