import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ReadingLogEntry, ReadingStatus } from '@/types/story';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

const VALID_STATUSES: ReadingStatus[] = ['wishlist', 'reading', 'done'];
const MAX_TITLE_LENGTH = 200;

interface ReadingLogRow {
  id: string;
  book_title: string;
  author: string | null;
  cameo_id: string | null;
  status: ReadingStatus;
  created_at: string;
  finished_at: string | null;
}

/** GET /api/reading-log?userId=xxx — list a child's reading log ("Čtenářský deníček") */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('bub_reading_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Map snake_case DB rows → camelCase ReadingLogEntry
    const entries: ReadingLogEntry[] = (data || []).map((row: ReadingLogRow) => ({
      id: row.id,
      bookTitle: row.book_title,
      author: row.author,
      cameoId: row.cameo_id,
      status: row.status,
      createdAt: row.created_at,
      finishedAt: row.finished_at,
    }));

    return NextResponse.json({ success: true, entries });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

/** POST /api/reading-log — add a book (default status 'wishlist'); returns the existing entry id if already logged */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, bookTitle, author, cameoId, status } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId required' }, { status: 400 });
    }

    const title = typeof bookTitle === 'string' ? bookTitle.trim() : '';
    if (!title || title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json({ success: false, error: 'bookTitle je povinný, max 200 znaků' }, { status: 400 });
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: 'Neplatný status' }, { status: 400 });
    }
    const entryStatus: ReadingStatus = status || 'wishlist';

    const supabase = getSupabaseAdmin();

    // Duplicate book for the same reader → return the existing entry instead of an error
    const { data: existing, error: existingError } = await supabase
      .from('bub_reading_log')
      .select('id')
      .eq('user_id', userId)
      .eq('book_title', title)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ success: false, error: existingError.message }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json({ success: true, id: existing.id });
    }

    const { data, error } = await supabase
      .from('bub_reading_log')
      .insert({
        user_id: userId,
        book_title: title,
        author: author || null,
        cameo_id: cameoId || null,
        status: entryStatus,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

/** PATCH /api/reading-log — update status; setting 'done' stamps finished_at */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: 'id a platný status jsou povinné' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const updates: Record<string, unknown> = { status };
    if (status === 'done') {
      updates.finished_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('bub_reading_log')
      .update(updates)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
