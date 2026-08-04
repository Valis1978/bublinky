// Saved interactive stories — the reader's own little bookshelf.
//
// GET  /api/stories?userId=...  -> last 20 stories
// POST /api/stories             -> save a finished story
//
// No counters, streaks or rewards are attached to reading — a story is saved
// simply so it can be read again.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SavedStory, StoryChoice, StorySegment } from '@/types/story';

const MAX_STORIES = 20;

interface StoryRow {
  id: string;
  title: string | null;
  genre: string | null;
  segments: unknown;
  cameo_id: string | null;
  created_at: string;
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Keep only the fields the client contract knows about. */
function normalizeSegment(raw: unknown): StorySegment | null {
  if (!raw || typeof raw !== 'object') return null;
  const seg = raw as Record<string, unknown>;

  const text = typeof seg.text === 'string' ? seg.text : '';
  if (text.trim().length === 0) return null;

  const choices: StoryChoice[] = Array.isArray(seg.choices)
    ? seg.choices
        .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
        .map((c) => ({ id: asString(c.id) ?? '', label: asString(c.label) ?? '' }))
        .filter((c) => c.id.length > 0 && c.label.length > 0)
    : [];

  const normalized: StorySegment = { text, choices };
  const chosen = asString(seg.chosen);
  if (chosen) normalized.chosen = chosen;
  const cameoId = asString(seg.cameoId);
  if (cameoId) normalized.cameoId = cameoId;

  return normalized;
}

function normalizeSegments(raw: unknown): StorySegment[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeSegment).filter((s): s is StorySegment => s !== null);
}

export async function GET(request: NextRequest) {
  const userId = asString(request.nextUrl.searchParams.get('userId'));
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Chybí userId' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('bub_stories')
      .select('id, title, genre, segments, cameo_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_STORIES);

    if (error) {
      console.error('[Stories GET] supabase error:', error);
      return NextResponse.json({ success: false, error: 'Příběhy se nepodařilo načíst' }, { status: 500 });
    }

    const stories: SavedStory[] = ((data ?? []) as StoryRow[]).map((row) => ({
      id: row.id,
      title: asString(row.title) ?? 'Příběh bez názvu',
      genre: asString(row.genre) ?? '',
      segments: normalizeSegments(row.segments),
      cameoId: asString(row.cameo_id) ?? null,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ success: true, stories });
  } catch (err) {
    console.error('[Stories GET] failed:', err);
    return NextResponse.json({ success: false, error: 'Příběhy se nepodařilo načíst' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const raw: unknown = await request.json();
    if (!raw || typeof raw !== 'object') throw new Error('body is not an object');
    body = raw as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Neplatný požadavek' }, { status: 400 });
  }

  const userId = asString(body.userId);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Chybí userId' }, { status: 400 });
  }

  const segments = normalizeSegments(body.segments);
  if (segments.length === 0) {
    return NextResponse.json({ success: false, error: 'Příběh nemá žádné části' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('bub_stories')
      .insert({
        user_id: userId,
        title: asString(body.title) ?? 'Příběh bez názvu',
        genre: asString(body.genre) ?? '',
        segments,
        cameo_id: asString(body.cameoId) ?? null,
        moral: asString(body.moral) ?? null,
        finished: true,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('[Stories POST] supabase error:', error);
      return NextResponse.json({ success: false, error: 'Příběh se nepodařilo uložit' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: (data as { id: string }).id });
  } catch (err) {
    console.error('[Stories POST] failed:', err);
    return NextResponse.json({ success: false, error: 'Příběh se nepodařilo uložit' }, { status: 500 });
  }
}
