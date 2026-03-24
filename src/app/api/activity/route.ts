import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/activity — Log an activity event
export async function POST(req: NextRequest) {
  try {
    // Support both JSON and sendBeacon (text/plain)
    const contentType = req.headers.get('content-type') || '';
    let body: Record<string, unknown>;
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      body = JSON.parse(await req.text());
    }

    const { userId, eventType, eventData } = body as {
      userId: string;
      eventType: string;
      eventData?: Record<string, unknown>;
    };
    if (!userId || !eventType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('bub_activity_logs').insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData || {},
    });

    if (error) {
      console.error('Activity log error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send push notification to parent for important events
    if (eventType === 'app_open') {
      await notifyParent(supabase, 'Viki otevřela appku 📱');
    } else if (eventType === 'quiz_complete') {
      const topic = (eventData as Record<string, unknown>)?.topic || 'kvíz';
      const score = (eventData as Record<string, unknown>)?.score || '';
      await notifyParent(supabase, `Viki dokončila ${topic} ${score ? `(${score} bodů)` : ''} 🎯`);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// GET /api/activity?userId=xxx&limit=50 — Get activity feed (parent dashboard)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  const since = req.nextUrl.searchParams.get('since'); // ISO date

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const supabase = createAdminClient();
  let query = supabase
    .from('bub_activity_logs')
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

  return NextResponse.json(data || []);
}

// Push notification helper
async function notifyParent(
  supabase: ReturnType<typeof createAdminClient>,
  message: string
) {
  try {
    const { data: parent } = await supabase
      .from('bub_users')
      .select('id')
      .eq('role', 'parent')
      .single();

    if (!parent) return;

    const { data: subs } = await supabase
      .from('bub_push_subscriptions')
      .select('endpoint, keys')
      .eq('user_id', parent.id);

    if (!subs || subs.length === 0) return;

    const webpush = await import('web-push');
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    if (!vapidPublic || !vapidPrivate) return;

    webpush.setVapidDetails('mailto:admin@bublinky.mujagent.cz', vapidPublic, vapidPrivate);

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
          JSON.stringify({ title: 'Bublinky', body: message, icon: '/icons/icon-192x192.png' })
        );
      } catch { /* expired subscription */ }
    }
  } catch { /* non-critical */ }
}
