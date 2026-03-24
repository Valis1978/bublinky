import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST — store GPS position (from child's device)
export async function POST(req: NextRequest) {
  try {
    const { user_id, latitude, longitude, accuracy, altitude, speed, heading } = await req.json();

    if (!user_id || latitude == null || longitude == null) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('bub_location_history').insert({
      user_id,
      latitude,
      longitude,
      accuracy: accuracy || null,
      altitude: altitude || null,
      speed: speed || null,
      heading: heading || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// GET — retrieve location history (for dad dashboard)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  const since = req.nextUrl.searchParams.get('since');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const supabase = createAdminClient();
  let query = supabase
    .from('bub_location_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gte('created_at', since);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}
